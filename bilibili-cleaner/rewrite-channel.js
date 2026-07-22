// GPL-3.0-only port of kokoryh/Sparkle's Bilibili channel rewrite.

function transform(context) {
  const rewritten = context.request.url.replace(
    /(&mobi_app=)iphone(?=&)/,
    '$1iphone_i',
  )

  if (rewritten === context.request.url) {
    return null
  }

  return {
    request: {
      url: rewritten,
    },
  }
}
