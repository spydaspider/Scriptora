import styles from "./dashboard.module.css";
import { useState } from "react";

import { startSpeechRecognition } from "../services/speechRecognition";
import { parseBibleReferenceSmart } from "../services/bibleParser";
import { getVerse } from "../services/bibleService";

const Dashboard = () => {
  const [query, setQuery] = useState("");
  const [verse, setVerse] = useState("");
  const [isProjecting, setIsProjecting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // -----------------------
  // FETCH VERSE
  // -----------------------
  const fetchVerse = (inputValue) => {
    const result = getVerse(
      inputValue || query
    );

    setVerse(result);
  };
  
  // -----------------------
  // START LISTENING
  // -----------------------
  const startListening = () => {
    if (isListening) return;

    setIsListening(true);

    startSpeechRecognition((text) => {
      if (!text || text.trim() === "") {
        return;
      }

      console.log("RAW SPEECH:", text);

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