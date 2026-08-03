import React, { useState, useEffect, useRef } from "react";

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
  const imgRef = useRef<HTMLImageElement>(null);

  const effectiveSrc = (hasError || !src || src.trim() === "") 
    ? (fallbackSrc || DEFAULT_FALLBACK_IMAGE) 
    : src;

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    // If image is already complete in memory/browser cache
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src, fallbackSrc]);

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
          setIsLoaded(true); // Crucial: guarantee image is marked loaded so opacity-100 displays the fallback
          if (!hasError && src && src !== fallbackSrc) {
            setHasError(true);
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

