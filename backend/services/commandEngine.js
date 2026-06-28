export const runCommand = ({
  type,
  context,
  setContext,
  setQuery,
  fetchVerse
}) => {

  const { book, chapter, verse } = context;

  // -------------------
  // NEXT VERSE
  // -------------------
  if (type === "NEXT_VERSE") {
    if (!book || !chapter || !verse) return;

    const nextVerse = Number(verse) + 1;

    const ref = `${book} ${chapter}:${nextVerse}`;

    setContext({
      book,
      chapter,
      verse: nextVerse
    });

    setQuery(ref);
    fetchVerse(ref);
  }

  // -------------------
  // PREVIOUS VERSE
  // -------------------
  if (type === "PREVIOUS_VERSE") {
    if (!book || !chapter || verse <= 1) return;

    const prevVerse = Number(verse) - 1;

    const ref = `${book} ${chapter}:${prevVerse}`;

    setContext({
      book,
      chapter,
      verse: prevVerse
    });

    setQuery(ref);
    fetchVerse(ref);
  }

  // -------------------
  // NEXT CHAPTER
  // -------------------
  if (type === "NEXT_CHAPTER") {
    if (!book || !chapter) return;

    const nextChapter = Number(chapter) + 1;

    const ref = `${book} ${nextChapter}:1`;

    setContext({
      book,
      chapter: nextChapter,
      verse: 1
    });

    setQuery(ref);
    fetchVerse(ref);
  }

  // -------------------
  // PREVIOUS CHAPTER
  // -------------------
  if (type === "PREVIOUS_CHAPTER") {
    if (!book || !chapter || chapter <= 1) return;

    const prevChapter = Number(chapter) - 1;

    const ref = `${book} ${prevChapter}:1`;

    setContext({
      book,
      chapter: prevChapter,
      verse: 1
    });

    setQuery(ref);
    fetchVerse(ref);
  }

  // -------------------
  // CLEAR
  // -------------------
  if (type === "CLEAR") {
    setContext({
      book: null,
      chapter: null,
      verse: null
    });

    setQuery("");
    fetchVerse("");
  }
};