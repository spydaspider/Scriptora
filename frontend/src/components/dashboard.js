import styles from './dashboard.module.css';
import { useState, useEffect } from 'react';
import bible from '../components/data/bible.json';
import bookAliases from '../components/helpers/bookaliases.js';
import buildBible from '../components/helpers/buildBible';
import rawBible from '../components/data/bible.json';



//  Speech Recognition
const startSpeechRecognition = (onResult) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition not supported in this browser");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  let isListening = false;

  recognition.onstart = () => {
    console.log("Speech recognition started");
    isListening = true;
  };

  recognition.onresult = (event) => {
    const transcript =
      event.results[event.results.length - 1][0].transcript;

    console.log("Heard:", transcript);

    onResult(transcript.toLowerCase());
  };

  recognition.onerror = (err) => {
    console.error("Speech error:", err);

    if (err.error === "aborted") {
      return;
    }
  };

  recognition.onend = () => {
    console.log("Speech recognition ended");

    isListening = false;

    // restart safely
    setTimeout(() => {
      if (!isListening) {
        recognition.start();
      }
    }, 1000);
  };

  recognition.start();
};

const Dashboard = () => {
  const [query, setQuery] = useState("");
  const [verse, setVerse] = useState("");
  const [isProjecting, setIsProjecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bible = buildBible(rawBible);
  const startListening = () => {
  if (isListening) return;

  setIsListening(true);

  startSpeechRecognition((text) => {
    console.log("Detected:", text);

    const verseRef = detectVerse(text);

    if (verseRef) {
      console.log("Verse detected:", verseRef);

      setQuery(verseRef);
      fetchVerse(verseRef);
    }
  });
};
  

  // Detect verse from speech
  const detectVerse = (text) => {
  text = text.toLowerCase();

  // normalize formats
  text = text.replace(/(\d+)\s*:\s*(\d+)/, "$1 $2");

  // aliases for speech mistakes
  const aliases = {
    romance: "romans",
    sams: "psalms",
    salms: "psalms",
    mathew: "matthew",
    revelations: "revelation",
    songs: "song of solomon",
  };

  // replace mistaken words
  Object.keys(aliases).forEach((wrong) => {
    text = text.replace(wrong, aliases[wrong]);
  });

  // ALL books
  const books = [
    "genesis",
    "exodus",
    "leviticus",
    "numbers",
    "deuteronomy",
    "joshua",
    "judges",
    "ruth",
    "1 samuel",
    "2 samuel",
    "1 kings",
    "2 kings",
    "1 chronicles",
    "2 chronicles",
    "ezra",
    "nehemiah",
    "esther",
    "job",
    "psalm",
    "psalms",
    "proverbs",
    "ecclesiastes",
    "song of solomon",
    "isaiah",
    "jeremiah",
    "lamentations",
    "ezekiel",
    "daniel",
    "hosea",
    "joel",
    "amos",
    "obadiah",
    "jonah",
    "micah",
    "nahum",
    "habakkuk",
    "zephaniah",
    "haggai",
    "zechariah",
    "malachi",
    "matthew",
    "mark",
    "luke",
    "john",
    "acts",
    "romans",
    "1 corinthians",
    "2 corinthians",
    "galatians",
    "ephesians",
    "philippians",
    "colossians",
    "1 thessalonians",
    "2 thessalonians",
    "1 timothy",
    "2 timothy",
    "titus",
    "philemon",
    "hebrews",
    "james",
    "1 peter",
    "2 peter",
    "1 john",
    "2 john",
    "3 john",
    "jude",
    "revelation",
  ];

  const booksPattern = books.join("|");

  const regex = new RegExp(
    `(${booksPattern})[^\\d]*(\\d+)[^\\d]*(\\d+)`
  );

  const match = text.match(regex);

  if (!match) return null;

  const book = match[1];
  const chapter = match[2];
  const verse = match[3];

  return `${book} ${chapter}:${verse}`;
};
  
  const getVerse = (input) => {
    try {
      let text = input.toLowerCase().trim();

      text = text.replace(/(\d+)\s+(\d+)$/, "$1:$2");

      const match = text.match(/(.+)\s(\d+):(\d+)/);

      if (!match) return "Invalid format. Try 'John 3:16'";

      let bookInput = match[1].trim();
      const chapter = match[2];
      const verseNum = match[3];

      const book =
        bookAliases[bookInput] ||
        bookAliases[bookInput.replace(/\./g, "")];

      if (!book) return "Unknown book name.";

      const result = bible[book]?.[chapter]?.[verseNum];

      if (result) {
        return `${book} ${chapter}:${verseNum} - ${result}`;
      } else {
        return "Verse not found.";
      }
    } catch {
      return "Error reading verse.";
    }
  };

  
  const fetchVerse = (inputValue) => {
    const result = getVerse(inputValue || query);
    setVerse(result);
  };

  return (
    <div className={isProjecting ? styles.projector : styles.container}>

      {!isProjecting && (
        <>
          <h1>Bible Projector</h1>

          <div className={styles.controls}>
            <input
              type="text"
              placeholder="Enter verse e.g. John 3:16"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchVerse();
              }}
            />

            <button onClick={() => fetchVerse()}>Show</button>
           <button
  onClick={startListening}
  disabled={isListening}
>
  {isListening ? "Voice Active" : "Start Voice Control"}
</button>
            <button onClick={() => setIsProjecting(true)}>
              Start Projection
            </button>
            
          </div>
        </>
      )}

      <div className={styles.display}>
        {verse || "Verse will appear here"}
      </div>

      {isProjecting && (
        <button
          className={styles.exitBtn}
          onClick={() => setIsProjecting(false)}
        >
          Exit
        </button>
      )}
    </div>
  );
};

export default Dashboard;