import bibleData from "../data/bible.json";

// -------------------------------------
// NORMALIZE HELPERS
// -------------------------------------
const normalizeBook = (book) => {
  return book.trim().toLowerCase();
};

const normalizeNumber = (n) => Number(n);

// -------------------------------------
// GET PASSAGE (CORE)
// -------------------------------------
export const getPassage = (parsed) => {
  const {
    book,
    chapter,
    startVerse,
    endVerse
  } = parsed;

  const bookName = normalizeBook(book);
  const chapterNum = normalizeNumber(chapter);

  // STEP 1: FILTER BY BOOK + CHAPTER (FIXED)
  const verses = bibleData.verses.filter((v) => {
    return (
      normalizeBook(v.book_name) === bookName &&
      normalizeNumber(v.chapter) === chapterNum
    );
  });

  if (!verses.length) return "Passage not found.";

  // -------------------------------------
  // SINGLE VERSE
  // -------------------------------------
  if (!endVerse) {
    const verseNum = normalizeNumber(startVerse);

    const verse = verses.find(
      (v) => normalizeNumber(v.verse) === verseNum
    );

    if (!verse) return "Verse not found.";

    return `${verse.book_name} ${verse.chapter}:${verse.verse} — ${verse.text}`;
  }

  // -------------------------------------
  // VERSE RANGE
  // -------------------------------------
  const start = normalizeNumber(startVerse);
  const end = normalizeNumber(endVerse);

  const range = verses.filter(
    (v) =>
      normalizeNumber(v.verse) >= start &&
      normalizeNumber(v.verse) <= end
  );

  if (!range.length) return "Range not found.";

  let output = `${book} ${chapter}:${startVerse}-${endVerse}\n\n`;

  range.forEach((v) => {
    output += `${v.verse}. ${v.text}\n`;
  });

  return output.trim();
};

// -------------------------------------
// FIND INDEX (SAFE VERSION)
// -------------------------------------
const findIndex = (session) => {
  return bibleData.verses.findIndex((v) => {
    return (
      normalizeBook(v.book_name) === normalizeBook(session.book) &&
      normalizeNumber(v.chapter) === normalizeNumber(session.chapter) &&
      normalizeNumber(v.verse) === normalizeNumber(session.verse)
    );
  });
};

// -------------------------------------
// NEXT VERSE
// -------------------------------------
export const getNextVerse = (session) => {
  const index = findIndex(session);

  if (index === -1) return null;

  const next = bibleData.verses[index + 1];

  if (!next) return null;

  return {
    text: `${next.book_name} ${next.chapter}:${next.verse} — ${next.text}`,
    session: {
      book: next.book_name,
      chapter: next.chapter,
      verse: next.verse
    },
    reference: `${next.book_name} ${next.chapter}:${next.verse}`
  };
};

// -------------------------------------
// PREVIOUS VERSE
// -------------------------------------
export const getPreviousVerse = (session) => {
  const index = findIndex(session);

  if (index <= 0) return null;

  const prev = bibleData.verses[index - 1];

  return {
    text: `${prev.book_name} ${prev.chapter}:${prev.verse} — ${prev.text}`,
    session: {
      book: prev.book_name,
      chapter: prev.chapter,
      verse: prev.verse
    },
    reference: `${prev.book_name} ${prev.chapter}:${prev.verse}`
  };
};

// -------------------------------------
// NEXT CHAPTER
// -------------------------------------
export const getNextChapter = (session) => {
  const book = normalizeBook(session.book);
  const chapter = normalizeNumber(session.chapter);

  const next = bibleData.verses.find(
    (v) =>
      normalizeBook(v.book_name) === book &&
      normalizeNumber(v.chapter) === chapter + 1 &&
      normalizeNumber(v.verse) === 1
  );

  if (!next) return null;

  return {
    text: `${next.book_name} ${next.chapter}:1 — ${next.text}`,
    session: {
      book: next.book_name,
      chapter: next.chapter,
      verse: 1
    },
    reference: `${next.book_name} ${next.chapter}:1`
  };
};

// -------------------------------------
// PREVIOUS CHAPTER
// -------------------------------------
export const getPreviousChapter = (session) => {
  const book = normalizeBook(session.book);
  const chapter = normalizeNumber(session.chapter);

  const prev = bibleData.verses.find(
    (v) =>
      normalizeBook(v.book_name) === book &&
      normalizeNumber(v.chapter) === chapter - 1 &&
      normalizeNumber(v.verse) === 1
  );

  if (!prev) return null;

  return {
    text: `${prev.book_name} ${prev.chapter}:1 — ${prev.text}`,
    session: {
      book: prev.book_name,
      chapter: prev.chapter,
      verse: 1
    },
    reference: `${prev.book_name} ${prev.chapter}:1`
  };
};