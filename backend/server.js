const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.send("Scriptora Voice Backend Running");
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {
    // message = audio chunk from frontend

    console.log("Audio received...");

    
    const text = await fakeWhisper(message);

    console.log("Transcribed:", text);

    const verse = detectVerse(text);
     console.log(verse);
    ws.send(JSON.stringify({ type: "verse", data: verse }));
  });
});

function fakeWhisper(audio) {
  // placeholder (we will replace with real Whisper call)
  return Promise.resolve("open john chapter 3 verse 16");
}

function detectVerse(text) {
 const match = text.match(
    /(genesis|john|romans|psalm|psalms)\s*(chapter\s*)?(\d+)\s*(verse\s*)?(\d+)/
  );
if (!match) return null;

  const book = match[1];
  const chapter = match[3];
  const verse = match[5];

  const result = `${book} ${chapter}:${verse}`;

  console.log("Detected verse:", result);

  return result;
}

server.listen(3001, () => {
  console.log("Server running on port 3001");
});