import styles from "./dashboard.module.css";
import { useState, useRef } from "react";

import { startSpeechRecognition } from "../services/speechRecognition";
import { parseBibleReferenceSmart } from "../services/bibleParser";
import { getVerse, setBibleVersion } from "../services/bibleService";
import { speechEngine } from "../services/speechEngine";


const Dashboard = () => {
  const [query, setQuery] = useState("");
  const [verse, setVerse] = useState("");
  const [isProjecting, setIsProjecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const lastAction = useRef(0);

  // -----------------------------------
  // VERSION STATE (NEW)
  // -----------------------------------
  const [version, setVersion] = useState("WEB");

  // -----------------------------------
  // CONTEXT MEMORY
  // -----------------------------------
  const currentReference = useRef({
    book: null,
    chapter: null,
    verse: null
  });

  // -----------------------------------
  // FETCH VERSE (UPDATED ONLY HERE)
  // -----------------------------------
  const fetchVerse = (ref) => {
    const result = getVerse(ref || query, version);
    setVerse(result);
  };

  // -----------------------------------
  // APPLY REFERENCE
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
  // COMMAND ENGINE (UNCHANGED)
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
  // SPEECH HANDLER (UNCHANGED)
  // -----------------------------------
 /*  const handleSpeech = (text) => {
    if (!text || text.trim() === "") return;

    console.log("RAW SPEECH:", text);

    const parsed = parseBibleReferenceSmart(text);

    console.log("PARSED:", parsed);

    if (!parsed) return;

    if (parsed.command) {
      runCommand(parsed.command);
      return;
    }

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
 */

  // -----------------------------------
  // SPEECH START
  // -----------------------------------
  const startListening = () => {
    if (isListening) return;
    setIsListening(true);

    startSpeechRecognition((text)=>{


speechEngine(
text,
{
goToReference,

runCommand,

lastAction

}
);


});
  };

  // -----------------------------------
  // VERSION CHANGE HANDLER (NEW)
  // -----------------------------------
  const handleVersionChange = (e) => {
  const newVersion = e.target.value;

  setVersion(newVersion);
  setBibleVersion(newVersion);

  // Reload the currently displayed verse
  const current = currentReference.current;

  if (current.book && current.chapter && current.verse) {
    const ref = `${current.book} ${current.chapter}:${current.verse}`;

    const result = getVerse(ref, newVersion);

    setQuery(ref);
    setVerse(result);
  }
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
        {/* HEADER */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              📖 Bible Projector
            </h1>
            <p className={styles.subtitle}>
              Voice Controlled Scripture Projection
            </p>
          </div>

          <div className={styles.versionBox}>
            <label>Bible Version</label>

            <select
              value={version}
              onChange={handleVersionChange}
            >
              <option value="WEB">
                World English Bible
              </option>

              <option value="KJV">
                King James Version
              </option>

              <option value="ASV">
                American Standard Version
              </option>
            </select>
          </div>
        </header>

        {/* SEARCH */}
        <section className={styles.searchCard}>
          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search... Example: John 3:16 or Genesis chapter 5 verse 2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchVerse();
              }
            }}
          />

          <button
            className={styles.primaryBtn}
            onClick={() => fetchVerse()}
          >
            🔍 Show Verse
          </button>
        </section>

        {/* DASHBOARD */}
        <section className={styles.dashboardGrid}>
          {/* Voice */}
          <div className={styles.card}>
            <h2>🎤 Voice Control</h2>

            <p>
              Status:
              <span
                className={
                  isListening
                    ? styles.active
                    : styles.inactive
                }
              >
                {isListening
                  ? " Listening"
                  : " Idle"}
              </span>
            </p>

            <button
              onClick={startListening}
              disabled={isListening}
              className={styles.voiceBtn}
            >
              {isListening
                ? "Voice Active"
                : "Start Voice Control"}
            </button>

            <small>
              Try saying:
              <br />
              John 3:16
              <br />
              Next verse
              <br />
              Previous chapter
            </small>
          </div>

          {/* Navigation */}
          <div className={styles.card}>
            <h2>📖 Navigation</h2>

            <div className={styles.navGrid}>
              <button
                onClick={() =>
                  runCommand("PREVIOUS_VERSE")
                }
              >
                ⬅ Prev Verse
              </button>

              <button
                onClick={() =>
                  runCommand("NEXT_VERSE")
                }
              >
                Next Verse ➡
              </button>

              <button
                onClick={() =>
                  runCommand("PREVIOUS_CHAPTER")
                }
              >
                ⬆ Prev Chapter
              </button>

              <button
                onClick={() =>
                  runCommand("NEXT_CHAPTER")
                }
              >
                Next Chapter ⬇
              </button>
            </div>
          </div>

          {/* Projection */}
          <div className={styles.card}>
            <h2>🎥 Projection</h2>

            <button
              className={styles.projectBtn}
              onClick={() =>
                setIsProjecting(true)
              }
            >
              Start Projection
            </button>

            <small>
              Displays verses in fullscreen
              mode.
            </small>
          </div>
        </section>
      </>
    )}

    {/* VERSE DISPLAY */}
    <main className={styles.displayCard}>
      <div className={styles.display}>
        {verse || "Verse will appear here"}
      </div>
    </main>

    {isProjecting && (
      <button
        className={styles.exitBtn}
        onClick={() =>
          setIsProjecting(false)
        }
      >
        Exit Projection
      </button>
    )}
  </div>
);
  
};

export default Dashboard;