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

  // -----------------------------------
  // CONTEXT MEMORY (CRITICAL)
  // -----------------------------------
  const [currentReference, setCurrentReference] = useState({
    book: null,
    chapter: null,
    verse: null
  });

  // -----------------------------------
  // FETCH VERSE
  // -----------------------------------
  const fetchVerse = (input) => {
    const result = getVerse(input || query);
    setVerse(result);
  };

  // -----------------------------------
  // SPEECH HANDLER (FIXED LOGIC)
  // -----------------------------------
  const handleSpeech = (text) => {

    if (!text || text.trim() === "") return;

    console.log("RAW SPEECH:", text);

    const parsed = parseBibleReferenceSmart(text);

    console.log("PARSED:", parsed);

    if (!parsed) return;

    // -----------------------------------
    // IMPORTANT FIX: SAFE CONTEXT MERGE
    // -----------------------------------
    const book = parsed.book ?? currentReference.book;

    // ONLY trust chapter if book exists in parsed
    const chapter =
      parsed.book
        ? parsed.chapter
        : currentReference.chapter;

    const verse = parsed.verse;

    // -----------------------------------
    // FULL REFERENCE (Book Chapter Verse)
    // -----------------------------------
    if (book && chapter && verse) {

      const ref = `${book} ${chapter}:${verse}`;

      setCurrentReference({
        book,
        chapter,
        verse
      });

      setQuery(ref);
      fetchVerse(ref);
      return;
    }

    // -----------------------------------
    // BOOK + CHAPTER (Genesis chapter 4)
    // -----------------------------------
    if (book && chapter && !verse) {

      const ref = `${book} ${chapter}:1`;

      setCurrentReference({
        book,
        chapter,
        verse: 1
      });

      setQuery(ref);
      fetchVerse(ref);
      return;
    }

    // -----------------------------------
    // VERSE ONLY (CRITICAL FIX)
    // Verse 5 → uses context properly
    // -----------------------------------
    if (
      verse &&
      currentReference.book &&
      currentReference.chapter
    ) {

      const ref =
        `${currentReference.book} ${currentReference.chapter}:${verse}`;

      setCurrentReference(prev => ({
        ...prev,
        verse
      }));

      setQuery(ref);
      fetchVerse(ref);
      return;
    }

    // -----------------------------------
    // CHAPTER CHANGE (ONLY WITH BOOK)
    // -----------------------------------
    if (parsed.chapter && parsed.book && !parsed.verse) {

      const ref = `${parsed.book} ${parsed.chapter}:1`;

      setCurrentReference({
        book: parsed.book,
        chapter: parsed.chapter,
        verse: 1
      });

      setQuery(ref);
      fetchVerse(ref);
      return;
    }
  };

  // -----------------------------------
  // START LISTENING
  // -----------------------------------
  const startListening = () => {

    if (isListening) return;

    setIsListening(true);

    startSpeechRecognition((text) => {
      handleSpeech(text);
    });
  };

  return (
    <div className={
      isProjecting ? styles.projector : styles.container
    }>

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

            <button onClick={() => fetchVerse()}>
              Show
            </button>

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