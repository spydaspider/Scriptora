import buildBible from "../helpers/buildBible";
import web from "../data/bible.json";
import kjv from "../data/kjv.json";
import asv from "../data/asv.json";
import bookAliases from "../helpers/bookaliases";

const BIBLES = {
  WEB: buildBible(web),
  KJV: buildBible(kjv),
  ASV: buildBible(asv)
};

// DEFAULT VERSION (important)
let activeVersion = "WEB";

// allow switching from outside
export const setBibleVersion = (version) => {
  if (BIBLES[version]) {
    activeVersion = version;
  }
};

// optional helper (so UI can read it)
export const getBibleVersion = () => activeVersion;

// ----------------------------
// MAIN FUNCTION (UNCHANGED USAGE)
// ----------------------------
export const getVerse = (input, version = activeVersion) => {
  try {
    let bible = BIBLES[version];

    let text = input.toLowerCase().trim();

    text = text.replace(/(\d+)\s+(\d+)$/, "$1:$2");

    const match = text.match(/(.+)\s(\d+):(\d+)/);

    if (!match) {
      return "Invalid format. Example: John 3:16";
    }

    let bookInput = match[1].trim();
    const chapter = match[2];
    const verseNum = match[3];

    const book =
      bookAliases[bookInput] ||
      bookAliases[bookInput.replace(/\./g, "")];

    if (!book) return "Unknown book.";

    const normalizedBook = book.toLowerCase();

    const result =
      bible?.[normalizedBook]?.[chapter]?.[verseNum];

    if (result) {
      return `${book} ${chapter}:${verseNum} - ${result}`;
    }

    return "Verse not found.";
  } catch {
    return "Error reading verse.";
  }
};