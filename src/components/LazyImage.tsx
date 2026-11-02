import React, { useState, useEffect, useRef } from "react";
import { getCachedImage } from "../lib/indexedDB";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&auto=format&fit=crop&q=80";

export default function LazyImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  className = "",
  containerClassName = "",
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check IndexedDB offline image cache on mount or when src changes
  useEffect(() => {
    let active = true;
    if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
      getCachedImage(src)
        .then((cached) => {
          if (active && cached) {
            setCachedSrc(cached);
          }
        })
        .catch(() => {});
    } else {
      setCachedSrc(null);
    }
    return () => {
      active = false;
    };
  }, [src]);

  const effectiveSrc = (hasError || !src || src.trim() === "")
    ? (cachedSrc || fallbackSrc || DEFAULT_FALLBACK_IMAGE)
    : (cachedSrc || src);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    // If image is already complete in memory/browser cache
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [effectiveSrc]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-surface-variant ${containerClassName}`}>
      {/* Skeleton loading animation placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-surface-variant/80 animate-pulse flex items-center justify-center text-outline/30 z-0">
          <span className="material-symbols-outlined text-[32px] opacity-40">image</span>
        </div>
      )}
      <img
        ref={imgRef}
        src={effectiveSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        {...props}
        onLoad={(e) => {
          setIsLoaded(true);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          // If online failed, try to check cachedSrc
          if (!cachedSrc && src && !src.startsWith("data:")) {
            getCachedImage(src).then((cached) => {
              if (cached) {
                setCachedSrc(cached);
                setIsLoaded(true);
                return;
              }
              setIsLoaded(true);
              setHasError(true);
            }).catch(() => {
              setIsLoaded(true);
              setHasError(true);
            });
          } else {
            setIsLoaded(true);
            if (!hasError && src && src !== fallbackSrc) {
              setHasError(true);
            }
          }
          if (onError) onError(e);
        }}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
