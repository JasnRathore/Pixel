// questions.js (FIXED + SIMPLIFIED for PIXEL)

export const LEVELS = ["beginner", "intermediate", "master"];

export function normalizeLevels(data, fallbackSubject = "this title") {

  // Already in correct format? (from your OpenRouter)
  if (data.beginner && data.intermediate && data.master) {
    return {
      beginner: normalizeArray(data.beginner, "easy"),
      intermediate: normalizeArray(data.intermediate, "medium"),
      master: normalizeArray(data.master, "hard"),
    };
  }

  // Old structured format support
  if (data?.levels?.length) {
    const output = { beginner: [], intermediate: [], master: [] };

    data.levels.forEach(lvl => {
      const id = lvl.id?.toLowerCase();
      if (LEVELS.includes(id)) {
        output[id] = normalizeArray(lvl.questions, id);
      }
    });

    if (output.beginner.length && output.intermediate.length && output.master.length) {
      return output;
    }
  }

  return buildFallback(fallbackSubject);
}

function normalizeArray(arr = [], difficulty) {
  return arr.slice(0, 3).map((q, i) => ({
    id: q.id || `${difficulty}-${i}-${Date.now()}`,
    question: q.question?.trim() || "Question missing",
    options: Array.isArray(q.options)
      ? q.options
      : ["A", "B", "C", "D"],
    answer: normalizeAnswer(q),
    difficulty
  }));
}

// If AI sends "correct: 1" — fix it to text
function normalizeAnswer(q) {
  if (typeof q.correct === "number" && q.options?.[q.correct]) {
    return q.options[q.correct];
  }

  if (typeof q.answer === "string") {
    return q.answer;
  }

  if (q.options?.length) {
    return q.options[0]; // fallback
  }

  return "A";
}

function buildFallback(subject) {
  return {
    beginner: [
      {
        id: "fallback-1",
        question: `What kind of universe does ${subject} take place in?`,
        options: ["Fantasy", "Reality", "Sci-fi", "History"],
        answer: "Fantasy"
      },
      {
        id: "fallback-2",
        question: `Which element is most associated with ${subject}?`,
        options: ["Power", "Magic", "Music", "War"],
        answer: "Magic"
      },
      {
        id: "fallback-3",
        question: `Which one is important in ${subject}?`,
        options: ["Friends", "Enemies", "Weapons", "School"],
        answer: "School"
      }
    ],
    intermediate: [
      {
        id: "fallback-4",
        question: `Which type of conflict appears in ${subject}?`,
        options: ["Internal", "Political", "Romantic", "Mythical"],
        answer: "Mythical"
      },
      {
        id: "fallback-5",
        question: `Which power structure appears in ${subject}?`,
        options: ["Kingdoms", "Guilds", "Houses", "Planets"],
        answer: "Houses"
      },
      {
        id: "fallback-6",
        question: `Who faces the biggest danger?`,
        options: ["Side character", "Villain", "Hero", "City"],
        answer: "Hero"
      }
    ],
    master: [
      {
        id: "fallback-7",
        question: `Which hidden symbol appears in ${subject}?`,
        options: ["Snake", "Lion", "Crown", "Mirror"],
        answer: "Mirror"
      },
      {
        id: "fallback-8",
        question: `What is the deepest theme?`,
        options: ["Power", "Death", "Love", "Memory"],
        answer: "Death"
      },
      {
        id: "fallback-9",
        question: `What separates true fans?`,
        options: ["Quotes", "Lore", "Music", "Movies"],
        answer: "Lore"
      }
    ]
  };
}

export function createQuizState(questionMap) {
  return {
    questionMap,
    score: 0
  };
}
