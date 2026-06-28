import stringSimilarity from "string-similarity";
import bookAliases from "../helpers/bookaliases";
import { convertWordsToNumbers } from "./numberConverter";

export const parseBibleReferenceSmart = (input) => {
  if (!input) return null;

  let text = input.toLowerCase().trim();

  // ----------------------------
  // CLEANING
  // ----------------------------
  text = text
    .replace(/vs\.?/g, "verse")
    .replace(/\s*:\s*/g, ":")
    .replace(/[.,!?]/g, "");

  text = convertWordsToNumbers(text);

  const corrections = {
    "some more": "samuel",
    "first some more": "1 samuel",
    "second some more": "2 samuel",
    "detrimony": "deuteronomy",
    "theronomy": "deuteronomy",
    "romance": "romans",
    "sams": "psalms",
    "salms": "psalms",
    "xodus": "exodus",
    "execost": "exodus",
    "revelations": "revelation"
  };

  for (const key in corrections) {
    text = text.replaceAll(key, corrections[key]);
  }

  text = text
    .replaceAll("first", "1")
    .replaceAll("second", "2")
    .replaceAll("third", "3");

  const cmd = text.trim();

  // ----------------------------
  // COMMANDS (FIXED + ROBUST)
  // ----------------------------
 // ----------------------------
// COMMANDS (ROBUST FINAL FIX)
// ----------------------------

const cmd = text.toLowerCase().trim().replace(/\s+/g, " ");

// helper matcher
const has = (word) => cmd.includes(word);

// ---------------- NEXT ----------------
if (
  cmd === "next" ||
  has("next verse") ||
  has("next chapter") ||
  has("forward") ||
  has("go forward") ||
  has("move forward") ||
  has("next please") ||
  has("go next")
) {
  return {
    book: null,
    chapter: null,
    verse: null,
    command: "nextVerse",
    confidence: 1
  };
}

// ---------------- PREVIOUS ----------------
if (
  cmd === "previous" ||
  has("previous verse") ||
  has("previous chapter") ||
  has("back") ||
  has("go back") ||
  has("move back") ||
  has("previous please")
) {
  return {
    book: null,
    chapter: null,
    verse: null,
    command: "previousVerse",
    confidence: 1
  };
}

// ---------------- CHAPTER NAV ----------------
if (
  has("next chapter") ||
  has("chapter next")
) {
  return {
    book: null,
    chapter: null,
    verse: null,
    command: "nextChapter",
    confidence: 1
  };
}

if (
  has("previous chapter") ||
  has("chapter back")
) {
  return {
    book: null,
    chapter: null,
    verse: null,
    command: "previousChapter",
    confidence: 1
  };
}
  // ----------------------------
  // BOOK DETECTION
  // ----------------------------
  let detectedBook = null;

  const books = Object.keys(bookAliases).sort(
    (a, b) => b.length - a.length
  );

  for (const book of books) {
    if (text.includes(book)) {
      detectedBook = book;
      break;
    }
  }

  // fuzzy fallback
  if (!detectedBook) {
    const words = text.split(" ");
    let bestScore = 0;

    for (const book of books) {
      for (let i = 0; i < words.length; i++) {
        const chunk1 = words[i];
        const chunk2 = words[i + 1]
          ? `${words[i]} ${words[i + 1]}`
          : chunk1;

        const s1 = stringSimilarity.compareTwoStrings(chunk1, book);
        const s2 = stringSimilarity.compareTwoStrings(chunk2, book);

        if (s1 > bestScore && s1 > 0.75) {
          bestScore = s1;
          detectedBook = book;
        }

        if (s2 > bestScore && s2 > 0.75) {
          bestScore = s2;
          detectedBook = book;
        }
      }
    }
  }

  const bookName = detectedBook ? bookAliases[detectedBook] : null;

  // ----------------------------
  // NUMBER EXTRACTION
  // ----------------------------
  let chapter = null;
  let verse = null;

  let match = text.match(/(\d+):(\d+)/);
  if (match) {
    chapter = Number(match[1]);
    verse = Number(match[2]);
  }

  match = text.match(/chapter\s*(\d+)/);
  if (match) chapter = Number(match[1]);

  match = text.match(/verse\s*(\d+)/);
  if (match) verse = Number(match[1]);

  const nums = text.match(/\d+/g);
  if (nums) {
    if (!chapter && nums[0]) chapter = Number(nums[0]);
    if (!verse && nums[1]) verse = Number(nums[1]);
  }

  // ----------------------------
  // FINAL RETURN (ALWAYS SAFE)
  // ----------------------------
  return {
    book: bookName,
    chapter,
    verse,
    command: null,
    confidence: detectedBook ? 0.9 : 0.3
  };
};