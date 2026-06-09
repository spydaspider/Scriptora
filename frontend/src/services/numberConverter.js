const numberWords = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50
};

export const convertWordsToNumbers = (text) => {
  const words = text.split(" ");

  let result = [];

  for (let i = 0; i < words.length; i++) {
    const current = numberWords[words[i]];
    const next = numberWords[words[i + 1]];

    if (current >= 20 && next && next < 10) {
      result.push(current + next);
      i++;
    } else if (current) {
      result.push(current);
    } else {
      result.push(words[i]);
    }
  }

  return result.join(" ");
};