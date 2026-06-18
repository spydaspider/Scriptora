export const processCommand = (speech) => {
  if (!speech) return null;

  const text = speech
    .toLowerCase()
    .trim()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ");

  // -------------------
  // NEXT VERSE
  // -------------------
  if (
    text === "next" ||
    text === "next verse" ||
    text.startsWith("next ") ||
    text.includes("forward") ||
    text.includes("go forward") ||
    text.includes("move forward")
  ) {
    return { type: "NEXT_VERSE" };
  }

  // -------------------
  // PREVIOUS VERSE
  // -------------------
  if (
    text === "previous" ||
    text === "previous verse" ||
    text === "back" ||
    text === "go back" ||
    text === "move back"
  ) {
    return { type: "PREVIOUS_VERSE" };
  }

  // -------------------
  // NEXT CHAPTER
  // -------------------
  if (
    text === "next chapter" ||
    text.includes("next chapter")
  ) {
    return { type: "NEXT_CHAPTER" };
  }

  // -------------------
  // PREVIOUS CHAPTER
  // -------------------
  if (
    text === "previous chapter" ||
    text.includes("previous chapter")
  ) {
    return { type: "PREVIOUS_CHAPTER" };
  }

  // -------------------
  // CLEAR SCREEN
  // -------------------
  if (
    text === "clear" ||
    text === "clear screen" ||
    text.includes("remove verse")
  ) {
    return { type: "CLEAR" };
  }

  return null;
};