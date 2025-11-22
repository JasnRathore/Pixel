export const LEGEND_INFO = "Legend mode uses indirect hints, not direct questions.";

const usedLegendSet = new Set();

/*
  LEGEND MODE TYPES (rotates per round)
  1. Side Character
  2. Iconic Object / Place
  3. Tagline / Lore hint
  4. Song / OST clue (for music & movies)
  5. Gameplay / Universe hint
*/

export function generateLegendPrompt(data, index = 0) {
  const title = data.title;
  const genre = data.genre || "";
  const overview = data.overview || "";
  const type = (data.mediaType || "").toLowerCase();

  const promptTypes = [
    `Give a SIDE CHARACTER from "${title}" that hardcore fans will know.`,
    `Give an ICONIC OBJECT or PLACE related to "${title}".`,
    `Give a LORE HINT in one sentence without saying the title.`,
    `Give a MUSIC/OST/ARTIST clue related to "${title}".`,
    `Give a GAMEPLAY or UNIVERSE unique element for "${title}".`
  ];

  const selected = promptTypes[index % promptTypes.length];

  return `
You are a legendary storyteller for a pop culture quiz.
${selected}

Content details:
Title: ${title}
Genre: ${genre}
Overview: ${overview}
Type: ${type}

Respond ONLY in a short sentence or noun phrase.
Do not include the title name.
`;
}

export function checkLegendAnswer(guess, correctTitle) {
  if (!guess || !guess.trim()) {
    return { valid: false, error: "Enter your answer first" };
  }

  const g = guess.toLowerCase().trim();
  const c = correctTitle.toLowerCase().trim();

  if (g === c) return { valid: true, correct: true };

  if (c.includes(g) || g.includes(c)) {
    if (g.length > 3) return { valid: true, correct: true };
  }

  return { valid: true, correct: false };
}

export function markLegendUsed(title) {
  usedLegendSet.add(title.toLowerCase());
}

export function isLegendUsed(title) {
  return usedLegendSet.has(title.toLowerCase());
}

export function resetLegends() {
  usedLegendSet.clear();
}
