self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: "The Word Ministries International",
      body: event.data ? event.data.text() : "You have a new announcement.",
    };
  }

  const title = payload.title || "The Word Ministries International";

  const options = {
    body: payload.body || payload.message || "You have a new announcement.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      url: payload.url || "/",
    },
    vibrate: [100, 50, 100],
    tag: payload.tag || "church-announcement",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin)) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});
