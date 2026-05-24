const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { transcribeAudio } = require("./services/whisper");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// -------------------------------------
// MAIN ROUTE
// -------------------------------------
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    console.log("FILE RECEIVED:", req.file);
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file received"
      });
    }

    const filePath = req.file.path;

    const result = await transcribeAudio(filePath);

    res.json({
      success: true,
      text: result
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Transcription failed"
    });
  }
});

app.listen(4000, () => {
  console.log("Backend running on port 4000");
});