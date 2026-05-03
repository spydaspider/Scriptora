import styles from './dashboard.module.css';
import { useState } from 'react';
import bible from '../components/data/bible.json';
import bookAliases from '../components/helpers/bookaliases.js';

const Dashboard = () => {
  const [query, setQuery] = useState("");
  const [verse, setVerse] = useState("");
  const [isProjecting, setIsProjecting] = useState(false);

  const getVerse = (input) => {
  try {
    let text = input.toLowerCase().trim();

    // Convert "john 3 16" → "john 3:16"
    text = text.replace(/(\d+)\s+(\d+)$/, "$1:$2");

    const match = text.match(/(.+)\s(\d+):(\d+)/);

    if (!match) return "Invalid format. Try 'John 3:16'";

    let bookInput = match[1].trim();
    const chapter = match[2];
    const verse = match[3];

    // Resolve alias
    const book =
      bookAliases[bookInput] ||
      bookAliases[bookInput.replace(/\./g, "")];

    if (!book) return "Unknown book name.";

    const result = bible[book]?.[chapter]?.[verse];

    if (result) {
      return `${book} ${chapter}:${verse} - ${result}`;
    } else {
      return "Verse not found.";
    }
  } catch {
    return "Error reading verse.";
  }
};

  const fetchVerse = () => {
    if (!query) return;
    const result = getVerse(query);
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
          <button onClick={fetchVerse}>Show</button>
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