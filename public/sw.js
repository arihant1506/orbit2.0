
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'Orbit Update';
  const options = {
    body: data.message,
    icon: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png', // Orbit Icon
    badge: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png',
    data: { url: data.url || '/' }, // URL to open
    tag: data.tag || 'orbit-notification', // Prevents duplicate stacking
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  // Focus the window if it's already open, otherwise open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // If app is already open, focus it
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open it
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});