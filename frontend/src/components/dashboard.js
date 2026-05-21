import styles from './dashboard.module.css';
import { useState, useEffect } from 'react';
import bible from '../components/data/bible.json';
import bookAliases from '../components/helpers/bookaliases.js';
import buildBible from '../components/helpers/buildBible';
import rawBible from '../components/data/bible.json';
import stringSimilarity from "string-similarity";



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

const convertWordsToNumbers = (text) => {

  const words = text.split(" ");

  let result = [];

  for (let i = 0; i < words.length; i++) {

    const current =
      numberWords[words[i]];

    const next =
      numberWords[words[i + 1]];

    if (
      current >= 20 &&
      next &&
      next < 10
    ) {

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
const parseBibleReferenceSmart = (input) => {
  let text = input.toLowerCase();

  // normalize speech noise
  text = text
    .replace(/vs\.?/g, "verse")
    .replace(/chapter/g, "chapter");

  text = convertWordsToNumbers(text);
  text = text.replace(/[.,!?]/g, "");

  const corrections = {
    "some more": "samuel",
    "first some more": "1 samuel",
    "second some more": "2 samuel",
    "detrimony": "deuteronomy",
    "theronomy": "deuteronomy",
    "romance": "romans",
    "sams": "psalms",
    "salms": "psalms",
    "xodus": "exodus",
    "revelations": "revelation"
  };

  for (const key in corrections) {
    text = text.replaceAll(key, corrections[key]);
  }

  text = text
    .replaceAll("first", "1")
    .replaceAll("second", "2")
    .replaceAll("third", "3");

  const numberedBooks = [
    "1 samuel","2 samuel","1 kings","2 kings",
    "1 chronicles","2 chronicles","1 corinthians",
    "2 corinthians","1 thessalonians","2 thessalonians",
    "1 timothy","2 timothy","1 peter","2 peter",
    "1 john","2 john","3 john"
  ];

  // -----------------------------
  // STEP 1: LOCK BOOK FIRST
  // -----------------------------
  let detectedBook = null;

  for (const book of numberedBooks) {
    if (text.includes(book)) {
      detectedBook = book;
      break;
    }
  }

  // fallback fuzzy match ONLY if needed
  if (!detectedBook) {
    const books = Object.keys(bookAliases);
    let bestScore = 0;

    for (const book of books) {
      const score = stringSimilarity.compareTwoStrings(text, book);

      if (score > bestScore && score > 0.45) {
        bestScore = score;
        detectedBook = book;
      }
    }
  }

  if (!detectedBook) return null;

  // -----------------------------
  // STEP 2: REMOVE BOOK FROM TEXT
  // -----------------------------
  let remaining = text.replace(detectedBook, "").trim();

  // -----------------------------
  // STEP 3: PRIORITISED PARSING
  // -----------------------------
  let chapter = null;
  let verse = null;

  // HIGH PRIORITY: "chapter X verse Y"
  const pattern = remaining.match(/chapter\s*(\d+)\s*verse\s*(\d+)/);
  if (pattern) {
    chapter = pattern[1];
    verse = pattern[2];
  }

  // MEDIUM: explicit words
  if (!chapter || !verse) {
    const chapterMatch = remaining.match(/chapter\s*(\d+)/);
    const verseMatch = remaining.match(/verse\s*(\d+)/);

    if (chapterMatch) chapter = chapterMatch[1];
    if (verseMatch) verse = verseMatch[1];
  }

  // LOW: fallback numbers
  if (!chapter || !verse) {
    const nums = remaining.match(/\d+/g);

    if (nums && nums.length >= 2) {
      chapter = nums[0];
      verse = nums[1];
    }
  }

  if (!chapter || !verse) return null;

  return {
    book: bookAliases[detectedBook],
    chapter,
    verse
  };
};
const Dashboard = () => {
  const [query, setQuery] = useState("");
  const [verse, setVerse] = useState("");
  const [isProjecting, setIsProjecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bible = buildBible(rawBible);
  const [liveTranscript, setLiveTranscript] =
  useState("");
 const startListening = () => {

  if (isListening) return;

  setIsListening(true);

  startSpeechRecognition((text) => {

    if (!text || text.trim() === "") {
      return;
    }

    setLiveTranscript(prev => {

      // rolling transcript memory
      const updated =
        `${prev} ${text}`.trim();

      console.log(
        "LIVE TRANSCRIPT:",
        updated
      );

      const parsed =
        parseBibleReferenceSmart(updated);

      if (parsed) {

        const verseRef =
          `${parsed.book} ${parsed.chapter}:${parsed.verse}`;

        console.log(
          "VERSE DETECTED:",
          verseRef
        );

        setQuery(verseRef);

        fetchVerse(verseRef);

        // clear memory after success
        return "";
      }

      // keep recent transcript only
      return updated.slice(-250);
    });
  });
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