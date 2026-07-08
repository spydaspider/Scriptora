import bibleData from "../data/bible.json";

const bibleStructure = {};

bibleData.verses.forEach((verse) => {
  const book = verse.book_name;
  const chapter = Number(verse.chapter);
  const verseNum = Number(verse.verse);

  if (!bibleStructure[book]) {
    bibleStructure[book] = {};
  }

  // Store the highest verse number in each chapter
  if (
    !bibleStructure[book][chapter] ||
    verseNum > bibleStructure[book][chapter]
  ) {
    bibleStructure[book][chapter] = verseNum;
  }
});

export default bibleStructure;