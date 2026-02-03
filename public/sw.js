
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// --- PUSH EVENT LISTENER (Standard VAPID) ---
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Orbit Update';
    const options = {
      body: data.message,
      icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png',
      data: { url: data.url || '/' },
      tag: data.tag || 'orbit-general',
      renotify: true,
      vibrate: [200, 100, 200, 100, 200], // Distinct vibration pattern
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error processing push event:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  // Open the app or focus if already open
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Try to find existing window
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. Open new window if none found
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});
