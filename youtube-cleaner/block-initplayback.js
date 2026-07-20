// Apache-2.0 port of Maasea/sgmodule's pinned initplayback map-local rule.

function transform(context) {
  console.info(`blocked YouTube ad playback request: ${context.request.url}`)
  return {
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: '',
    },
  }
}
