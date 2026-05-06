import styles from './dashboard.module.css';
import { useState, useEffect } from 'react';
import bible from '../components/data/bible.json';
import bookAliases from '../components/helpers/bookaliases.js';

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

  recognition.onresult = (event) => {
    const transcript =
      event.results[event.results.length - 1][0].transcript;

    console.log("Heard:", transcript);
    onResult(transcript.toLowerCase());
  };

  recognition.onerror = (err) => {
    console.error("Speech error:", err);
  };

  recognition.start();
};

const Dashboard = () => {
  const [query, setQuery] = useState("");
  const [verse, setVerse] = useState("");
  const [isProjecting, setIsProjecting] = useState(false);

  // 🎤 Start listening ONCE
  useEffect(() => {
    startSpeechRecognition((text) => {
      console.log("Detected:", text);

      const verseRef = detectVerse(text);

      if (verseRef) {
        console.log("Verse detected:", verseRef);
        setQuery(verseRef);
        fetchVerse(verseRef);
      }
    });
  }, []);

  // Detect verse from speech
  const detectVerse = (text) => {
  text = text.toLowerCase();

  // Normalize "3:16" and "3 16"
  text = text.replace(/(\d+)\s*:\s*(\d+)/, "$1 $2");

  // Try to find book + numbers anywhere in sentence
  const match = text.match(
    /(genesis|john|romans|psalm|psalms)[^\d]*(\d+)[^\d]*(\d+)/
  );

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