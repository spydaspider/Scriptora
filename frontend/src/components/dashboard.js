import styles from './dashboard.module.css';
import { useState } from 'react';
import buildBible from '../components/helpers/buildBible';
import rawBible from '../components/data/bible.json';
import bookAliases from '../components/helpers/bookaliases.js';
import stringSimilarity from "string-similarity";

// -------------------------------------
// BUILD BIBLE
// -------------------------------------
const bible = buildBible(rawBible);

// -------------------------------------
// SPEECH RECOGNITION
// -------------------------------------
const startSpeechRecognition = (onResult) => {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  let active = true;

  recognition.onstart = () => {
    console.log("VOICE RECOGNITION STARTED");
  };

  recognition.onresult = (event) => {
    const transcript =
      event.results[event.results.length - 1][0]
        .transcript;

    console.log("HEARD:", transcript);

    onResult(transcript.toLowerCase());
  };

  recognition.onerror = (err) => {
    console.error("VOICE ERROR:", err);
  };

  recognition.onend = () => {
    console.log("VOICE RESTARTING");

    if (active) {
      setTimeout(() => {
        recognition.start();
      }, 1000);
    }
  };

  recognition.start();

  return () => {
    active = false;
    recognition.stop();
  };
};

// -------------------------------------
// NUMBER WORDS
// -------------------------------------
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
    const current = numberWords[words[i]];
    const next = numberWords[words[i + 1]];

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

// -------------------------------------
// SMART BIBLE PARSER
// -------------------------------------
const parseBibleReferenceSmart = (input) => {
  let text = input.toLowerCase();

  // -------------------------------------
  // NORMALIZE TEXT
  // -------------------------------------
  text = text
    .replace(/vs\.?/g, "verse")
    .replace(/\s*:\s*/g, ":")
    .replace(/[.,!?]/g, "");

  text = convertWordsToNumbers(text);

  // -------------------------------------
  // SPEECH CORRECTIONS
  // -------------------------------------
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
    "execost": "exodus",
    "revelations": "revelation"
  };

  for (const key in corrections) {
    text = text.replaceAll(
      key,
      corrections[key]
    );
  }

  // -------------------------------------
  // NORMALIZE ORDINALS
  // -------------------------------------
  text = text
    .replaceAll("first", "1")
    .replaceAll("second", "2")
    .replaceAll("third", "3");

  // -------------------------------------
  // DETECT BOOK
  // -------------------------------------
  let detectedBook = null;

  const books =
    Object.keys(bookAliases)
      .sort((a, b) => b.length - a.length);

  // direct contains match
  for (const book of books) {
    if (text.includes(book)) {
      detectedBook = book;
      break;
    }
  }

  // fuzzy fallback
  if (!detectedBook) {
    const words = text.split(" ");

    let bestScore = 0;

    for (const book of books) {
      for (let i = 0; i < words.length; i++) {

        const chunk1 = words[i];

        const chunk2 =
          i < words.length - 1
            ? `${words[i]} ${words[i + 1]}`
            : chunk1;

        const score1 =
          stringSimilarity.compareTwoStrings(
            chunk1,
            book
          );

        const score2 =
          stringSimilarity.compareTwoStrings(
            chunk2,
            book
          );

        if (
          score1 > bestScore &&
          score1 > 0.75
        ) {
          bestScore = score1;
          detectedBook = book;
        }

        if (
          score2 > bestScore &&
          score2 > 0.75
        ) {
          bestScore = score2;
          detectedBook = book;
        }
      }
    }
  }

  if (!detectedBook) {
    console.log("NO BOOK FOUND");
    return null;
  }

  console.log("BOOK FOUND:", detectedBook);

  // -------------------------------------
  // REMOVE BOOK
  // -------------------------------------
  const remaining = text
    .replace(detectedBook, "")
    .trim();

  // -------------------------------------
  // FIND CHAPTER + VERSE
  // -------------------------------------
  let chapter = null;
  let verse = null;

  // "chapter 4 verse 2"
  let match = remaining.match(
    /chapter\s*(\d+)\s*verse\s*(\d+)/
  );

  if (match) {
    chapter = match[1];
    verse = match[2];
  }

  // "chapter 4:2"
  if (!chapter || !verse) {
    match = remaining.match(
      /chapter\s*(\d+):(\d+)/
    );

    if (match) {
      chapter = match[1];
      verse = match[2];
    }
  }

  // "4:2"
  if (!chapter || !verse) {
    match = remaining.match(
      /(\d+):(\d+)/
    );

    if (match) {
      chapter = match[1];
      verse = match[2];
    }
  }

  // fallback raw numbers
  if (!chapter || !verse) {
    const nums = remaining.match(/\d+/g);

    if (nums && nums.length >= 2) {
      chapter = nums[0];
      verse = nums[1];
    }
  }

  if (!chapter || !verse) {
    console.log("NO CHAPTER/VERSE FOUND");
    return null;
  }

  console.log(
    "PARSED:",
    detectedBook,
    chapter,
    verse
  );

  return {
    book: bookAliases[detectedBook],
    chapter,
    verse
  };
};

// -------------------------------------
// COMPONENT
// -------------------------------------
const Dashboard = () => {

  const [query, setQuery] =
    useState("");

  const [verse, setVerse] =
    useState("");

  const [isProjecting, setIsProjecting] =
    useState(false);

  const [isListening, setIsListening] =
    useState(false);

  // -------------------------------------
  // GET VERSE
  // -------------------------------------
  const getVerse = (input) => {
    try {

      let text =
        input.toLowerCase().trim();

      text = text.replace(
        /(\d+)\s+(\d+)$/,
        "$1:$2"
      );

      const match = text.match(
        /(.+)\s(\d+):(\d+)/
      );

      if (!match) {
        return "Invalid format. Example: John 3:16";
      }

      let bookInput =
        match[1].trim();

      const chapter =
        match[2];

      const verseNum =
        match[3];

      const book =
        bookAliases[bookInput] ||
        bookAliases[
          bookInput.replace(/\./g, "")
        ];

      if (!book) {
        return "Unknown book.";
      }

      const result =
        bible[book]?.[chapter]?.[verseNum];

      if (result) {
        return `${book} ${chapter}:${verseNum} - ${result}`;
      }

      return "Verse not found.";

    } catch {
      return "Error reading verse.";
    }
  };

  // -------------------------------------
  // FETCH VERSE
  // -------------------------------------
  const fetchVerse = (inputValue) => {
    const result = getVerse(
      inputValue || query
    );

    setVerse(result);
  };

  // -------------------------------------
  // START LISTENING
  // -------------------------------------
  const startListening = () => {

    if (isListening) return;

    setIsListening(true);

    startSpeechRecognition((text) => {

      if (!text || text.trim() === "") {
        return;
      }

      console.log(
        "RAW SPEECH:",
        text
      );

      // IMPORTANT:
      // parse ONLY latest sentence
      const parsed =
        parseBibleReferenceSmart(text);

      if (parsed) {

        const verseRef =
          `${parsed.book} ${parsed.chapter}:${parsed.verse}`;

        console.log(
          "VERSE DETECTED:",
          verseRef
        );

        setQuery(verseRef);

        fetchVerse(verseRef);

      } else {

        console.log(
          "NO VALID VERSE FOUND"
        );
      }
    });
  };

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <div
      className={
        isProjecting
          ? styles.projector
          : styles.container
      }
    >
      {!isProjecting && (
        <>
          <h1>Bible Projector</h1>

          <div className={styles.controls}>

            <input
              type="text"
              placeholder="Enter verse e.g. John 3:16"
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchVerse();
                }
              }}
            />

            <button
              onClick={() => fetchVerse()}
            >
              Show
            </button>

            <button
              onClick={startListening}
              disabled={isListening}
            >
              {isListening
                ? "Voice Active"
                : "Start Voice Control"}
            </button>

            <button
              onClick={() =>
                setIsProjecting(true)
              }
            >
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
          onClick={() =>
            setIsProjecting(false)
          }
        >
          Exit
        </button>
      )}
    </div>
  );
};

export default Dashboard;