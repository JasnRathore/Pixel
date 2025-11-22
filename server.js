import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// BACKEND IMPORTS
import { searchTitles, fetchById } from "./js/tmdb.js";
import { searchGames, fetchGameById } from "./js/rawg.js";
import { fetchQuizQuestions } from "./js/routerAI.js";
import { normalizeLevels, createQuizState } from "./js/questions.js";
import { searchSpotify, getTrackById, getArtistById } from "./spotify.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ================== MAIN PAGE ==================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ================== SEARCH ==================
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.query;
    console.log("🔍 Searching:", query);

    const [tmdb, games, spotify] = await Promise.all([
      searchTitles(query),
      searchGames(query),
      searchSpotify(query, "track")
    ]);

    const combined = [...(tmdb || []), ...(games || []), ...(spotify || [])];

    console.log("✅ Sending:", combined.length, "results");
    res.json(combined);

  } catch (err) {
    console.error("❌ Search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// ================== DETAILS ==================
app.get("/api/details", async (req, res) => {
  try {
    const { id, source, type } = req.query;

    let data = null;

    if (source === "tmdb") {
      data = await fetchById(id, type).catch(() => null);
    } 
    else if (source === "rawg") {
      data = await fetchGameById(id).catch(() => null);
    } 
    else if (source === "spotify") {
      if (type === "song") data = await getTrackById(id);
      if (type === "artist") data = await getArtistById(id);
    }

    if (!data) {
      return res.status(500).json({ error: "Failed to fetch content" });
    }

    res.json(data);

  } catch (err) {
    console.error("❌ Detail error:", err);
    res.status(500).json({ error: "Details failed" });
  }
});


// ================== QUIZ ==================
app.post("/api/quiz", async (req, res) => {
  try {
    const content = req.body;

    const raw = await fetchQuizQuestions(content);

    if (!raw) {
      console.error("❌ Quiz generator returned null");
      return res.status(500).json({ error: "AI returned no quiz" });
    }

    const normalized = normalizeLevels(raw, content.title);

    if (
      !normalized ||
      !normalized.beginner ||
      !normalized.intermediate ||
      !normalized.master
    ) {
      console.error("❌ Normalization failed:", normalized);
      return res.status(500).json({ error: "Normalization failed" });
    }

    const quizState = createQuizState(normalized);
    console.log("✅ FINAL QUIZ STATE SENT TO FRONTEND:", quizState);

    res.json(quizState);

  } catch (err) {
    console.error("❌ Quiz error:", err);
    res.status(500).json({ error: "Quiz generation failed" });
  }
});


// ================ START SERVER ===============
app.listen(PORT, () => {
  console.log(`✅ PIXEL server running at: http://localhost:${PORT}`);
});
