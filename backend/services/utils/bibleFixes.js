const bibleFixes = (text) => {
  return text
    .toLowerCase()
    .replace(/charter|chaptor|charthar/g, "chapter")
    .replace(/\bv\s?(\d+)/g, "verse $1")
    .replace(/\bfirst\b/g, "1")
    .replace(/\bsecond\b/g, "2")
    .replace(/\bthird\b/g, "3")
    .replace(/\s+/g, " ")
    .trim();
};

module.exports = bibleFixes;