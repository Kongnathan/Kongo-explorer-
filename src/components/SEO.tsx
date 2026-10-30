import React, { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Location, TourismPost } from "../types";
import { DEFAULT_LOCATIONS, DEFAULT_TOURISMPPOSTS } from "../data";

export interface RouteMetadata {
  noindex?: boolean;
  title: string;
  description: string;
  canonicalUrl: string;
  image: string;
  type?: string;
  jsonLd?: Record<string, unknown> | null;
}

export const BASE_URL = "https://kongo-explorer.vercel.app";
export const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
export const DEFAULT_TITLE = "Kongo Explorer – Guide touristique du Kongo Central";
export const DEFAULT_DESCRIPTION =
  "Explorez le Kongo Central : chutes de Zongo, circuits touristiques, cartes interactives et patrimoine historique de la RDC avec le guide Kongo Explorer.";

/**
 * Resolves an image path to an absolute URL suitable for Open Graph and Twitter cards
 */
export function resolveImageUrl(image?: string): string {
  if (!image || typeof image !== "string" || image.trim() === "") {
    return DEFAULT_IMAGE;
  }
  const trimmed = image.trim();
  if (trimmed.startsWith("data:")) {
    return DEFAULT_IMAGE;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `${BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

/**
 * Updates the document head in the DOM synchronously on route change
 */
export function updateDocumentHead(meta: RouteMetadata): void {
  if (typeof document === "undefined") return;

  // 1. Update document.title
  document.title = meta.title;

  // Helper function to create or update <meta> tags by name or property
  const setMeta = (attrKey: "name" | "property", attrVal: string, contentVal: string) => {
    let el = document.head.querySelector(`meta[${attrKey}="${attrVal}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attrKey, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute("content", contentVal);
  };

  // Helper function to create or update <link> tags by rel
  const setLink = (rel: string, href: string) => {
    let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  };

  // Primary meta tags
  setMeta("name", "robots", meta.noindex ? "noindex, nofollow" : "index, follow");
  setMeta("name", "title", meta.title);
  setMeta("name", "description", meta.description);

  // Canonical tag (<link rel="canonical">)
  setLink("canonical", meta.canonicalUrl);

  // Open Graph meta tags
  setMeta("property", "og:type", meta.type || "website");
  setMeta("property", "og:site_name", "Kongo Explorer");
  setMeta("property", "og:locale", "fr_FR");
  setMeta("property", "og:url", meta.canonicalUrl);
  setMeta("property", "og:title", meta.title);
  setMeta("property", "og:description", meta.description);
  setMeta("property", "og:image", meta.image);
  setMeta("property", "og:image:alt", meta.title);

  // Twitter cards meta tags
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:url", meta.canonicalUrl);
  setMeta("name", "twitter:title", meta.title);
  setMeta("name", "twitter:description", meta.description);
  setMeta("name", "twitter:image", meta.image);
  setMeta("name", "twitter:image:alt", meta.title);

  // JSON-LD structured data
  let scriptEl = document.head.querySelector('script[data-seo="route-jsonld"]') as HTMLScriptElement | null;
  if (meta.jsonLd) {
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.setAttribute("data-seo", "route-jsonld");
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(meta.jsonLd);
  } else if (scriptEl) {
    scriptEl.remove();
  }
}

/**
 * Computes exact SEO metadata depending on the current pathname and available locations/tourism posts
 */
export function computeRouteMetadata(
  pathname: string, 
  locations: Location[] = [],
  tourismPosts: TourismPost[] = []
): RouteMetadata {
  const cleanPath = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

  // Case: Destination detail page (/destinations/:id)
  if (cleanPath.startsWith("/destinations/")) {
    const destId = cleanPath.replace(/^\/destinations\//, "").split("/")[0].trim().toLowerCase();
    const dest =
      locations.find((l) => l.id.toLowerCase() === destId) ||
      DEFAULT_LOCATIONS.find((l) => l.id.toLowerCase() === destId);

    if (dest) {
      const canonicalUrl = `${BASE_URL}/destinations/${dest.id}`;
      const resolvedImage = resolveImageUrl(dest.image);
      const title = `${dest.title} – Kongo Explorer`;
      const description = dest.description;

      return {
        title,
        description,
        canonicalUrl,
        image: resolvedImage,
        type: "article",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "TouristAttraction",
          "name": dest.title,
          "description": dest.description,
          "url": canonicalUrl,
          "image": resolvedImage,
          "touristType": dest.category,
          "address": {
            "@type": "PostalAddress",
            "addressRegion": dest.locationName || "Kongo Central",
            "addressCountry": "CD",
          },
          ...(dest.lat && dest.lng
            ? {
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": dest.lat,
                  "longitude": dest.lng,
                },
              }
            : {}),
        },
      };
    }

    // Destination ID not found
    return {
      title: "Destination – Kongo Explorer",
      description: "Découvrez cette destination d'exception au Kongo Central sur le guide officiel Kongo Explorer.",
      canonicalUrl: `${BASE_URL}${cleanPath}`,
      image: DEFAULT_IMAGE,
      type: "website",
    };
  }

  // Case: Tourism post detail page (/infos-tourisme/:id or /actualites/:id or /news/:id)
  if (cleanPath.startsWith("/infos-tourisme/") || cleanPath.startsWith("/actualites/") || cleanPath.startsWith("/news/")) {
    const postId = cleanPath.replace(/^\/(infos-tourisme|actualites|news)\//, "").split("/")[0].trim().toLowerCase();
    const post =
      tourismPosts.find((p) => p.id.toLowerCase() === postId) ||
      DEFAULT_TOURISMPPOSTS.find((p) => p.id.toLowerCase() === postId);

    if (post) {
      const canonicalUrl = `${BASE_URL}/infos-tourisme/${post.id}`;
      const resolvedImage = resolveImageUrl(post.photo);
      const title = `${post.title} – Infos Tourisme Kongo Explorer`;
      const description = post.summary || post.content.slice(0, 155);

      return {
        title,
        description,
        canonicalUrl,
        image: resolvedImage,
        type: "article",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "description": description,
          "image": resolvedImage,
          "datePublished": post.createdAt,
          "author": {
            "@type": "Person",
            "name": post.author || "Kongo Explorer",
          },
          "publisher": {
            "@type": "Organization",
            "name": "Kongo Explorer",
            "logo": {
              "@type": "ImageObject",
              "url": DEFAULT_IMAGE,
            },
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl,
          },
        },
      };
    }

    return {
      title: "Info Tourisme – Kongo Explorer",
      description: "Actualité touristique, événement et bons plans de voyage au Kongo Central.",
      canonicalUrl: `${BASE_URL}${cleanPath}`,
      image: DEFAULT_IMAGE,
      type: "article",
    };
  }

  // Predefined routes
  switch (cleanPath) {
    case "/":
    case "/explore":
      return {
        title: "Kongo Explorer – Guide touristique du Kongo Central",
        description:
          "Explorez le Kongo Central : chutes de Zongo, circuits touristiques, cartes interactives et patrimoine historique de la RDC avec le guide Kongo Explorer.",
        canonicalUrl: `${BASE_URL}/`,
        image: DEFAULT_IMAGE,
        type: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Kongo Explorer",
          "url": `${BASE_URL}/`,
          "description": "Guide touristique officiel et interactif du Kongo Central en RDC.",
        },
      };

    case "/destinations":
    case "/list":
      return {
        title: "Destinations & Sites Touristiques – Kongo Explorer",
        description:
          "Découvrez tous les sites touristiques incontournables du Kongo Central : chutes de Zongo, Moanda, Boma, Mbanza-Ngungu et parcs naturels.",
        canonicalUrl: `${BASE_URL}/destinations`,
        image: DEFAULT_IMAGE,
        type: "website",
      };

    case "/carte":
    case "/map":
      return {
        title: "Carte Interactive du Kongo Central – Kongo Explorer",
        description:
          "Localisez les chutes de Zongo, Moanda, Boma, Mbanza-Ngungu et tous les attraits du Kongo Central sur la carte interactive avec filtres.",
        canonicalUrl: `${BASE_URL}/carte`,
        image: DEFAULT_IMAGE,
        type: "website",
      };

    case "/circuits":
      return {
        title: "Circuits & Itinéraires Touristiques – Kongo Explorer",
        description:
          "Parcourez nos circuits organisés au Kongo Central : la Route des Chutes, le Safari Atlantique, l'Épopée Fluviale et les trésors coloniaux.",
        canonicalUrl: `${BASE_URL}/circuits`,
        image: DEFAULT_IMAGE,
        type: "website",
      };

    case "/infos-tourisme":
    case "/actualites":
    case "/news":
      return {
        title: "Infos Tourisme & Actualités – Kongo Explorer",
        description:
          "Actualités touristiques du Kongo Central : nouveaux lieux à visiter, événements culturels, hébergements vérifiés, restaurants et conseils transports.",
        canonicalUrl: `${BASE_URL}/infos-tourisme`,
        image: DEFAULT_IMAGE,
        type: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Infos Tourisme Kongo Central",
          "url": `${BASE_URL}/infos-tourisme`,
          "description": "Portail d'informations touristiques officielles, publications et bons plans pour visiter le Kongo Central.",
        },
      };

    case "/conseils":
    case "/tips":
      return {
        title: "Conseils Pratiques & Bonnes Adresses – Kongo Explorer",
        description:
          "Guides de voyage, transports, saisons idéales, conseils de sécurité et bonnes adresses pour préparer sereinement votre séjour au Kongo Central.",
        canonicalUrl: `${BASE_URL}/conseils`,
        image: DEFAULT_IMAGE,
        type: "website",
      };

    case "/carnet":
    case "/saved":
      return {
        title: "Mon Carnet de Voyage – Kongo Explorer",
        description:
          "Consultez vos destinations sauvegardées et vos repères hors-ligne pour voyager sans connexion internet à travers le Kongo Central.",
        canonicalUrl: `${BASE_URL}/carnet`,
        image: DEFAULT_IMAGE,
        type: "website",
      };

    case "/admin":
    case "/admin/login":
    case "/admin/panel":
      return {
        title: "Administration – Kongo Explorer",
        description:
          "Portail d'administration sécurisé pour la gestion des destinations, circuits et publications touristiques du Kongo Central.",
        canonicalUrl: `${BASE_URL}/admin`,
        image: DEFAULT_IMAGE,
        type: "website",
        noindex: true,
      };

    default:
      return {
        title: "Page non trouvée – Kongo Explorer",
        description:
          "La page recherchée sur le guide Kongo Explorer n'existe pas ou a été déplacée. Retrouvez tous nos guides et circuits.",
        canonicalUrl: `${BASE_URL}${cleanPath}`,
        image: DEFAULT_IMAGE,
        type: "website",
      };
  }
}

/**
 * Custom hook to dynamically update document head on every route change
 */
export function useRouteSEO(locations: Location[] = [], tourismPosts: TourismPost[] = []): RouteMetadata {
  const location = useLocation();

  const meta = useMemo(() => {
    return computeRouteMetadata(location.pathname, locations, tourismPosts);
  }, [location.pathname, locations, tourismPosts]);

  useEffect(() => {
    updateDocumentHead(meta);
  }, [meta]);

  return meta;
}

/**
 * Global component placed once at the router level in App.tsx
 * Dynamically synchronizes document head tags and renders hoisted meta tags
 */
export function RouteSEO({ 
  locations = [], 
  tourismPosts = [] 
}: { 
  locations?: Location[]; 
  tourismPosts?: TourismPost[];
}) {
  const meta = useRouteSEO(locations, tourismPosts);

  return (
    <>
      <title>{meta.title}</title>
      <meta name="title" content={meta.title} />
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonicalUrl} />

      <meta property="og:type" content={meta.type || "website"} />
      <meta property="og:site_name" content="Kongo Explorer" />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:url" content={meta.canonicalUrl} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image} />
      <meta property="og:image:alt" content={meta.title} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={meta.canonicalUrl} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.image} />
      <meta name="twitter:image:alt" content={meta.title} />

      {meta.jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(meta.jsonLd)}
        </script>
      )}
    </>
  );
}

/**
 * Backward compatibility component for explicit page-level overrides
 */
export function SEO(props: Partial<RouteMetadata> & { canonicalPath?: string; locations?: Location[] }) {
  const location = useLocation();
  const fallbackMeta = computeRouteMetadata(props.canonicalPath || location.pathname, props.locations || []);

  const resolvedTitle = props.title || fallbackMeta.title;
  const resolvedDesc = props.description || fallbackMeta.description;
  const resolvedCanonical = props.canonicalPath
    ? `${BASE_URL}${props.canonicalPath.startsWith("/") ? "" : "/"}${props.canonicalPath}`
    : props.canonicalUrl || fallbackMeta.canonicalUrl;
  const resolvedImage = props.image ? resolveImageUrl(props.image) : fallbackMeta.image;
  const resolvedType = props.type || fallbackMeta.type || "website";
  const resolvedJsonLd = props.jsonLd !== undefined ? props.jsonLd : fallbackMeta.jsonLd;

  useEffect(() => {
    updateDocumentHead({
      title: resolvedTitle,
      description: resolvedDesc,
      canonicalUrl: resolvedCanonical,
      image: resolvedImage,
      type: resolvedType,
      jsonLd: resolvedJsonLd,
    });
  }, [resolvedTitle, resolvedDesc, resolvedCanonical, resolvedImage, resolvedType, resolvedJsonLd]);

  return (
    <>
      <title>{resolvedTitle}</title>
      <meta name="title" content={resolvedTitle} />
      <meta name="description" content={resolvedDesc} />
      <link rel="canonical" href={resolvedCanonical} />

      <meta property="og:type" content={resolvedType} />
      <meta property="og:site_name" content="Kongo Explorer" />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDesc} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:alt" content={resolvedTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={resolvedCanonical} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDesc} />
      <meta name="twitter:image" content={resolvedImage} />
      <meta name="twitter:image:alt" content={resolvedTitle} />

      {resolvedJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(resolvedJsonLd)}
        </script>
      )}
    </>
  );
}

export default RouteSEO;

