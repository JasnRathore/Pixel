// questions.js (FIXED + CLEANED for PIXEL)

export const LEVELS = ["beginner", "intermediate", "master"];

export function normalizeLevels(data, fallbackSubject = "this title") {
  console.log("🔍 Normalizing data:", data);

  // Already in correct format? (from OpenRouter)
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

  console.warn("⚠️ Using fallback questions");
  return buildFallback(fallbackSubject);
}

function normalizeArray(arr = [], difficulty) {
  if (!Array.isArray(arr) || arr.length === 0) {
    console.warn(`⚠️ Empty or invalid array for ${difficulty}`);
    return [];
  }

  return arr.slice(0, 3).map((q, i) => {
    // Extract the answer
    let answer = normalizeAnswer(q);
    
    // Get options array
    let options = Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"];
    
    // Ensure the answer is in the options
    if (!options.includes(answer)) {
      console.warn(`⚠️ Answer "${answer}" not in options, adding it`);
      options[0] = answer;
    }

    return {
      id: q.id || `${difficulty}-${i}-${Date.now()}`,
      question: (q.question?.trim() || "Question missing").replace(/^LEGEND MODE:\s*/i, ''),
      options: options,
      answer: answer,
      difficulty
    };
  });
}

// If AI sends "correct: 1" — fix it to text
function normalizeAnswer(q) {
  // If correct is a number, get the option at that index
  if (typeof q.correct === "number" && q.options?.[q.correct]) {
    return q.options[q.correct];
  }

  // If answer is provided as string
  if (typeof q.answer === "string" && q.answer.trim()) {
    return q.answer.trim();
  }

  // If options exist, return first one as fallback
  if (q.options?.length) {
    return q.options[0];
  }

  return "A";
}

function buildFallback(subject) {
  return {
    beginner: [
      {
        id: "fallback-1",
        question: `What genre best describes ${subject}?`,
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
        question: `What is a key theme in ${subject}?`,
        options: ["Friendship", "Revenge", "Adventure", "Mystery"],
        answer: "Adventure"
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
        question: `What drives the main character in ${subject}?`,
        options: ["Power", "Love", "Justice", "Survival"],
        answer: "Justice"
      },
      {
        id: "fallback-6",
        question: `Who faces the biggest danger in ${subject}?`,
        options: ["Side character", "Villain", "Hero", "Everyone"],
        answer: "Hero"
      }
    ],
    master: [
      {
        id: "fallback-7",
        question: `What is a hidden symbol in ${subject}?`,
        options: ["Snake", "Lion", "Crown", "Mirror"],
        answer: "Mirror"
      },
      {
        id: "fallback-8",
        question: `What is the deepest theme of ${subject}?`,
        options: ["Power", "Death", "Love", "Memory"],
        answer: "Death"
      },
      {
        id: "fallback-9",
        question: `What separates casual fans from true fans of ${subject}?`,
        options: ["Knowing quotes", "Understanding lore", "Soundtrack knowledge", "Character names"],
        answer: "Understanding lore"
      }
    ]
  };
}

export function createQuizState(questionMap) {
  console.log("✅ Creating quiz state with:", questionMap);
  return {
    questionMap,
    score: 0
  };
}
