export const processCommand = (
  speech
) => {

  const text =
    speech.toLowerCase();

  if (
    text.includes("next verse")
  ) {
    return {
      type: "NEXT_VERSE"
    };
  }

  if (
    text.includes("previous verse")
  ) {
    return {
      type: "PREVIOUS_VERSE"
    };
  }

  if (
    text.includes("clear screen")
  ) {
    return {
      type: "CLEAR"
    };
  }

  return null;
};