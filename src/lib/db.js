// في ملف src/lib/db.js
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DevicesArchiveDB', 3);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('devices')) {
        const store = db.createObjectStore('devices', { keyPath: 'id' });
        store.createIndex('by_date', 'delivery_date', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDevices(devices) {
  const db = await initDB();
  const tx = db.transaction('devices', 'readwrite');
  const store = tx.objectStore('devices');
  
  // تقسيم البيانات إلى دفعات (batches) لتجنب تجاوز الذاكرة
  const BATCH_SIZE = 5000;
  for (let i = 0; i < devices.length; i += BATCH_SIZE) {
    const batch = devices.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(device => store.put(device)));
  }
}