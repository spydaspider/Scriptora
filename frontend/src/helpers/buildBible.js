const buildBible = (rawBible) => {
  const formattedBible = {};

  rawBible.verses.forEach((item) => {
    const book = item.book_name.toLowerCase(); 
    const chapter = String(item.chapter);
    const verse = String(item.verse);

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