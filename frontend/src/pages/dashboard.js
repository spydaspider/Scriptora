import styles from "./dashboard.module.css";
import { useState, useRef } from "react";

import { startSpeechRecognition } from "../services/speechRecognition";
import { parseBibleReferenceSmart } from "../services/bibleParser";
import { getVerse } from "../services/bibleService";

const Dashboard = () => {

  const [query, setQuery] = useState("");
  const [verse, setVerse] = useState("");
  const [isProjecting, setIsProjecting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // -----------------------------------
  // CONTEXT MEMORY (PERSISTENT)
  // -----------------------------------
  const currentReference = useRef({
    book: null,
    chapter: null,
    verse: null
  });

  // -----------------------------------
  // FETCH VERSE
  // -----------------------------------
  const fetchVerse = (reference) => {

    const result =
      getVerse(reference || query);

    setVerse(result);
  };

  // -----------------------------------
  // HANDLE SPEECH
  // -----------------------------------
  const handleSpeech = (text) => {

    if (!text || text.trim() === "") {
      return;
    }

    console.log("RAW SPEECH:", text);

    const parsed =
      parseBibleReferenceSmart(text);

    console.log("PARSED:", parsed);

    if (!parsed) return;

    // -----------------------------------
    // COMMANDS
    // -----------------------------------
    if (parsed.command) {

      const current =
        currentReference.current;

      if (
        parsed.command === "nextVerse" &&
        current.book &&
        current.chapter &&
        current.verse
      ) {

        const nextVerse =
          Number(current.verse) + 1;

        const ref =
          `${current.book} ${current.chapter}:${nextVerse}`;

        currentReference.current = {
          ...current,
          verse: nextVerse
        };

        setQuery(ref);
        fetchVerse(ref);

        return;
      }

      if (
        parsed.command === "previousVerse" &&
        current.book &&
        current.chapter &&
        current.verse > 1
      ) {

        const prevVerse =
          Number(current.verse) - 1;

        const ref =
          `${current.book} ${current.chapter}:${prevVerse}`;

        currentReference.current = {
          ...current,
          verse: prevVerse
        };

        setQuery(ref);
        fetchVerse(ref);

        return;
      }
    }

    // -----------------------------------
    // MERGE WITH CONTEXT
    // -----------------------------------
    const book =
      parsed.book ||
      currentReference.current.book;

    const chapter =
      parsed.book
        ? parsed.chapter
        : (
            parsed.chapter &&
            !parsed.verse
          )
        ? parsed.chapter
        : currentReference.current.chapter;

    const verseNumber =
      parsed.verse;

    console.log("MERGED:", {
      book,
      chapter,
      verse: verseNumber
    });

    // -----------------------------------
    // FULL REFERENCE
    // Genesis 4:5
    // -----------------------------------
    if (
      book &&
      chapter &&
      verseNumber
    ) {

      const ref =
        `${book} ${chapter}:${verseNumber}`;

      currentReference.current = {
        book,
        chapter,
        verse: verseNumber
      };

      setQuery(ref);

      fetchVerse(ref);

      return;
    }

    // -----------------------------------
    // BOOK + CHAPTER
    // Genesis chapter 4
    // -----------------------------------
    if (
      parsed.book &&
      parsed.chapter &&
      !parsed.verse
    ) {

      const ref =
        `${parsed.book} ${parsed.chapter}:1`;

      currentReference.current = {
        book: parsed.book,
        chapter: parsed.chapter,
        verse: 1
      };

      setQuery(ref);

      fetchVerse(ref);

      return;
    }

    // -----------------------------------
    // CHAPTER ONLY
    // chapter 6
    // -----------------------------------
    if (
      !parsed.book &&
      parsed.chapter &&
      !parsed.verse &&
      currentReference.current.book
    ) {

      const ref =
        `${currentReference.current.book} ${parsed.chapter}:1`;

      currentReference.current = {
        book:
          currentReference.current.book,
        chapter: parsed.chapter,
        verse: 1
      };

      setQuery(ref);

      fetchVerse(ref);

      return;
    }

    // -----------------------------------
    // VERSE ONLY
    // verse 5
    // -----------------------------------
    if (
      !parsed.book &&
      parsed.verse &&
      currentReference.current.book &&
      currentReference.current.chapter
    ) {

      const ref =
        `${currentReference.current.book} ${currentReference.current.chapter}:${parsed.verse}`;

      currentReference.current = {
        ...currentReference.current,
        verse: parsed.verse
      };

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
              onClick={() =>
                fetchVerse()
              }
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