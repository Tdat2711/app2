// js/db.js
(function(window){
  const DB_NAME = 'forgetmenot_db';
  const DB_VERSION = 1;
  const STORE_KV = 'kv';

  function openDB(){
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e){
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function put(key, value){
    const db = await openDB();
    if (!db) return localStorage.setItem(key, JSON.stringify(value));
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_KV, 'readwrite');
      const store = tx.objectStore(STORE_KV);
      store.put(value, key);
      tx.oncomplete = () => res(true);
      tx.onerror = () => res(false);
    });
  }

  async function get(key){
    const db = await openDB();
    if (!db) {
      const v = localStorage.getItem(key);
      try { return v ? JSON.parse(v) : null; } catch { return v; }
    }
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_KV, 'readonly');
      const store = tx.objectStore(STORE_KV);
      const req = store.get(key);
      req.onsuccess = () => res(req.result === undefined ? null : req.result);
      req.onerror = () => res(null);
    });
  }

  async function remove(key){
    const db = await openDB();
    if (!db) return localStorage.removeItem(key);
    return new Promise((res) => {
      const tx = db.transaction(STORE_KV, 'readwrite');
      const store = tx.objectStore(STORE_KV);
      store.delete(key);
      tx.oncomplete = () => res(true);
      tx.onerror = () => res(false);
    });
  }

  async function migrateFromLocalStorage(){
    const db = await openDB();
    if (!db) return false;
    try {
      for (let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        const v = localStorage.getItem(k);
        try { await put(k, JSON.parse(v)); } catch { await put(k, v); }
      }
      return true;
    } catch (e){
      return false;
    }
  }

  window.db = { get, put, remove, migrateFromLocalStorage };
})(window);