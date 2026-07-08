import bibleStructure from "../helpers/bibleStructure";

export const validateReference = (parsed) => {

  if (!parsed) {
    return {
      valid: false,
      reason: "Nothing parsed"
    };
  }

  if (!parsed.book) {
    return {
      valid: false,
      reason: "No book detected"
    };
  }

  if (parsed.confidence < 0.75) {
    return {
      valid: false,
      reason: "Low confidence"
    };
  }

  // Book exists?
  if (!bibleStructure[parsed.book]) {
    return {
      valid: false,
      reason: "Unknown book"
    };
  }

  // Allow "Genesis"
  if (!parsed.chapter && !parsed.verse) {
    return {
      valid: false,
      reason: "Book only"
    };
  }

  // Validate chapter
  if (parsed.chapter) {

    if (!bibleStructure[parsed.book][parsed.chapter]) {

      return {
        valid: false,
        reason: "Chapter does not exist"
      };

    }

  }

  // Validate verse
  if (parsed.chapter && parsed.verse) {

    const maxVerse =
      bibleStructure[parsed.book][parsed.chapter];

    if (parsed.verse > maxVerse) {

      return {
        valid: false,
        reason: "Verse does not exist"
      };

    }

  }

  return {
    valid: true
  };

};