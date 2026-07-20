// GPL-3.0-only port of kokoryh/Sparkle's Bilibili request mocks.

function transform(context) {
  return {
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: '{}',
    },
  }
}
