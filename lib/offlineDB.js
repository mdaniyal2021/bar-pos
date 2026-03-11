// IndexedDB helper for offline orders
const DB_NAME = 'bar-pos-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-orders';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'localId' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Save order locally
export async function saveOrderOffline(order) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const localOrder = {
            ...order,
            localId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            savedAt: new Date().toISOString(),
            synced: false,
        };
        const req = store.add(localOrder);
        req.onsuccess = () => resolve(localOrder);
        req.onerror = () => reject(req.error);
    });
}

// Get all pending orders
export async function getPendingOrders() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result.filter(o => !o.synced));
        req.onerror = () => reject(req.error);
    });
}

// Mark order as synced
export async function markOrderSynced(localId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(localId);
        getReq.onsuccess = () => {
            const order = getReq.result;
            if (order) {
                order.synced = true;
                const putReq = store.put(order);
                putReq.onsuccess = () => resolve();
                putReq.onerror = () => reject(putReq.error);
            } else {
                resolve();
            }
        };
        getReq.onerror = () => reject(getReq.error);
    });
}

// Delete synced order
export async function deleteOrder(localId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(localId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// Count pending orders
export async function getPendingCount() {
    const pending = await getPendingOrders();
    return pending.length;
}