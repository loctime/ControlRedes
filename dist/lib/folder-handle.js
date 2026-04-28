const DB_NAME = 'gsd-extension-db';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'source-folder';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, callback) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = callback(store);

    transaction.oncomplete = () => {
      db.close();
      resolve(result?.result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function saveHandle(handle) {
  await withStore('readwrite', (store) => store.put(handle, HANDLE_KEY));
  return handle;
}

export async function getStoredHandle() {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(HANDLE_KEY);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function pickFolderHandle() {
  const handle = await window.showDirectoryPicker({
    mode: 'readwrite',
  });
  await saveHandle(handle);
  return handle;
}

export async function reconnectFolderHandle() {
  const handle = await getStoredHandle();
  if (!handle) {
    return null;
  }

  const permission = await handle.queryPermission({ mode: 'readwrite' });
  if (permission === 'granted') {
    return handle;
  }

  const nextPermission = await handle.requestPermission({ mode: 'readwrite' });
  if (nextPermission !== 'granted') {
    return handle;
  }

  await saveHandle(handle);
  return handle;
}
