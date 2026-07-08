const bibleWords = [
  "genesis",
  "exodus",
  "leviticus",
  "numbers",
  "deuteronomy",
  "joshua",
  "judges",
  "ruth",
  "samuel",
  "kings",
  "chronicles",
  "psalms",
  "proverbs",
  "isaiah",
  "jeremiah",
  "matthew",
  "mark",
  "luke",
  "john",
  "acts",
  "romans",
  "corinthians",
  "galatians",
  "ephesians",
  "philippians",
  "revelation"
];


export const looksLikeBibleSpeech = (text)=>{

  text=text.toLowerCase();


  if(/\d+:\d+/.test(text)){
    return true;
  }


  if(
    text.includes("chapter") ||
    text.includes("verse")
  ){
    return true;
  }


  return bibleWords.some(book =>
    text.includes(book)
  );

};