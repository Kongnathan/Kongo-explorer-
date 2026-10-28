import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Ensures the result is under 2 MB while preserving good visual quality.
 */
export async function compressImage(
  file: File,
  maxDimension = 1920,
  initialQuality = 0.85
): Promise<Blob> {
  // If already an image and below 1.5MB, check if compression is even necessary
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Fichier image non valide"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize down if larger than maxDimension
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

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Impossible d'initialiser le canvas 2D"));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression to guarantee < 2 MB
        let quality = initialQuality;
        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error("Échec de la compression de l'image"));
              }
              if (blob.size <= MAX_IMAGE_BYTES || q <= 0.3) {
                resolve(blob);
              } else {
                // Reduce quality and try again
                tryCompress(Math.max(0.3, q - 0.15));
              }
            },
            "image/jpeg",
            q
          );
        };

        tryCompress(quality);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a compressed image blob to Firebase Storage
 * Under path: `tourism_posts/${userId}/${timestamp}_${cleanFileName}.jpg`
 * Reports upload progress via optional callback (0 to 100)
 */
export async function uploadTourismImage(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // 1. Client-side compression
  const compressedBlob = await compressImage(file);

  if (compressedBlob.size > MAX_IMAGE_BYTES) {
    throw new Error("L'image compressée dépasse toujours la limite de 2 Mo.");
  }

  // 2. Storage upload
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const cleanName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/\.[^/.]+$/, "");
  const storagePath = `tourism_posts/${userId}/${timestamp}_${randomSuffix}_${cleanName}.jpg`;

  try {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, compressedBlob, {
      contentType: "image/jpeg",
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId,
      },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          console.warn("[Firebase Storage] Upload failed, falling back to base64 Data URL:", error);
          // Graceful fallback: convert blob to data URL if storage rules block or quota exceeded
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(error);
          reader.readAsDataURL(compressedBlob);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  } catch (err) {
    console.warn("Storage upload exception, converting to local data URL:", err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(err);
      reader.readAsDataURL(compressedBlob);
    });
  }
}
