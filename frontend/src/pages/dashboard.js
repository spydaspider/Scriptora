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
  // CONTEXT MEMORY (SOURCE OF TRUTH)
  // -----------------------------------
  const currentReference = useRef({
    book: null,
    chapter: null,
    verse: null
  });

  // -----------------------------------
  // FETCH VERSE
  // -----------------------------------
  const fetchVerse = (ref) => {
    const result = getVerse(ref || query);
    setVerse(result);
  };

  // -----------------------------------
  // APPLY REFERENCE (CENTRAL ENGINE)
  // -----------------------------------
  const goToReference = (book, chapter, verse) => {
    const ref = `${book} ${chapter}:${verse}`;

    currentReference.current = {
      book,
      chapter,
      verse
    };

    setQuery(ref);
    fetchVerse(ref);
  };

  // -----------------------------------
  // COMMAND ENGINE (SHARED LOGIC)
  // -----------------------------------
  const runCommand = (type) => {
    const current = currentReference.current;

    if (!current.book || !current.chapter) return;

    switch (type) {
      case "NEXT_VERSE": {
        const next = Number(current.verse || 1) + 1;
        goToReference(current.book, current.chapter, next);
        break;
      }

      case "PREVIOUS_VERSE": {
        const prev = Math.max(1, Number(current.verse || 1) - 1);
        goToReference(current.book, current.chapter, prev);
        break;
      }

      case "NEXT_CHAPTER": {
        goToReference(
          current.book,
          Number(current.chapter) + 1,
          1
        );
        break;
      }

      case "PREVIOUS_CHAPTER": {
        goToReference(
          current.book,
          Math.max(1, Number(current.chapter) - 1),
          1
        );
        break;
      }

      default:
        break;
    }
  };

  // -----------------------------------
  // SPEECH HANDLER
  // -----------------------------------
  const handleSpeech = (text) => {
    if (!text || text.trim() === "") return;

    console.log("RAW SPEECH:", text);

    const parsed = parseBibleReferenceSmart(text);

    console.log("PARSED:", parsed);

    if (!parsed) return;

    // -------------------------
    // HANDLE COMMANDS
    // -------------------------
    if (parsed.command) {
      runCommand(parsed.command);
      return;
    }

    // -------------------------
    // MERGE CONTEXT
    // -------------------------
    const book = parsed.book || currentReference.current.book;
    const chapter = parsed.chapter || currentReference.current.chapter;
    const verseNum = parsed.verse;

    if (book && chapter && verseNum) {
      goToReference(book, chapter, verseNum);
      return;
    }

    if (parsed.book && parsed.chapter && !parsed.verse) {
      goToReference(parsed.book, parsed.chapter, 1);
      return;
    }

    if (!parsed.book && parsed.chapter && currentReference.current.book) {
      goToReference(currentReference.current.book, parsed.chapter, 1);
      return;
    }

    if (!parsed.book && parsed.verse && currentReference.current.book) {
      goToReference(
        currentReference.current.book,
        currentReference.current.chapter,
        parsed.verse
      );
      return;
    }
  };

  // -----------------------------------
  // SPEECH START
  // -----------------------------------
  const startListening = () => {
    if (isListening) return;
    setIsListening(true);

    startSpeechRecognition((text) => {
      handleSpeech(text);
    });
  };

  return (
    <div className={isProjecting ? styles.projector : styles.container}>
      {!isProjecting && (
        <>
          <h1>Bible Projector</h1>

          <div className={styles.controls}>
            {/* MANUAL INPUT */}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter verse e.g. John 3:16"
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchVerse();
              }}
            />

            <button onClick={() => fetchVerse()}>
              Show
            </button>

            {/* SPEECH */}
            <button onClick={startListening} disabled={isListening}>
              {isListening ? "Voice Active" : "Start Voice Control"}
            </button>

            {/* MANUAL CONTROLS (NEW FIX) */}
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button onClick={() => runCommand("PREVIOUS_VERSE")}>
                ⬅ Prev Verse
              </button>

              <button onClick={() => runCommand("NEXT_VERSE")}>
                Next Verse ➡
              </button>

              <button onClick={() => runCommand("PREVIOUS_CHAPTER")}>
                Prev Chapter
              </button>

              <button onClick={() => runCommand("NEXT_CHAPTER")}>
                Next Chapter
              </button>
            </div>

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