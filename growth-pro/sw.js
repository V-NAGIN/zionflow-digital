// Network-only by design: never retain account, billing or AI responses offline.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => new Response(
    '<!doctype html><meta name="viewport" content="width=device-width"><title>ZionFlow · Offline</title><body style="font:18px system-ui;background:#0b1f3a;color:white;padding:40px"><h1>You’re offline.</h1><p>Reconnect to securely access your ZionFlow workspace.</p><button onclick="location.reload()">Try again</button>',
    {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}}
  )));
});
