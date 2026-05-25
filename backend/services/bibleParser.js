const bibleFixes = require("../services/utils/bibleFixes");
const stringSimilarity = require("string-similarity");
const bookAliases = require("./utils/bookAliases.js");

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
// BOOK DETECTION (ROBUST)
// ------------------------------
const detectBook = (text) => {
  const books = Object.keys(bookAliases)
    .sort((a, b) => b.length - a.length);

  // direct match first
  for (const book of books) {
    if (text.includes(book)) return book;
  }

  // fuzzy match
  let best = { book: null, score: 0 };

  const words = text.split(" ");

  for (const book of books) {
    for (let i = 0; i < words.length; i++) {

      const w1 = words[i];
      const w2 = words[i + 1] ? `${words[i]} ${words[i + 1]}` : w1;

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
// MAIN PARSER V3
// ------------------------------
const parseBibleReference = (input) => {

  if (!input) return null;

  let text = input.toLowerCase().trim();

  // STEP 1: cleanup speech noise
  text = bibleFixes(text);

  text = text
    .replace(/vs\.?/g, "verse")
    .replace(/\s*:\s*/g, ":")
    .replace(/[.,!?]/g, "");

  // STEP 2: normalize words
  text = text
    .replace(/charter/g, "chapter")
    .replace(/verses?/g, "verse")
    .replace(/first/g, "1")
    .replace(/second/g, "2")
    .replace(/third/g, "3");

  // STEP 3: roman numerals → numbers
  text = convertRoman(text);

  // STEP 4: detect book
  const detectedBook = detectBook(text);

  if (!detectedBook) {
    return null;
  }

  // STEP 5: remove book from string
  const remaining = text
    .replace(detectedBook, "")
    .trim();

  let chapter = null;
  let verse = null;

  // FORMAT 1: chapter X verse Y
  let match = remaining.match(
    /chapter\s*(\d+)\s*verse\s*(\d+)/
  );

  if (match) {
    chapter = match[1];
    verse = match[2];
  }

  // FORMAT 2: X:Y
  if (!chapter || !verse) {
    match = remaining.match(/(\d+)\s*:\s*(\d+)/);

    if (match) {
      chapter = match[1];
      verse = match[2];
    }
  }

  // FORMAT 3: X Y
  if (!chapter || !verse) {
    match = remaining.match(/(\d+)\s+(\d+)/);

    if (match) {
      chapter = match[1];
      verse = match[2];
    }
  }

  // FORMAT 4: fallback numbers
  if (!chapter) {
    const nums = remaining.match(/\d+/g);

    if (nums && nums.length >= 2) {
      chapter = nums[0];
      verse = nums[1];
    }
  }

  if (!chapter) return null;

  return {
    book: bookAliases[detectedBook],
    chapter,
    verse: verse || null,
    confidence: 0.92
  };
};

module.exports = {
  parseBibleReference
};