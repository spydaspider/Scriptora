const bibleFixes = require("../services/utils/bibleFixes");

const parseBibleReference = (text) => {

  const cleaned = bibleFixes(text);

  // DIRECT MATCH: John 3:16
  let match = cleaned.match(/^([a-z\s]+)\s+(\d+)\s*:\s*(\d+)$/);
  if (match) {
    return {
      book: match[1].trim(),
      chapter: match[2],
      verse: match[3],
      confidence: 1
    };
  }

  // SIMPLE FORMAT: John 3 16
  match = cleaned.match(/^([a-z\s]+)\s+(\d+)\s+(\d+)$/);
  if (match) {
    return {
      book: match[1].trim(),
      chapter: match[2],
      verse: match[3],
      confidence: 0.95
    };
  }

  return null;
};

module.exports = { parseBibleReference };