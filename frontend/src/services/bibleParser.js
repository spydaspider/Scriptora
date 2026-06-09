import stringSimilarity from "string-similarity";
import bookAliases from "../helpers/bookaliases";
import { convertWordsToNumbers } from "./numberConverter";

// -------------------------------------
// NORMALIZE BOOK NAME (CRITICAL FIX)
// -------------------------------------
const normalizeBook = (b) =>
  String(b)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");

// -------------------------------------
// MAIN PARSER
// -------------------------------------
export const parseBibleReferenceSmart = (input) => {

  let text = input.toLowerCase();

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

  // -------------------------------------
  // DETECT BOOK
  // -------------------------------------
  let detectedBook = null;

  const books = Object.keys(bookAliases)
    .sort((a, b) => b.length - a.length);

  for (const book of books) {
    if (text.includes(book)) {
      detectedBook = book;
      break;
    }
  }

  if (!detectedBook) {

    const words = text.split(" ");
    let bestScore = 0;

    for (const book of books) {
      for (let i = 0; i < words.length; i++) {

        const chunk1 = words[i];
        const chunk2 =
          i < words.length - 1
            ? `${words[i]} ${words[i + 1]}`
            : chunk1;

        const score1 = stringSimilarity.compareTwoStrings(chunk1, book);
        const score2 = stringSimilarity.compareTwoStrings(chunk2, book);

        if (score1 > bestScore && score1 > 0.75) {
          bestScore = score1;
          detectedBook = book;
        }

        if (score2 > bestScore && score2 > 0.75) {
          bestScore = score2;
          detectedBook = book;
        }
      }
    }
  }

  if (!detectedBook) return null;

  // -------------------------------------
  // IMPORTANT FIX: USE DETECTED BOOK DIRECTLY
  // -------------------------------------
  const bookName = bookAliases[detectedBook] || detectedBook;

  const remaining = text
    .replace(detectedBook, "")
    .trim();

  let chapter = null;
  let verse = null;

  let match = remaining.match(/chapter\s*(\d+)\s*verse\s*(\d+)/);

  if (match) {
    chapter = match[1];
    verse = match[2];
  }

  if (!chapter || !verse) {
    match = remaining.match(/(\d+):(\d+)/);
    if (match) {
      chapter = match[1];
      verse = match[2];
    }
  }

  if (!chapter || !verse) {
    const nums = remaining.match(/\d+/g);
    if (nums && nums.length >= 2) {
      chapter = nums[0];
      verse = nums[1];
    }
  }

  if (!chapter || !verse) return null;

  // -------------------------------------
  // FINAL FIX: NORMALIZE OUTPUT BOOK
  // -------------------------------------
  const normalizeFinalBook = (b) => {
  const x = b.toLowerCase().trim();

  if (x === "psalm") return "Psalms";
  if (x === "psalms") return "Psalms";

  return b;
};

return {
  book: bookName.toLowerCase(),
  chapter,
  verse
};
};