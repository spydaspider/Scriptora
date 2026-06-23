import stringSimilarity from "string-similarity";
import bookAliases from "../helpers/bookaliases";
import { convertWordsToNumbers } from "./numberConverter";

export const parseBibleReferenceSmart = (input) => {

  if (!input) return null;

  // -----------------------------
  // CLEAN INPUT
  // -----------------------------
  let text = input
    .toLowerCase()
    .trim()
    .replace(/vs\.?/g, "verse")
    .replace(/\s*:\s*/g, ":")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ");

  text = convertWordsToNumbers(text);

  // -----------------------------
  // COMMON SPEECH CORRECTIONS
  // -----------------------------
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

  // -----------------------------
  // COMMANDS
  // -----------------------------
  const cmd = text;

  if (
    cmd === "next" ||
    cmd === "forward" ||
    cmd === "go forward" ||
    cmd === "move forward" ||
    cmd === "next verse"
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
    cmd === "go back" ||
    cmd === "move back" ||
    cmd === "previous verse"
  ) {
    return {
      book: null,
      chapter: null,
      verse: null,
      command: "previousVerse",
      confidence: 1
    };
  }

  if (cmd === "next chapter") {
    return {
      book: null,
      chapter: null,
      verse: null,
      command: "nextChapter",
      confidence: 1
    };
  }

  if (cmd === "previous chapter") {
    return {
      book: null,
      chapter: null,
      verse: null,
      command: "previousChapter",
      confidence: 1
    };
  }

  // -----------------------------
  // BOOK DETECTION
  // -----------------------------
  let detectedBook = null;

  const books = Object.keys(bookAliases)
    .sort((a, b) => b.length - a.length);

  for (const book of books) {

    if (text.includes(book)) {
      detectedBook = book;
      break;
    }
  }

  // -----------------------------
  // FUZZY MATCH
  // -----------------------------
  if (!detectedBook) {

    const words = text.split(" ");

    let bestScore = 0;

    for (const book of books) {

      for (let i = 0; i < words.length; i++) {

        const oneWord = words[i];

        const twoWords =
          words[i + 1]
            ? `${words[i]} ${words[i + 1]}`
            : oneWord;

        const score1 =
          stringSimilarity.compareTwoStrings(
            oneWord,
            book
          );

        const score2 =
          stringSimilarity.compareTwoStrings(
            twoWords,
            book
          );

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

  const bookName =
    detectedBook
      ? bookAliases[detectedBook]
      : null;

  // -----------------------------
  // CHAPTER + VERSE EXTRACTION
  // -----------------------------
  let chapter = null;
  let verse = null;

  // John 3:16
  let match =
    text.match(/(\d+):(\d+)/);

  if (match) {

    chapter = Number(match[1]);
    verse = Number(match[2]);
  }

  // chapter 4 verse 5
  match =
    text.match(
      /chapter\s*(\d+)\s*verse\s*(\d+)/
    );

  if (match) {

    chapter = Number(match[1]);
    verse = Number(match[2]);
  }

  // chapter 4
  if (!chapter) {

    match =
      text.match(/chapter\s*(\d+)/);

    if (match) {
      chapter = Number(match[1]);
    }
  }

  // verse 5
  if (!verse) {

    match =
      text.match(/verse\s*(\d+)/);

    if (match) {
      verse = Number(match[1]);
    }
  }

  // -----------------------------
  // RAW NUMBERS
  // -----------------------------
  if (!chapter && !verse) {

    const nums =
      text.match(/\d+/g);

    if (nums?.length === 1) {

      // single number -> verse
      if (!bookName) {

        verse = Number(nums[0]);

      } else {

        chapter = Number(nums[0]);
      }
    }

    if (nums?.length >= 2) {

      chapter = Number(nums[0]);
      verse = Number(nums[1]);
    }
  }

  // -----------------------------
  // RETURN
  // -----------------------------
  return {
    book: bookName,
    chapter,
    verse,
    command: null,
    confidence:
      detectedBook
        ? 0.9
        : 0.3
  };
};