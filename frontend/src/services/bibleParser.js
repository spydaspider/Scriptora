import stringSimilarity from "string-similarity";
import bookAliases from "../helpers/bookaliases";
import { convertWordsToNumbers } from "./numberConverter";

export const parseBibleReferenceSmart = (input) => {
  if (!input) return null;

  let text = input.toLowerCase().trim();

  // --------------------------
  // CLEANING
  // --------------------------
  text = text
    .replace(/vs\.?/g, "verse")
    .replace(/\s*:\s*/g, ":")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ");

  text = convertWordsToNumbers(text).replace(/\s+/g, " ").trim();

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
    .replaceAll("third", "3")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = text.split(" ");
  const cmd = text;

  // --------------------------
  // COMMANDS (FIXED PROPERLY)
  // --------------------------

  if (
    cmd === "next" ||
    tokens[0] === "next" ||
    cmd.includes("go forward") ||
    cmd.includes("move forward") ||
    cmd.includes("forward")
  ) {
    return {
      book: null,
      chapter: null,
      verse: null,
      command: "nextVerse",
      confidence: 1
    };
  }

  if (
    cmd === "back" ||
    cmd === "previous" ||
    tokens[0] === "back" ||
    cmd.includes("go back") ||
    cmd.includes("move back") ||
    cmd.includes("previous")
  ) {
    return {
      book: null,
      chapter: null,
      verse: null,
      command: "previousVerse",
      confidence: 1
    };
  }

  if (cmd.includes("next chapter")) {
    return {
      book: null,
      chapter: null,
      verse: null,
      command: "nextChapter",
      confidence: 1
    };
  }

  if (cmd.includes("previous chapter")) {
    return {
      book: null,
      chapter: null,
      verse: null,
      command: "previousChapter",
      confidence: 1
    };
  }

  // --------------------------
  // BOOK DETECTION
  // --------------------------
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

  if (!detectedBook) {
    const words = tokens;
    let bestScore = 0;

    for (const book of books) {
      for (let i = 0; i < words.length; i++) {
        const w1 = words[i];
        const w2 = words[i + 1] ? `${words[i]} ${words[i + 1]}` : w1;

        const s1 = stringSimilarity.compareTwoStrings(w1, book);
        const s2 = stringSimilarity.compareTwoStrings(w2, book);

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

  // --------------------------
  // NUMBER EXTRACTION
  // --------------------------
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

  return {
    book: bookName,
    chapter,
    verse,
    command: null,
    confidence: detectedBook ? 0.9 : 0.3
  };
};