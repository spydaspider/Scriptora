import styles from './dashboard.module.css';
import { useState} from 'react';
const Dashboard = () =>{
const [query, setQuery] = useState("");
  const [verse, setVerse] = useState("");

  const fetchVerse = async () => {
    if (!query) return;

    try {
      const res = await fetch(
        `https://bible-api.com/${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (data.text) {
        setVerse(`${data.reference} - ${data.text}`);
      } else {
        setVerse("Verse not found.");
      }
    } catch (err) {
      setVerse("Error fetching verse.");
    }
  };

  return (
    <div className={styles.container}>
      <h1>Bible Projector</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Enter verse e.g. John 3:16"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={fetchVerse}>Show</button>
      </div>

      <div className={styles.display}>
        {verse || "Verse will appear here"}
      </div>
    </div>
  );
}
export default Dashboard;