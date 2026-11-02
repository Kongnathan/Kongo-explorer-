import { Location } from "../types";

const DB_NAME = "KongoExplorerDB";
const STORE_NAME = "locations";
const IMAGES_STORE = "offline_images";
const METADATA_STORE = "offline_metadata";
const DB_VERSION = 2;

export interface OfflineDownloadProgress {
  stage: "preparing" | "downloading" | "saving" | "complete" | "error";
  totalLocations: number;
  completedLocations: number;
  currentTitle: string;
  totalImages: number;
  completedImages: number;
  percent: number;
  totalBytes: number;
  error?: string;
}

export interface OfflineCacheStatus {
  locationsCount: number;
  imagesCount: number;
  lastDownloadedAt: string | null;
  totalBytes: number;
  estimatedMb: number;
  isFullyCached: boolean;
}

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
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE, { keyPath: "url" });
        console.log("[IndexedDB] Created object store:", IMAGES_STORE);
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: "key" });
        console.log("[IndexedDB] Created object store:", METADATA_STORE);
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

      store.clear();

      for (const loc of locations) {
        if (loc && loc.id) {
          store.put(loc);
        }
      }

      transaction.oncomplete = () => {
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
      store.put(loc);

      transaction.oncomplete = () => {
        resolve();
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
      store.delete(id);

      transaction.oncomplete = () => {
        resolve();
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

/**
 * Retrieves a cached image dataUrl from IndexedDB by URL
 */
export async function getCachedImage(url: string): Promise<string | null> {
  if (!url || typeof url !== "string") return null;
  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains(IMAGES_STORE)) return null;
    return new Promise<string | null>((resolve) => {
      const tx = db.transaction(IMAGES_STORE, "readonly");
      const store = tx.objectStore(IMAGES_STORE);
      const req = store.get(url);
      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Saves a single image dataUrl into IndexedDB
 */
export async function saveCachedImage(url: string, dataUrl: string, size?: number, contentType: string = "image/jpeg"): Promise<void> {
  if (!url || !dataUrl) return;
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IMAGES_STORE, "readwrite");
      const store = tx.objectStore(IMAGES_STORE);
      const estimatedSize = size || Math.round(dataUrl.length * 0.75);
      store.put({
        url,
        dataUrl,
        size: estimatedSize,
        contentType,
        timestamp: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    });
  } catch (e) {
    console.warn("[IndexedDB] Could not save cached image:", e);
  }
}

/**
 * Fetches an image URL and converts it to Base64 Data URL using fetch or Canvas fallback
 */
export async function fetchImageAsDataUrl(url: string): Promise<{ dataUrl: string; size: number } | null> {
  if (!url || typeof url !== "string" || url.trim() === "") return null;

  // 1. Direct Data URL
  if (url.startsWith("data:")) {
    return { dataUrl: url, size: Math.round(url.length * 0.75) };
  }

  // 2. Direct CORS fetch
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return { dataUrl, size: blob.size || dataUrl.length };
    }
  } catch {
    // Proceed to Canvas fallback
  }

  // 3. Fallback: Image element + offscreen canvas
  try {
    const dataUrl = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(img.naturalWidth || img.width || 800, 1200);
          canvas.height = Math.min(img.naturalHeight || img.height || 600, 900);
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

    if (dataUrl) {
      return { dataUrl, size: Math.round(dataUrl.length * 0.75) };
    }
  } catch {
    // Canvas failed
  }

  // 4. Try browser Cache Storage API if available
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open("kongo-images-cache-v1");
      await cache.add(new Request(url, { mode: "no-cors" }));
    } catch {
      // Ignore
    }
  }

  return null;
}

/**
 * Fetches and stores all locations text data AND photos into IndexedDB
 */
export async function downloadAllForOffline(
  locations: Location[],
  onProgress?: (progress: OfflineDownloadProgress) => void
): Promise<{ success: boolean; locationsCount: number; imagesCount: number; totalBytes: number; error?: string }> {
  if (!locations || locations.length === 0) {
    return {
      success: false,
      locationsCount: 0,
      imagesCount: 0,
      totalBytes: 0,
      error: "Aucune destination fournie pour le téléchargement.",
    };
  }

  const db = await initDB();
  const totalLocations = locations.length;

  // Gather unique image URLs
  const allImagesMap = new Map<string, string>(); // url -> locationTitle
  for (const loc of locations) {
    if (loc.image) allImagesMap.set(loc.image, loc.title);
    if (Array.isArray(loc.images)) {
      for (const img of loc.images) {
        if (img) allImagesMap.set(img, loc.title);
      }
    }
  }

  const totalImages = allImagesMap.size;
  let completedImages = 0;
  let totalBytes = 0;

  onProgress?.({
    stage: "preparing",
    totalLocations,
    completedLocations: 0,
    currentTitle: "Préparation des données des destinations...",
    totalImages,
    completedImages: 0,
    percent: 5,
    totalBytes: 0,
  });

  // Pre-load all images
  const cachedImagesMap = new Map<string, string>();
  const imageEntries = Array.from(allImagesMap.entries());

  for (let i = 0; i < imageEntries.length; i++) {
    const [imgUrl, locationTitle] = imageEntries[i];
    try {
      // Check if already in IndexedDB
      const existing = await getCachedImage(imgUrl);
      if (existing) {
        cachedImagesMap.set(imgUrl, existing);
        completedImages++;
        totalBytes += Math.round(existing.length * 0.75);
      } else {
        const fetched = await fetchImageAsDataUrl(imgUrl);
        if (fetched) {
          cachedImagesMap.set(imgUrl, fetched.dataUrl);
          await saveCachedImage(imgUrl, fetched.dataUrl, fetched.size);
          totalBytes += fetched.size;
        }
        completedImages++;
      }
    } catch (e) {
      console.warn("Failed caching image:", imgUrl, e);
      completedImages++;
    }

    const imgPercent = Math.min(85, Math.round(5 + (completedImages / (totalImages || 1)) * 80));
    onProgress?.({
      stage: "downloading",
      totalLocations,
      completedLocations: 0,
      currentTitle: `${locationTitle} (Photo ${completedImages}/${totalImages})`,
      totalImages,
      completedImages,
      percent: imgPercent,
      totalBytes,
    });
  }

  // Enrich each location with offline images and save
  const enrichedLocations: Location[] = [];
  let completedLocations = 0;

  for (const loc of locations) {
    const mainOffline = cachedImagesMap.get(loc.image) || loc.offlineImageDataUrl || loc.image;
    const galleryOffline = (loc.images || []).map(img => cachedImagesMap.get(img) || img);

    const enriched: Location = {
      ...loc,
      offlineImageDataUrl: mainOffline,
      offlineGalleryDataUrls: galleryOffline,
    };
    enrichedLocations.push(enriched);
    completedLocations++;

    onProgress?.({
      stage: "saving",
      totalLocations,
      completedLocations,
      currentTitle: `Enregistrement IndexedDB : ${loc.title}`,
      totalImages,
      completedImages,
      percent: Math.min(98, 85 + Math.round((completedLocations / totalLocations) * 13)),
      totalBytes,
    });
  }

  // Save all locations batch in IndexedDB
  await saveLocationsToDB(enrichedLocations);

  // Save metadata
  try {
    const metaTx = db.transaction(METADATA_STORE, "readwrite");
    const metaStore = metaTx.objectStore(METADATA_STORE);
    metaStore.put({
      key: "summary",
      locationsCount: totalLocations,
      imagesCount: cachedImagesMap.size,
      totalBytes,
      lastDownloadedAt: new Date().toISOString(),
    });
  } catch (mErr) {
    console.warn("Could not save offline metadata summary:", mErr);
  }

  onProgress?.({
    stage: "complete",
    totalLocations,
    completedLocations: totalLocations,
    currentTitle: "Toutes les destinations et photos sont enregistrées !",
    totalImages,
    completedImages,
    percent: 100,
    totalBytes,
  });

  return {
    success: true,
    locationsCount: totalLocations,
    imagesCount: cachedImagesMap.size,
    totalBytes,
  };
}

/**
 * Returns current status of local IndexedDB cache
 */
export async function getOfflineCacheStatus(): Promise<OfflineCacheStatus> {
  try {
    const db = await initDB();
    const locs = await getLocationsFromDB();

    return new Promise<OfflineCacheStatus>((resolve) => {
      const tx = db.transaction([IMAGES_STORE, METADATA_STORE], "readonly");
      const imgStore = tx.objectStore(IMAGES_STORE);
      const metaStore = tx.objectStore(METADATA_STORE);

      const imgCountReq = imgStore.count();
      const metaReq = metaStore.get("summary");

      tx.oncomplete = () => {
        const meta = metaReq.result;
        const imagesCount = imgCountReq.result || 0;
        const totalBytes = meta?.totalBytes || (imagesCount * 280000);
        const lastDownloadedAt = meta?.lastDownloadedAt || null;
        const estimatedMb = parseFloat((totalBytes / (1024 * 1024)).toFixed(1));

        resolve({
          locationsCount: locs.length,
          imagesCount,
          lastDownloadedAt,
          totalBytes,
          estimatedMb,
          isFullyCached: locs.length > 0 && imagesCount > 0,
        });
      };

      tx.onerror = () => {
        resolve({
          locationsCount: locs.length,
          imagesCount: 0,
          lastDownloadedAt: null,
          totalBytes: 0,
          estimatedMb: 0,
          isFullyCached: locs.length > 0,
        });
      };
    });
  } catch (err) {
    console.warn("getOfflineCacheStatus error:", err);
    return {
      locationsCount: 0,
      imagesCount: 0,
      lastDownloadedAt: null,
      totalBytes: 0,
      estimatedMb: 0,
      isFullyCached: false,
    };
  }
}

/**
 * Clears all cached offline images and resets metadata
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction([STORE_NAME, IMAGES_STORE, METADATA_STORE], "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(IMAGES_STORE).clear();
    tx.objectStore(METADATA_STORE).clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.error("clearOfflineCache error:", e);
  }
}
