import buildBible from "../helpers/buildBible";
import rawBible from "../data/bible.json";
import bookAliases from "../helpers/bookaliases";

const bible = buildBible(rawBible);

export const getVerse = (input) => {

  try {

    let text =
      input.toLowerCase().trim();

    text = text.replace(
      /(\d+)\s+(\d+)$/,
      "$1:$2"
    );

    const match =
      text.match(
        /(.+)\s(\d+):(\d+)/
      );

    if (!match) {
      return "Invalid format. Example: John 3:16";
    }

    let bookInput =
      match[1].trim();

    const chapter =
      match[2];

    const verseNum =
      match[3];

    const book =
  bookAliases[bookInput] ||
  bookAliases[bookInput.replace(/\./g, "")];

if (!book) {
  return "Unknown book.";
}

const normalizedBook = book.toLowerCase();

    const result =
      bible[normalizedBook]?.[chapter]?.[verseNum];

    if (result) {
      return `${book} ${chapter}:${verseNum} - ${result}`;
    }

    return "Verse not found.";

  } catch {
    return "Error reading verse.";
  }
};