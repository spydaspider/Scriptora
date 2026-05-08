const buildBible = (rawBible) => {
  const formattedBible = {};

  rawBible.verses.forEach((item) => {
    const book = item.book_name;
    const chapter = item.chapter.toString();
    const verse = item.verse.toString();

    if (!formattedBible[book]) {
      formattedBible[book] = {};
    }

    if (!formattedBible[book][chapter]) {
      formattedBible[book][chapter] = {};
    }

    formattedBible[book][chapter][verse] = item.text;
  });

  return formattedBible;
};

export default buildBible;