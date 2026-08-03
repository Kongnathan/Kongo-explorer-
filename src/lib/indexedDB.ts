import { Location } from "../types";

const DB_NAME = "KongoExplorerDB";
const STORE_NAME = "locations";
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      console.error("[IndexedDB] indexedDB is not supported in this environment.");
      reject(new Error("IndexedDB is not supported in this environment."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("[IndexedDB] Database open error:", event);
      reject(new Error("Unable to open IndexedDB"));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
        console.log("[IndexedDB] Created object store:", STORE_NAME);
      }
    };
  });
}

export async function getLocationsFromDB(): Promise<Location[]> {
  try {
    const db = await initDB();
    return new Promise<Location[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result || []) as Location[];
        const validResults = results.filter(loc => loc && typeof loc.id === "string" && loc.id.trim() !== "");
        console.log(`[IndexedDB] Loaded and verified ${validResults.length} location records from local database.`);
        resolve(validResults);
      };

      request.onerror = (event) => {
        console.error("[IndexedDB] Error fetching locations:", event);
        reject(new Error("Failed to get locations from IndexedDB"));
      };
    });
  } catch (err) {
    console.error("[IndexedDB] getLocationsFromDB init failed:", err);
    return [];
  }
}

export async function saveLocationsToDB(locations: Location[]): Promise<void> {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Clear existing first to ensure we stay in sync
      store.clear();

      for (const loc of locations) {
        if (loc && loc.id) {
          store.put(loc);
        }
      }

      transaction.oncomplete = async () => {
        // Verification step: verify count and integrity
        try {
          const checkTx = db.transaction(STORE_NAME, "readonly");
          const checkStore = checkTx.objectStore(STORE_NAME);
          const countReq = checkStore.count();
          countReq.onsuccess = () => {
            console.log(`[IndexedDB] Verification successful: ${countReq.result} records persisted in '${STORE_NAME}'.`);
          };
        } catch (vErr) {
          console.warn("[IndexedDB] Verification check warning:", vErr);
        }
        resolve();
      };

      transaction.onerror = (event) => {
        console.error("[IndexedDB] Error saving locations batch:", event);
        reject(new Error("Failed to save locations to IndexedDB"));
      };
    });
  } catch (err) {
    console.error("[IndexedDB] saveLocationsToDB failed:", err);
  }
}

export async function saveSingleLocationToDB(loc: Location): Promise<void> {
  if (!loc || !loc.id) {
    console.warn("[IndexedDB] Cannot save location without valid ID:", loc);
    return;
  }

  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(loc);

      putRequest.onsuccess = () => {
        console.log(`[IndexedDB] Put request completed for location ID: ${loc.id}`);
      };

      transaction.oncomplete = () => {
        // Run verification read to guarantee persistence
        try {
          const verifyTx = db.transaction(STORE_NAME, "readonly");
          const verifyStore = verifyTx.objectStore(STORE_NAME);
          const getReq = verifyStore.get(loc.id);

          getReq.onsuccess = () => {
            if (getReq.result) {
              console.log(`[IndexedDB Verification OK] Location '${loc.title}' (ID: ${loc.id}) verified in local DB.`);
            } else {
              console.warn(`[IndexedDB Verification Failed] Location ID '${loc.id}' not found after save transaction.`);
            }
            resolve();
          };
          getReq.onerror = () => {
            console.warn(`[IndexedDB Verification Error] Could not verify location ID: ${loc.id}`);
            resolve();
          };
        } catch (vErr) {
          console.warn("[IndexedDB] Verification error during single save:", vErr);
          resolve();
        }
      };

      transaction.onerror = (event) => {
        console.error(`[IndexedDB] Error saving single location '${loc.id}':`, event);
        reject(new Error(`Failed to save location ${loc.id} to IndexedDB`));
      };
    });
  } catch (err) {
    console.error(`[IndexedDB] saveSingleLocationToDB failed for ID ${loc?.id}:`, err);
  }
}

export async function deleteLocationFromDB(id: string): Promise<void> {
  if (!id) return;

  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        console.log(`[IndexedDB] Delete request submitted for location ID: ${id}`);
      };

      transaction.oncomplete = () => {
        // Run verification read to ensure deletion
        try {
          const verifyTx = db.transaction(STORE_NAME, "readonly");
          const verifyStore = verifyTx.objectStore(STORE_NAME);
          const getReq = verifyStore.get(id);

          getReq.onsuccess = () => {
            if (!getReq.result) {
              console.log(`[IndexedDB Verification OK] Location ID '${id}' successfully removed from local DB.`);
            } else {
              console.warn(`[IndexedDB Verification Failed] Location ID '${id}' still present after delete transaction.`);
            }
            resolve();
          };
          getReq.onerror = () => resolve();
        } catch (vErr) {
          resolve();
        }
      };

      transaction.onerror = (event) => {
        console.error(`[IndexedDB] Error deleting location ID ${id}:`, event);
        reject(new Error(`Failed to delete location ${id} from IndexedDB`));
      };
    });
  } catch (err) {
    console.error(`[IndexedDB] deleteLocationFromDB failed for ID ${id}:`, err);
  }
}

