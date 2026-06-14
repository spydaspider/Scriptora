import stringSimilarity from "string-similarity";
import bookAliases from "../helpers/bookaliases";
import { convertWordsToNumbers } from "./numberConverter";

export const parseBibleReferenceSmart = (input) => {

  if (!input) return null;

  let text = input.toLowerCase().trim();

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

  // --------------------------
  // COMMANDS
  // --------------------------
  if (text.includes("next verse")) return { command: "nextVerse" };
  if (text.includes("previous verse")) return { command: "previousVerse" };
  if (text.includes("next chapter")) return { command: "nextChapter" };
  if (text.includes("previous chapter")) return { command: "previousChapter" };

  // --------------------------
  // DETECT BOOK
  // --------------------------
  let detectedBook = null;

  const books = Object.keys(bookAliases)
    .sort((a, b) => b.length - a.length);

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

  // --------------------------
  // EXTRACT NUMBERS
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

  // --------------------------
  // ✅ ALWAYS RETURN SAME SHAPE
  // --------------------------
  return {
    book: bookName,
    chapter,
    verse,
    command: null,
    confidence: detectedBook ? 0.9 : 0.3
  };
};