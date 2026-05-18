import styles from './dashboard.module.css';
import { useState, useEffect } from 'react';
import bible from '../components/data/bible.json';
import bookAliases from '../components/helpers/bookaliases.js';
import buildBible from '../components/helpers/buildBible';
import rawBible from '../components/data/bible.json';
import MicRecorder from "mic-recorder-to-mp3";
import axios from "axios";


const recorder = new MicRecorder({
  bitRate: 128
});

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
 const startListening = async () => {

  if (isListening) return;

  setIsListening(true);

  const processAudio = async () => {

    try {

      await recorder.start();

      // record for 3 seconds
      await new Promise(resolve =>
        setTimeout(resolve, 3000)
      );

      const [buffer, blob] =
        await recorder.stop().getMp3();

      // ignore tiny/corrupted chunks
      if (blob.size < 1000) {

        console.log(
          "Skipping empty chunk"
        );

        processAudio();

        return;
      }

      const formData = new FormData();

      formData.append(
        "audio",
        blob,
        "audio.mp3"
      );

      const response = await axios.post(
        "http://localhost:5000/transcribe",
        formData
      );

      const text =
        response.data.text.toLowerCase();
        const possibleBooks = [
  "genesis",
  "exodus",
  "psalm",
  "psalms",
  "john",
  "matthew",
  "mark",
  "luke",
  "romans",
  "corinthians",
  "revelation",
  "acts",
  "isaiah",
  "proverbs"
];

const containsBibleWord =
  possibleBooks.some(book =>
    text.includes(book)
  );

if (!containsBibleWord) {

  console.log(
    "Ignoring noise:",
    text
  );

  processAudio();

  return;
}
        if (!text || text.trim().length < 5) {
  processAudio();
  return;
}

      console.log(
        "Transcript:",
        text
      );

      const verseRef =
        detectVerse(text);

      if (verseRef) {

        console.log(
          "Detected verse:",
          verseRef
        );

        setQuery(verseRef);

        fetchVerse(verseRef);
      }

      // start next cycle ONLY after completion
      processAudio();

    } catch (err) {

      console.error(
        "Transcription error:",
        err
      );

      // recover automatically
      processAudio();
    }
  };

  processAudio();
};

  // Detect verse from speech
  const detectVerse = (text) => {

  text = text.toLowerCase().trim();

  // remove punctuation
  text = text.replace(/[.,!?]/g, "");

  // normalize colon spacing
  text = text.replace(
    /(\d+)\s*:\s*(\d+)/g,
    "$1:$2"
  );

  // common speech mistakes
  const aliases = {
    romance: "romans",
    romanss: "romans",
    sams: "psalms",
    salms: "psalms",
    mathew: "matthew",
    matthews: "matthew",
    revelations: "revelation",
    songs: "song of solomon",
  };

  Object.keys(aliases).forEach((wrong) => {

    text = text.replace(
      new RegExp(wrong, "g"),
      aliases[wrong]
    );
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

  // detect book
  let detectedBook = null;

  for (const book of books) {

    if (text.includes(book)) {

      detectedBook = book;

      break;
    }
  }

  if (!detectedBook) {
    return null;
  }

  // remove book name from text
  let remaining = text.replace(
    detectedBook,
    ""
  ).trim();

  // extract numbers
  const numbers =
    remaining.match(/\d+/g);

  if (!numbers || numbers.length === 0) {
    return null;
  }

  let chapter = null;

  let verse = null;

  // CASE 1:
  // john 3 16
  if (numbers.length >= 2) {

    chapter = numbers[0];

    verse = numbers[1];
  }

  // CASE 2:
  // john 316
  else if (numbers.length === 1) {

    const combined = numbers[0];

    if (combined.length >= 3) {

      chapter = combined[0];

      verse = combined.slice(1);
    }
  }

  if (!chapter || !verse) {
    return null;
  }

  return `${detectedBook} ${chapter}:${verse}`;
};
  const getVerse = (input) => {

  try {

    let text = input.toLowerCase().trim();

    const match =
      text.match(/(.+)\s(\d+):(\d+)/);

    if (!match) {
      return "Invalid format. Try John 3:16";
    }

    let bookInput = match[1].trim();

    const chapter = match[2];

    const verse = match[3];

    const book =
      bookAliases[bookInput] ||
      bookAliases[
        bookInput.replace(/\./g, "")
      ];

    if (!book) {
      return "Unknown book name.";
    }

    const result =
      bible[book]?.[chapter]?.[verse];

    if (result) {

      return `${book} ${chapter}:${verse} - ${result}`;

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