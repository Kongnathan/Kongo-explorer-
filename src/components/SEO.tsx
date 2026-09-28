import React, { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown> | null;
}

const DEFAULT_TITLE = "Kongo Explorer – Guide touristique du Kongo Central";
const DEFAULT_DESCRIPTION =
  "Explorez le Kongo Central : chutes de Zongo, circuits touristiques, cartes interactives et patrimoine historique de la RDC avec le guide Kongo Explorer.";
const BASE_URL = "https://kongo-explorer.vercel.app";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  jsonLd = null,
}: SEOProps) {
  // Normalize canonical URL
  const normalizedPath = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = `${BASE_URL}${normalizedPath === "/" ? "/" : normalizedPath}`;
  const resolvedImage = image.startsWith("http") ? image : `${BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = title;
    }
  }, [title]);

  return (
    <>
      {/* Title */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content="Kongo Explorer" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:alt" content={title} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
      <meta name="twitter:image:alt" content={title} />

      {/* Structured Data (Schema.org JSON-LD) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </>
  );
}
