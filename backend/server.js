const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { transcribeAudio } = require("./services/whisper");

const app = express();
app.use(cors());

const server = http.createServer(app);

// IMPORTANT: Socket.IO FIX
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get("/", (req, res) => {
  res.json({ status: "Voice server running" });
});

// -------------------------------------
// SOCKET CONNECTION
// -------------------------------------
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // RECEIVE AUDIO CHUNKS
  socket.on("audio-chunk", async (data) => {
    try {
      // data = { filePath }
      console.log("Chunk received:", data.filePath);

      const text = await transcribeAudio(data.filePath);

      socket.emit("transcript", {
        text
      });

    } catch (err) {
      console.error("Chunk error:", err);
      socket.emit("transcript", {
        text: ""
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(4000, () => {
  console.log("Server running on port 4000");
});