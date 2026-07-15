import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { DEFAULT_LOCATIONS, DEFAULT_PENDING_PERMITS } from "./src/data.js";
import { Location, SavedLocation, PendingPermit, VoiceNote } from "./src/types.js";
import fs from "fs";

// Lazy initialize Gemini client to avoid startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));

// Image upload API endpoint
app.post("/api/upload", (req, res) => {
  const { image } = req.body; // base64 string
  if (!image) {
    return res.status(400).json({ error: "Aucune image fournie" });
  }

  try {
    // Extract format and actual base64 content
    const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Format d'image invalide. Veuillez fournir un Base64 Data URL." });
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const filename = `upload-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    // Return the relative URL of the saved image
    const imageUrl = `/uploads/${filename}`;
    res.json({ url: imageUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Erreur lors de la sauvegarde de l'image sur le serveur." });
  }
});

// File-based simple persistence database
const dbPath = path.join(process.cwd(), "db.json");

let locationsList: Location[] = [...DEFAULT_LOCATIONS];
let pendingPermits: PendingPermit[] = [...DEFAULT_PENDING_PERMITS];
let voiceNotes: VoiceNote[] = [];

function saveDb() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify({ locationsList, pendingPermits, voiceNotes }, null, 2), "utf-8");
  } catch (error) {
    console.error("[DB Error] Failed to write database to disk:", error);
  }
}

function loadDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      if (Array.isArray(data.locationsList)) locationsList = data.locationsList;
      if (Array.isArray(data.pendingPermits)) pendingPermits = data.pendingPermits;
      if (Array.isArray(data.voiceNotes)) voiceNotes = data.voiceNotes;
      console.log("[DB] Loaded existing data from db.json");
    } else {
      saveDb();
    }
  } catch (error) {
    console.error("[DB Error] Failed to read database from disk, using default memory state:", error);
  }
}

// Load database immediately on startup
loadDb();

// API ENDPOINTS

// 1. Locations list
app.get("/api/locations", (req, res) => {
  res.json(locationsList);
});

// Create/add destination (Admin Panel)
app.post("/api/locations", (req, res) => {
  const newLoc: Location = {
    id: req.body.id || `loc-${Date.now()}`,
    title: req.body.title || "Nouvelle destination",
    locationName: req.body.locationName || "Kongo Central",
    category: req.body.category || "Incontournables",
    image: req.body.image || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
    description: req.body.description || "",
    status: req.body.status || "PUBLISHED",
    coords: req.body.coords || { x: 50, y: 50 },
    rating: req.body.rating || 4.5,
    timeToVisit: req.body.timeToVisit || "3 heures",
    cognitiveEffort: req.body.cognitiveEffort || 50,
    intensity: req.body.intensity || "Intensité Modérée",
    terrain: req.body.terrain || "Terrain Aménagé",
    currentStatus: req.body.currentStatus || "Ouvert aujourd'hui.",
    history: req.body.history || "",
    checklist: req.body.checklist || ["Bouteille d'eau", "Chaussures de marche"],
    bestSeason: req.body.bestSeason || "Saison sèche",
    safetyGuidelines: req.body.safetyGuidelines || "Rester sur les sentiers.",
    ecoResponsibility: req.body.ecoResponsibility || "Ramasser ses déchets.",
    localCustoms: req.body.localCustoms || "Respecter les anciens."
  };
  locationsList.push(newLoc);
  saveDb();
  res.status(201).json(newLoc);
});

// Update/Edit destination (Admin Panel)
app.put("/api/locations/:id", (req, res) => {
  const { id } = req.params;
  const idx = locationsList.findIndex(l => l.id === id);
  if (idx !== -1) {
    locationsList[idx] = { ...locationsList[idx], ...req.body };
    saveDb();
    res.json(locationsList[idx]);
  } else {
    res.status(404).json({ error: "Location non trouvée" });
  }
});

// Delete destination
app.delete("/api/locations/:id", (req, res) => {
  const { id } = req.params;
  locationsList = locationsList.filter(l => l.id !== id);
  saveDb();
  res.json({ success: true });
});

// 2. Pending permits & waitlists / community observations
app.get("/api/pending", (req, res) => {
  res.json(pendingPermits);
});

app.post("/api/pending", (req, res) => {
  const newPermit: PendingPermit = {
    id: `permit-${Date.now()}`,
    title: req.body.title || "Observation soumise",
    subtitle: req.body.subtitle || "Vérification en cours...",
    status: req.body.status || "PENDING",
    icon: req.body.icon || "pending"
  };
  pendingPermits.push(newPermit);
  saveDb();
  res.status(201).json(newPermit);
});

// 3. Smart Process Voice/Text Capture (Gemini API Integration)
app.post("/api/voice-capture", async (req, res) => {
  const { noteText } = req.body;
  if (!noteText) {
    return res.status(400).json({ error: "noteText est requis" });
  }

  // Create a record of the raw voice note
  const newVoiceNote: VoiceNote = {
    id: `note-${Date.now()}`,
    text: noteText,
    timestamp: new Date().toLocaleTimeString("fr-FR"),
    processed: false
  };
  voiceNotes.push(newVoiceNote);
  saveDb();

  const client = getGeminiClient();
  if (!client) {
    // If Gemini key is missing, parse using simple rules
    console.log("Gemini API key is not configured, using fallback rule parser");
    let action = "Découverte";
    let place = "Kongo Central";
    let category = "forest";

    const textLower = noteText.toLowerCase();
    if (textLower.includes("muanda") || textLower.includes("plage") || textLower.includes("mangrove")) {
      place = "Muanda";
      action = "Explorer Plage de Muanda";
      category = "beach_access";
    } else if (textLower.includes("boma") || textLower.includes("baobab")) {
      place = "Boma";
      action = "Étudier le Baobab Historique";
      category = "history_edu";
    } else if (textLower.includes("zongo") || textLower.includes("chute")) {
      place = "Zongo";
      action = "Conseils éco aux Chutes de Zongo";
      category = "forest";
    } else if (textLower.includes("ngungu") || textLower.includes("grotte")) {
      place = "Mbanza-Ngungu";
      action = "Exploration de Grotte";
      category = "hiking";
    } else if (textLower.includes("kisantu") || textLower.includes("jardin")) {
      place = "Kisantu";
      action = "Reforestation Kisantu";
      category = "park";
    } else {
      action = noteText.length > 30 ? noteText.substring(0, 30) + "..." : noteText;
    }

    const newPermit: PendingPermit = {
      id: `permit-${Date.now()}`,
      title: action,
      subtitle: `${place} • Note capturée`,
      status: "PENDING",
      icon: category
    };
    pendingPermits.push(newPermit);

    newVoiceNote.processed = true;
    saveDb();
    return res.json({
      success: true,
      mode: "fallback",
      parsed: { action, place, category },
      addedItem: newPermit
    });
  }

  try {
    const prompt = `Analyze this user's vocal/text travel note about a cultural/natural trip in the Kongo Central province, DRC:
"${noteText}"

Extract:
1. Short action title in French (e.g., 'Visiter le Baobab de Stanley', 'Conseils éco pour Zongo', 'Éco-Volontariat Kisantu'). Max 4 words. Avoid any commercial wording (do not use buy, rent, hire, or book).
2. The primary destination/place name (e.g., 'Muanda', 'Boma', 'Zongo', 'Mbanza-Ngungu', 'Kisantu', 'Matadi').
3. An appropriate Material Symbols Outlined icon name (e.g. 'park', 'forest', 'history_edu', 'location_city', 'hiking', 'nature_people').

Respond STRICTLY with a valid JSON object matching this structure:
{
  "title": "Short title in French",
  "place": "Place name",
  "icon": "icon_name"
}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText.trim());

    const newPermit: PendingPermit = {
      id: `permit-${Date.now()}`,
      title: parsed.title || "Note patrimoniale",
      subtitle: parsed.place ? `${parsed.place} (En attente d'évaluation)` : "Observation en cours...",
      status: "PENDING",
      icon: parsed.icon || "pending"
    };
    pendingPermits.push(newPermit);
    newVoiceNote.processed = true;
    saveDb();

    res.json({
      success: true,
      mode: "ai",
      parsed,
      addedItem: newPermit
    });
  } catch (error: any) {
    console.error("Error processing voice capture with Gemini:", error);
    // Fallback on error
    const newPermit: PendingPermit = {
      id: `permit-${Date.now()}`,
      title: noteText.substring(0, 24) + "...",
      subtitle: "Note d'exploration locale",
      status: "PENDING",
      icon: "pending"
    };
    pendingPermits.push(newPermit);
    saveDb();
    res.json({
      success: true,
      mode: "error-fallback",
      error: error.message,
      addedItem: newPermit
    });
  }
});

// Start Vite dev server in development or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Kongo Explorer listening on http://localhost:${PORT}`);
  });
}

startServer();
