import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

const Projection = () => {
  const [verse, setVerse] = useState("Waiting...");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("SOCKET CONNECTED");
    });

    socket.on("verse-update", (data) => {
      console.log("VERSE RECEIVED:", data);

      const display =
        typeof data === "string"
          ? data
          : data?.text || data?.reference;

      setVerse(display);
    });

    return () => socket.off("verse-update");
  }, []);

  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <h1 style={{ fontSize: 50 }}>{verse}</h1>
    </div>
  );
};

export default Projection;