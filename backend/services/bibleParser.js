const bibleFixes = require("../services/utils/bibleFixes");
const stringSimilarity = require("string-similarity");
const bookAliases = require("./utils/bookAliases");

// ------------------------------
// ROMAN NUMERALS
// ------------------------------
const romanMap = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5,
  vi: 6, vii: 7, viii: 8, ix: 9, x: 10
};

const convertRoman = (text) => {
  return text.replace(
    /\b(i{1,3}|iv|v|vi{0,3}|ix|x)\b/gi,
    (m) => romanMap[m.toLowerCase()] || m
  );
};

// ------------------------------
// BOOK DETECTION
// ------------------------------
const detectBook = (text) => {
  const books = Object.keys(bookAliases)
    .sort((a, b) => b.length - a.length);

  // direct match
  for (const book of books) {
    if (text.includes(book)) return book;
  }

  // fuzzy match
  let best = { book: null, score: 0 };
  const words = text.split(" ");

  for (const book of books) {
    for (let i = 0; i < words.length; i++) {

      const w1 = words[i];
      const w2 = words[i + 1]
        ? `${words[i]} ${words[i + 1]}`
        : w1;

      const s1 = stringSimilarity.compareTwoStrings(w1, book);
      const s2 = stringSimilarity.compareTwoStrings(w2, book);

      if (s1 > best.score && s1 > 0.75) {
        best = { book, score: s1 };
      }

      if (s2 > best.score && s2 > 0.75) {
        best = { book, score: s2 };
      }
    }
  }

  return best.book;
};

// ------------------------------
// MAIN PARSER (FIXED)
// ------------------------------
const parseBibleReference = (input) => {

  if (!input) return null;

  let text = input.toLowerCase().trim();

  // STEP 1: speech cleanup
  text = bibleFixes(text);

  // normalize words
  text = text
    .replace(/vs\.?/g, "verse")
    .replace(/verses?/g, "verse")
    .replace(/charter/g, "chapter")
    .replace(/[.,!?]/g, "");

  // STEP 2: number words + simple cleanup
  text = text
    .replace(/first/g, "1")
    .replace(/second/g, "2")
    .replace(/third/g, "3");

  // STEP 3: roman numerals
  text = convertRoman(text);

  // STEP 4: detect book
  const detectedBook = detectBook(text);

  if (!detectedBook) return null;

  const book = bookAliases[detectedBook];

  // remove book from text
  const remaining = text.replace(detectedBook, "").trim();

  let chapter = null;
  let verse = null;

  // --------------------------
  // FORMAT 1: chapter X verse Y
  // --------------------------
  let match = remaining.match(/chapter\s*(\d+)\s*verse\s*(\d+)/);
  if (match) {
    chapter = Number(match[1]);
    verse = Number(match[2]);
  }

  // --------------------------
  // FORMAT 2: X:Y
  // --------------------------
  if (!chapter || !verse) {
    match = remaining.match(/(\d+)\s*:\s*(\d+)/);
    if (match) {
      chapter = Number(match[1]);
      verse = Number(match[2]);
    }
  }

  // --------------------------
  // FORMAT 3: X Y
  // --------------------------
  if (!chapter || !verse) {
    match = remaining.match(/(\d+)\s+(\d+)/);
    if (match) {
      chapter = Number(match[1]);
      verse = Number(match[2]);
    }
  }

  // --------------------------
  // FORMAT 4: chapter only
  // --------------------------
  const chapterOnly = remaining.match(/chapter\s*(\d+)/);
  if (chapterOnly && !chapter) {
    chapter = Number(chapterOnly[1]);
  }

  // --------------------------
  // FORMAT 5: verse only
  // --------------------------
  const verseOnly = remaining.match(/verse\s*(\d+)/);
  if (verseOnly && !verse) {
    verse = Number(verseOnly[1]);
  }

  // --------------------------
  // fallback numbers
  // --------------------------
  if (!chapter || !verse) {
    const nums = remaining.match(/\d+/g);

    if (nums && nums.length >= 2) {
      if (!chapter) chapter = Number(nums[0]);
      if (!verse) verse = Number(nums[1]);
    } else if (nums && nums.length === 1) {
      if (!chapter) chapter = Number(nums[0]);
    }
  }

  // --------------------------
  // RETURN PARTIAL OR FULL
  // --------------------------
  if (!chapter && !verse) return null;

  return {
    book,
    chapter,
    verse,
    partial: true
  };
};

module.exports = {
  parseBibleReference
};