// Apache-2.0 port of Maasea/sgmodule's pinned initplayback map-local rule.

function transform(context) {
  if (!/^https?:\/\/[\w-]+\.googlevideo\.com\/initplayback.+&oad/.test(context.request.url)) return null
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
