// js/routerAI.js

import dotenv from "dotenv";
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/*
  3 Levels:
  - Beginner
  - Intermediate
  - Master

  4 questions per level
*/

const SYSTEM_PROMPT = `
You are PIXEL — a strict quiz generator.

Return ONLY valid JSON:

{
  "beginner": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correct": 0
    }
  ],
  "intermediate": [same],
  "master": [same]
}

Rules:
- 3 questions ONLY per level
- Correct must be a NUMBER (0,1,2,3)
- Do NOT wrap in markdown
- Do NOT write explanations
`;


function buildUserPrompt(metadata) {
  return `
TITLE: ${metadata.title}
MEDIA TYPE: ${metadata.mediaType}
YEAR: ${metadata.year}
GENRES: ${metadata.genre}
OVERVIEW: ${metadata.overview}

Create fun and creative quiz questions for real fans.
Avoid obvious stuff. No title in options.
`;
}

let isFetching = false;

export async function fetchQuizQuestions(metadata) {
  if (isFetching) {
    console.log("⏳ Already fetching quiz, skipping...");
    return await new Promise(resolve => {
      const interval = setInterval(() => {
        if (!isFetching) {
          clearInterval(interval);
          resolve(fetchQuizQuestions(metadata));
        }
      }, 200);
    });
  }
  
  if (!OPENROUTER_API_KEY) {
    console.error("❌ No OPENROUTER_API_KEY found in environment");
    return null;
  }

  isFetching = true;

  try {
    console.log("🧠 Generating quiz for:", metadata.title);
    console.log("✅ USING KEY:", OPENROUTER_API_KEY.slice(0, 12));

    const body = {
      model: "openai/gpt-4.1-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(metadata) }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8080",
        "X-Title": "PIXEL Quiz App"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenRouter:", errorText);
      return null;
    }

    const data = await response.json();
    let content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("❌ No AI content");
      return null;
    }

    // ---- Extract JSON block safely ----
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    if (start === -1 || end === -1) {
      console.error("❌ Invalid AI format (no JSON braces):", content);
      return null;
    }

    const cleanJSON = content.slice(start, end + 1);

    let parsed;
    try {
      parsed = JSON.parse(cleanJSON);
    } catch (error) {
      console.error("❌ JSON parse failed. Raw content:\n", cleanJSON);
      return null;
    }

    // 🔑 IMPORTANT CHANGE:
    // We **do not** require parsed.levels anymore.
    // questions.js::normalizeLevels can handle:
    //   - parsed.levels = [...]
    //   - parsed.beginner / parsed.intermediate / parsed.master
    const hasLevelsArray = Array.isArray(parsed.levels);
    const hasDirectLevels =
      Array.isArray(parsed.beginner) ||
      Array.isArray(parsed.intermediate) ||
      Array.isArray(parsed.master);

    if (!hasLevelsArray && !hasDirectLevels) {
      console.error("❌ AI returned unsupported structure:", parsed);
      return null;
    }

    console.log("✅ Quiz generated correctly");
    return parsed;

  } catch (err) {
    console.error("❌ Quiz error:", err.message);
    return null;

  } finally {
    // make sure the lock is always released
    isFetching = false;
  }
}
