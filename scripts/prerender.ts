import fs from "fs";
import path from "path";
import { DEFAULT_LOCATIONS } from "../src/data.js";
import { DEFAULT_CIRCUITS } from "../src/circuitsData.js";

const BASE_URL = "https://kongo-explorer.vercel.app";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DIST_DIR = path.join(process.cwd(), "dist");
const TEMPLATE_PATH = path.join(DIST_DIR, "index.html");

interface PreRenderPage {
  path: string;
  title: string;
  description: string;
  image: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
  bodyHtml?: string;
}

function resolveImage(img?: string): string {
  if (!img || typeof img !== "string" || img.trim() === "") return DEFAULT_IMAGE;
  const trimmed = img.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `${BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPreRenderPages(): PreRenderPage[] {
  const pages: PreRenderPage[] = [
    // 1. Accueil
    {
      path: "/",
      title: "Kongo Explorer – Guide touristique du Kongo Central",
      description:
        "Explorez le Kongo Central : chutes de Zongo, circuits touristiques, cartes interactives et patrimoine historique de la RDC avec le guide Kongo Explorer.",
      image: DEFAULT_IMAGE,
      type: "website",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Kongo Explorer",
        "url": `${BASE_URL}/`,
        "description": "Guide touristique officiel et interactif du Kongo Central en République Démocratique du Congo.",
      },
      bodyHtml: `
        <header style="padding: 2rem; background: #064e3b; color: #fff;">
          <h1>Kongo Explorer – Guide touristique officiel du Kongo Central</h1>
          <p>Découvrez les merveilles naturelles et historiques de la province du Kongo Central, RDC.</p>
        </header>
        <main style="padding: 2rem; max-width: 1200px; margin: auto;">
          <h2>Destinations phares du Kongo Central</h2>
          <p>Explorez les chutes d'eau monumentales de Zongo, les grottes légendaires de Mbanza-Ngungu, la première capitale historique de Boma et les plages de l'Atlantique à Moanda.</p>
          <ul>
            ${DEFAULT_LOCATIONS.slice(0, 10).map(loc => `<li><a href="/destinations/${loc.id}"><strong>${escapeHtml(loc.title)}</strong></a> (${escapeHtml(loc.locationName)}) – ${escapeHtml(loc.category)}</li>`).join("")}
          </ul>
          <h2>Circuits touristiques organisés</h2>
          <p>Parcourez des itinéraires vérifiés de 2 à 3 jours : la Route des Chutes, le Safari Atlantique et l'Épopée Fluviale.</p>
        </main>
      `,
    },

    // 2. Répertoire des destinations
    {
      path: "/destinations",
      title: "Destinations & Sites Touristiques – Kongo Explorer",
      description:
        "Découvrez tous les sites et merveilles incontournables du Kongo Central : chutes de Zongo, Moanda, Boma, Mbanza-Ngungu et réserves naturelles.",
      image: DEFAULT_IMAGE,
      type: "website",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Destinations & Sites Touristiques du Kongo Central",
        "url": `${BASE_URL}/destinations`,
        "description": "Répertoire complet des destinations touristiques du Kongo Central.",
      },
      bodyHtml: `
        <header style="padding: 2rem; background: #064e3b; color: #fff;">
          <h1>Toutes les Destinations du Kongo Central</h1>
          <p>Fiches détaillées, conseils d'accès, équipements recommandés et coordonnées GPS.</p>
        </header>
        <main style="padding: 2rem; max-width: 1200px; margin: auto;">
          <ul>
            ${DEFAULT_LOCATIONS.map(loc => `
              <li style="margin-bottom: 1.5rem;">
                <article>
                  <h2><a href="/destinations/${loc.id}">${escapeHtml(loc.title)}</a></h2>
                  <p><strong>Lieu :</strong> ${escapeHtml(loc.locationName)} | <strong>Catégorie :</strong> ${escapeHtml(loc.category)}</p>
                  <p>${escapeHtml(loc.description)}</p>
                </article>
              </li>
            `).join("")}
          </ul>
        </main>
      `,
    },

    // 3. Carte interactive
    {
      path: "/carte",
      title: "Carte Interactive du Kongo Central – Kongo Explorer",
      description:
        "Localisez les chutes de Zongo, Moanda, Boma, Mbanza-Ngungu et tous les attraits du Kongo Central sur la carte interactive avec filtres.",
      image: DEFAULT_IMAGE,
      type: "website",
      bodyHtml: `
        <header style="padding: 2rem; background: #064e3b; color: #fff;">
          <h1>Carte Interactive des Sites du Kongo Central</h1>
          <p>Localisation satellite et GPS de l'ensemble des sites touristiques, parcs et cascades de la province.</p>
        </header>
      `,
    },

    // 4. Circuits
    {
      path: "/circuits",
      title: "Circuits & Itinéraires Touristiques – Kongo Explorer",
      description:
        "Parcourez nos circuits organisés au Kongo Central : la Route des Chutes, le Safari Atlantique, l'Épopée Fluviale et les trésors coloniaux.",
      image: DEFAULT_IMAGE,
      type: "website",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Circuits touristiques du Kongo Central",
        "itemListElement": DEFAULT_CIRCUITS.map((c, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": c.title,
          "description": c.description,
        })),
      },
      bodyHtml: `
        <header style="padding: 2rem; background: #064e3b; color: #fff;">
          <h1>Circuits & Itinéraires au Kongo Central</h1>
          <p>Parcours thématiques clés en main pour explorer la province en 2 à 3 jours.</p>
        </header>
        <main style="padding: 2rem; max-width: 1200px; margin: auto;">
          ${DEFAULT_CIRCUITS.map(c => `
            <article style="margin-bottom: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 1.5rem;">
              <h2>${escapeHtml(c.title)}</h2>
              <p><strong>Durée :</strong> ${escapeHtml(c.duration)} | <strong>Accès :</strong> ${escapeHtml(c.accessType)}</p>
              <p>${escapeHtml(c.description)}</p>
            </article>
          `).join("")}
        </main>
      `,
    },

    // 5. Conseils
    {
      path: "/conseils",
      title: "Conseils Pratiques & Bonnes Adresses – Kongo Explorer",
      description:
        "Guides de voyage, transports, saisons idéales, conseils de sécurité et bonnes adresses pour préparer sereinement votre séjour au Kongo Central.",
      image: DEFAULT_IMAGE,
      type: "website",
      bodyHtml: `
        <header style="padding: 2rem; background: #064e3b; color: #fff;">
          <h1>Conseils Pratiques pour Voyager au Kongo Central</h1>
          <p>Météo, saisons idéales, transports sur la Nationale 1, sécurité et coutumes locales.</p>
        </header>
      `,
    },

    // 6. Carnet de voyage
    {
      path: "/carnet",
      title: "Mon Carnet de Voyage – Kongo Explorer",
      description:
        "Consultez vos destinations sauvegardées et vos repères hors-ligne pour voyager sans connexion internet à travers le Kongo Central.",
      image: DEFAULT_IMAGE,
      type: "website",
      bodyHtml: `
        <header style="padding: 2rem; background: #064e3b; color: #fff;">
          <h1>Carnet de Voyage Hors-Ligne</h1>
          <p>Accédez à vos fiches et repères GPS même au cœur des réserves naturelles sans réseau.</p>
        </header>
      `,
    },
  ];

  // 7. Toutes les 21 fiches de destinations individuelles
  for (const loc of DEFAULT_LOCATIONS) {
    const locUrl = `${BASE_URL}/destinations/${loc.id}`;
    const resolvedImg = resolveImage(loc.image);
    const locTitle = `${loc.title} – Kongo Explorer`;
    const locDesc = loc.description.length > 155 ? `${loc.description.slice(0, 152)}...` : loc.description;

    pages.push({
      path: `/destinations/${loc.id}`,
      title: locTitle,
      description: locDesc,
      image: resolvedImg,
      type: "article",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": loc.title,
        "description": loc.description,
        "url": locUrl,
        "image": resolvedImg,
        "touristType": loc.category,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": loc.locationName || "Kongo Central",
          "addressCountry": "CD",
        },
        ...(loc.lat && loc.lng
          ? {
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": loc.lat,
                "longitude": loc.lng,
              },
            }
          : {}),
      },
      bodyHtml: `
        <article style="padding: 2rem; max-width: 900px; margin: auto; font-family: sans-serif; line-height: 1.6;">
          <nav style="margin-bottom: 1rem; font-size: 0.9rem;">
            <a href="/">Accueil</a> &gt; <a href="/destinations">Destinations</a> &gt; <span>${escapeHtml(loc.title)}</span>
          </nav>
          <header>
            <h1 style="color: #064e3b; font-size: 2.2rem; margin-bottom: 0.5rem;">${escapeHtml(loc.title)}</h1>
            <p style="font-size: 1.1rem; color: #4b5563;">
              <strong>Localisation :</strong> ${escapeHtml(loc.locationName)} | <strong>Catégorie :</strong> ${escapeHtml(loc.category)}
            </p>
          </header>
          <img src="${escapeHtml(resolvedImg)}" alt="${escapeHtml(loc.title)}" style="max-width: 100%; height: auto; border-radius: 12px; margin: 1.5rem 0;" />
          <section>
            <h2>Présentation</h2>
            <p style="font-size: 1.1rem;">${escapeHtml(loc.description)}</p>
          </section>
          ${loc.history ? `
            <section style="margin-top: 1.5rem;">
              <h2>Histoire & Patrimoine</h2>
              <p>${escapeHtml(loc.history)}</p>
            </section>
          ` : ""}
          ${loc.checklist && loc.checklist.length > 0 ? `
            <section style="margin-top: 1.5rem;">
              <h2>Équipements conseillés</h2>
              <ul>
                ${loc.checklist.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </section>
          ` : ""}
          ${loc.bestSeason ? `
            <section style="margin-top: 1.5rem;">
              <h2>Période idéale de visite</h2>
              <p>${escapeHtml(loc.bestSeason)}</p>
            </section>
          ` : ""}
          <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
            <p><a href="/destinations">← Retour à toutes les destinations du Kongo Central</a></p>
          </footer>
        </article>
      `,
    });
  }

  return pages;
}

function renderHtml(template: string, page: PreRenderPage): string {
  const canonicalUrl = `${BASE_URL}${page.path === "/" ? "/" : page.path}`;
  let html = template;

  // 1. Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);

  // 2. Replace <meta name="title" ...>
  html = html.replace(/<meta\s+name="title"\s+content="[^"]*"\s*\/?>/i, `<meta name="title" content="${escapeHtml(page.title)}" />`);

  // 3. Replace <meta name="description" ...>
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(page.description)}" />`);

  // 4. Replace <link rel="canonical" ...>
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

  // 5. Replace Open Graph tags
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(page.title)}" />`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(page.description)}" />`);
  html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(page.image)}" />`);
  html = html.replace(/<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image:alt" content="${escapeHtml(page.title)}" />`);

  // 6. Replace Twitter tags
  html = html.replace(/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`);
  html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(page.image)}" />`);
  html = html.replace(/<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image:alt" content="${escapeHtml(page.title)}" />`);

  // 7. Inject JSON-LD structured data into <head>
  if (page.jsonLd) {
    const jsonLdTag = `\n    <script type="application/ld+json">\n${JSON.stringify(page.jsonLd, null, 2)}\n    </script>\n`;
    html = html.replace("</head>", `${jsonLdTag}</head>`);
  }

  // 8. Inject semantic prerendered body into <div id="root"></div> for search engine crawlers
  if (page.bodyHtml) {
    const semanticContent = `\n    <div id="root">${page.bodyHtml}</div>\n`;
    html = html.replace(/<div\s+id="root">\s*<\/div>/i, semanticContent);
  }

  return html;
}

export function prerenderAll() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`[Prerender] Error: Template file not found at ${TEMPLATE_PATH}. Run 'vite build' first.`);
    process.exit(1);
  }

  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  const pages = getPreRenderPages();
  console.log(`[Prerender] Generating static HTML files for ${pages.length} pages...`);

  let count = 0;
  for (const page of pages) {
    const renderedHtml = renderHtml(template, page);
    const cleanPath = page.path.replace(/^\/+/, "").replace(/\/+$/, "");

    if (cleanPath === "") {
      // Overwrite dist/index.html with fully enriched root page
      fs.writeFileSync(TEMPLATE_PATH, renderedHtml, "utf-8");
      count++;
      continue;
    }

    // Target directory: dist/<path>/index.html
    const targetDir = path.join(DIST_DIR, cleanPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetIndexPath = path.join(targetDir, "index.html");
    fs.writeFileSync(targetIndexPath, renderedHtml, "utf-8");

    // Also write dist/<path>.html for hosts looking for .html directly
    const targetHtmlPath = path.join(DIST_DIR, `${cleanPath}.html`);
    fs.writeFileSync(targetHtmlPath, renderedHtml, "utf-8");

    count++;
  }

  console.log(`[Prerender] Successfully generated ${count} static HTML pages in ${DIST_DIR}`);
}

prerenderAll();
