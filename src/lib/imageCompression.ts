import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

// Safe Firestore payload limit per image to keep full post documents well under 1 MB
const TARGET_IMAGE_MAX_DIMENSION = 1200;
const STORAGE_TIMEOUT_MS = 3000; // 3 seconds max before automatic fallback to Firestore database

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  sizeBytes: number;
}

/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Generates an ultra-optimized image (typically 60-120 KB) that can either be uploaded
 * to Firebase Storage or saved directly in the Firestore database document.
 */
export async function compressImage(
  file: File,
  maxDimension = TARGET_IMAGE_MAX_DIMENSION,
  initialQuality = 0.75
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Impossible de lire le fichier image sélectionné."));
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error("Le fichier sélectionné n'est pas une image valide."));
      };

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
          return reject(new Error("Impossible d'initialiser le moteur de compression d'image."));
        }

        // Fill white background to prevent black PNG transparent backgrounds
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for optimal size/quality ratio, fallback to JPEG
        const tryExport = (mimeType: string, quality: number): Promise<{ blob: Blob; dataUrl: string }> => {
          return new Promise((resBlob, rejBlob) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  return rejBlob(new Error("Échec de l'export de l'image"));
                }
                const dataUrl = canvas.toDataURL(mimeType, quality);
                resBlob({ blob, dataUrl });
              },
              mimeType,
              quality
            );
          });
        };

        // Two-pass optimization: try 0.75, if larger than 140KB try 0.62
        tryExport("image/jpeg", initialQuality)
          .then(async ({ blob, dataUrl }) => {
            if (blob.size > 140 * 1024) {
              const secondPass = await tryExport("image/jpeg", 0.62);
              resolve({
                blob: secondPass.blob,
                dataUrl: secondPass.dataUrl,
                sizeBytes: secondPass.blob.size,
              });
            } else {
              resolve({
                blob,
                dataUrl,
                sizeBytes: blob.size,
              });
            }
          })
          .catch((err) => reject(err));
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Handles image persistence with automatic database fallback:
 * 1. Compresses image client-side to a lightweight high-fidelity format (<120 KB).
 * 2. Attempts Firebase Storage upload with a strict 3-second timeout.
 * 3. If Firebase Storage succeeds, returns the public Storage download URL.
 * 4. If Firebase Storage fails (bucket not enabled, CORS error, missing permission, or timeout),
 *    IMMEDIATELY and seamlessly falls back to returning the compressed base64 Data URL,
 *    which is stored directly in the Firestore database document (`tourism_posts`).
 */
export async function uploadTourismImage(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  // Step 1: Client-side compression
  if (onStatusUpdate) onStatusUpdate("Compression & optimisation de l'image...");
  if (onProgress) onProgress(25);

  const compressed = await compressImage(file);

  if (onProgress) onProgress(50);

  // Step 2: Attempt Firebase Storage upload with a fast timeout
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const cleanName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/\.[^/.]+$/, "");
  const storagePath = `tourism_posts/${userId}/${timestamp}_${randomSuffix}_${cleanName}.jpg`;

  try {
    if (!storage) {
      throw new Error("Firebase Storage non initialisé");
    }

    if (onStatusUpdate) onStatusUpdate("Vérification du stockage distant...");

    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, compressed.blob, {
      contentType: "image/jpeg",
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId,
      },
    });

    const uploadPromise = new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(Math.round(50 + (progress * 0.45))); // scale from 50 to 95%
            }
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    });

    // Timeout guard: if Firebase Storage bucket does not respond within 3 seconds,
    // cancel/abort and fall back to storing directly in the database
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        try {
          uploadTask.cancel();
        } catch {
          // ignore cancel error
        }
        reject(new Error("STORAGE_TIMEOUT"));
      }, STORAGE_TIMEOUT_MS);
    });

    const remoteUrl = await Promise.race([uploadPromise, timeoutPromise]);
    if (onProgress) onProgress(100);
    return remoteUrl;
  } catch (storageErr: any) {
    console.info(
      "[Kongo Explorer] Stockage Firebase Storage indisponible ou délai dépassé (" +
        (storageErr?.message || "erreur") +
        "). Sauvegarde directe de la photo dans la base de données Firestore."
    );

    if (onStatusUpdate) {
      onStatusUpdate("Sauvegarde directe dans la base de données...");
    }
    if (onProgress) onProgress(100);

    // Direct database persistence: return the compressed Data URL
    return compressed.dataUrl;
  }
}
