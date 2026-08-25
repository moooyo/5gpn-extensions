package engine

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// The single marketplace URL is compiled into the core; no operator-configured
// source exists any more. The stub transport below serves the checked-out index
// at exactly this key, so it must stay byte-identical to the URL the runtime
// fetches or the review would silently reach the live published document.
const externalReviewCatalogURL = "https://moooyo.github.io/5gpn-extensions/marketplace/v2/index.json"

type externalReviewCorpusTransport struct {
	local     map[string][]byte
	ownedRoot string
	network   *http.Transport
}

func (t *externalReviewCorpusTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	if body, ok := t.local[request.URL.String()]; ok {
		contentType := "text/plain"
		if strings.HasSuffix(request.URL.Path, ".json") {
			contentType = "application/json"
		} else if strings.HasSuffix(request.URL.Path, ".yaml") {
			contentType = "application/yaml"
		}
		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(bytes.NewReader(body)),
			Header:     http.Header{"Content-Type": []string{contentType}},
			Request:    request,
		}, nil
	}
	if strings.HasPrefix(request.URL.String(), t.ownedRoot) {
		return &http.Response{
			StatusCode: http.StatusNotFound,
			Body:       io.NopCloser(strings.NewReader("not found")),
			Header:     make(http.Header),
			Request:    request,
		}, nil
	}
	return t.network.RoundTrip(request)
}

func externalReviewURL(root, revision, filename string) string {
	relative, err := filepath.Rel(root, filename)
	if err != nil {
		panic(err)
	}
	parts := strings.Split(filepath.ToSlash(relative), "/")
	for index := range parts {
		parts[index] = url.PathEscape(parts[index])
	}
	return "https://raw.githubusercontent.com/moooyo/5gpn-extensions/" + revision + "/" + strings.Join(parts, "/")
}

// TestExternalOfficialMarketplaceFullReviewCorpus is the publication gate for
// the maintained extension corpus. It runs each Marketplace entry through the
// same review, snapshot, document validation, goja and gojq compilation path an
// operator uses. Repository-owned commit URLs are served from the checked-out
// tree so the manifest digest is tied to the exact revision under test.
//
// Absolute third-party script URLs are intentionally fetched over the network.
// This makes the test non-hermetic, but it is the only honest full review of
// release assets the runtime itself fetches live. A network or publisher
// failure therefore fails publication instead of being replaced by stub code.
func TestExternalOfficialMarketplaceFullReviewCorpus(t *testing.T) {
	extensionsRoot := strings.TrimSpace(os.Getenv("FIVEGPN_EXTENSIONS_ROOT"))
	marketplacePath := strings.TrimSpace(os.Getenv("FIVEGPN_MARKETPLACE_INDEX"))
	if extensionsRoot == "" || marketplacePath == "" {
		t.Skip("FIVEGPN_EXTENSIONS_ROOT and FIVEGPN_MARKETPLACE_INDEX are not set")
	}

	root, err := filepath.Abs(extensionsRoot)
	if err != nil {
		t.Fatal(err)
	}
	indexBody, err := os.ReadFile(marketplacePath)
	if err != nil {
		t.Fatal(err)
	}
	var published struct {
		Metadata struct {
			Source struct {
				Revision string `json:"revision"`
			} `json:"source"`
		} `json:"metadata"`
		Entries []struct {
			ID string `json:"id"`
		} `json:"entries"`
	}
	if err := json.Unmarshal(indexBody, &published); err != nil {
		t.Fatalf("decode Marketplace fixture: %v", err)
	}
	if len(published.Entries) == 0 {
		t.Fatal("Marketplace fixture contains no extension entries")
	}
	revision := published.Metadata.Source.Revision
	if !validLowerHex(revision, 40) {
		t.Fatalf("Marketplace revision %q is not a Git commit", revision)
	}

	ownedRoot := "https://raw.githubusercontent.com/moooyo/5gpn-extensions/" + revision + "/"
	local := map[string][]byte{externalReviewCatalogURL: indexBody}
	manifestPaths, err := filepath.Glob(filepath.Join(root, "*", "extension.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	if len(manifestPaths) != len(published.Entries) {
		t.Fatalf("found %d manifests for %d Marketplace entries", len(manifestPaths), len(published.Entries))
	}
	for _, manifestPath := range manifestPaths {
		extensionRoot := filepath.Dir(manifestPath)
		err := filepath.WalkDir(extensionRoot, func(filename string, entry os.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if entry.IsDir() {
				return nil
			}
			body, err := os.ReadFile(filename)
			if err != nil {
				return err
			}
			local[externalReviewURL(root, revision, filename)] = body
			return nil
		})
		if err != nil {
			t.Fatalf("load %s: %v", extensionRoot, err)
		}
	}

	network := http.DefaultTransport.(*http.Transport).Clone()
	network.Proxy = nil
	network.DialContext = guardedDialer(func(ctx context.Context, host string) ([]string, error) {
		return net.DefaultResolver.LookupHost(ctx, host)
	})
	t.Cleanup(network.CloseIdleConnections)
	transport := &externalReviewCorpusTransport{local: local, ownedRoot: ownedRoot, network: network}
	importer := &Importer{
		client: &http.Client{
			Transport:     transport,
			Timeout:       45 * time.Second,
			CheckRedirect: redirectPolicy,
		},
		now: time.Now,
	}
	previousImporter := importerRef.Load()
	SetImporter(importer)
	t.Cleanup(func() { importerRef.Store(previousImporter) })

	document := `{
  "version": 7,
  "execution_order": [],
  "tls_cert": "/etc/5gpn/intercept/tls/fullchain.pem",
  "tls_key": "/etc/5gpn/intercept/tls/privkey.pem",
  "mitm": {"enabled": false, "http2": true, "http3": false}
}`
	statePath := filepath.Join(t.TempDir(), "interception.json")
	if err := os.WriteFile(statePath, []byte(document), 0o600); err != nil {
		t.Fatal(err)
	}
	workers, err := newWorkerController()
	if err != nil {
		t.Fatalf("start review worker controller: %v", err)
	}
	t.Cleanup(func() { _ = workers.Close() })
	store, err := newConfigStore(statePath, workers)
	if err != nil {
		t.Fatalf("open review state: %v", err)
	}
	engine := &Engine{config: store, workers: workers}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	seen := make(map[string]struct{}, len(published.Entries))
	for _, entry := range published.Entries {
		if _, duplicate := seen[entry.ID]; duplicate {
			t.Fatalf("Marketplace contains duplicate extension id %q", entry.ID)
		}
		seen[entry.ID] = struct{}{}
		candidate, err := engine.ReviewCatalogEntry(ctx, entry.ID)
		if err != nil {
			t.Errorf("full review %s: %v", entry.ID, err)
			continue
		}
		if candidate.Detail.ID != entry.ID || candidate.Digest == "" || candidate.Detail.SnapshotDigest != candidate.Digest {
			t.Errorf("full review %s returned inconsistent candidate %+v", entry.ID, candidate)
		}
	}
}
