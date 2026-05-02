// Service Worker for NurAl Daily Reminders
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Store schedule in IndexedDB for persistence
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NurAlDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveSchedule(time) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key: 'scheduleTime', value: time });
      store.put({ key: 'scheduleEnabled', value: true });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function loadSchedule() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get('scheduleTime');
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  });
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SET_REMINDER') {
    const time = event.data.time;
    saveSchedule(time).then(() => {
      scheduleDailyReminder(time);
    });
  }
});

function scheduleDailyReminder(time) {
  const [hours, minutes] = time.split(':').map(Number);
  
  function checkAndNotify() {
    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(hours, minutes, 0, 0);
    
    if (Math.abs(now - scheduled) < 60000) {
      self.registration.showNotification('NurAl Reminder', {
        body: 'Time to read your daily verse!',
        icon: '/icon-192.png',
        tag: 'nural-daily-reminder',
        requireInteraction: true,
        actions: [
          { action: 'open', title: 'Read Now' }
        ]
      });
    }
    
    setTimeout(checkAndNotify, 60000);
  }
  
  checkAndNotify();
}

// Load saved schedule on activation
loadSchedule().then(time => {
  if (time) {
    scheduleDailyReminder(time);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    });
  }
});
