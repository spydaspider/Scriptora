const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 🧠 Audio buffering
let audioBuffer = [];
let isProcessing = false;

app.get("/", (req, res) => {
  res.send("Scriptora Voice Backend Running");
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {

    // store audio chunks
    audioBuffer.push(message);

    // prevent multiple processing
    if (isProcessing) return;

    isProcessing = true;

    // simulate pause in speech
    setTimeout(async () => {

      const combined = Buffer.concat(audioBuffer);
      audioBuffer = [];

      console.log("Processing speech...");

      const text = await fakeWhisper(combined);

      isProcessing = false;

      if (!text || text.trim() === "") {
        console.log("No meaningful speech detected");
        return;
      }

      console.log("Transcribed:", text);

      const verse = detectVerse(text);

      if (verse) {
        console.log("Detected verse:", verse);

        ws.send(JSON.stringify({
          type: "verse",
          data: verse
        }));
      }

    }, 2000);
  });
});


// 🧠 FAKE WHISPER (controlled simulation)
async function fakeWhisper() {
  console.log("Fake whisper running...");

  await new Promise((res) => setTimeout(res, 500));

  async function fakeWhisper() {
  console.log("Fake whisper running...");
  await new Promise(res => setTimeout(res, 500));
  return "open john chapter 3 verse 16"; 
}

  const random = samples[Math.floor(Math.random() * samples.length)];

  return random;
}


// 📖 Verse detection
function detectVerse(text) {
  const match = text.match(
    /(genesis|john|romans|psalm|psalms)\s*(chapter\s*)?(\d+)\s*(verse\s*)?(\d+)/
  );

  if (!match) return null;

  const book = match[1];
  const chapter = match[3];
  const verse = match[5];

  return `${book} ${chapter}:${verse}`;
}


server.listen(3001, () => {
  console.log("Server running on port 3001");
});