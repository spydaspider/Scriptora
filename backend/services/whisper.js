const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// ------------------------------------
// IMPORTANT PATHS (FIXED)
// ------------------------------------
const ROOT = path.resolve("C:/Users/dicks/Documents/Scriptora");

const WHISPER_PATH = path.join(
  ROOT,
  "whisper.cpp",
  "build",
  "bin",
  "Release",
  "whisper-cli.exe"
);

const MODEL_PATH = path.join(
  ROOT,
  "whisper.cpp",
  "models",
  "ggml-base.en.bin"
);

// ------------------------------------
// VALIDATE FILE
// ------------------------------------
function validateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found");
  }

  const size = fs.statSync(filePath).size;

  if (size < 1000) {
    throw new Error("Audio file too small");
  }
}

// ------------------------------------
// CONVERT WEBM → WAV
// ------------------------------------
function convertToWav(inputPath) {
  const outputPath = inputPath.replace(".webm", ".wav");

  return new Promise((resolve, reject) => {
    const cmd = `
      ffmpeg -y -hide_banner -loglevel error
      -i "${inputPath}"
      -ar 16000
      -ac 1
      -c:a pcm_s16le
      "${outputPath}"
    `;

    exec(cmd, (err) => {
      if (err) {
        return reject(new Error("FFmpeg failed"));
      }

      if (!fs.existsSync(outputPath)) {
        return reject(new Error("WAV not created"));
      }

      resolve(outputPath);
    });
  });
}

// ------------------------------------
// RUN WHISPER
// ------------------------------------
function runWhisper(filePath) {
  return new Promise((resolve, reject) => {
    const cmd = `"${WHISPER_PATH}" -m "${MODEL_PATH}" -f "${filePath}" -nt -l en`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || "Whisper failed"));
      }

      const text = clean(stdout + stderr);
      resolve(text);
    });
  });
}

// ------------------------------------
// CLEAN OUTPUT
// ------------------------------------
function clean(text) {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l =>
      l &&
      !l.includes("whisper_") &&
      !l.includes("time =") &&
      !l.includes("load")
    )
    .join(" ")
    .trim();
}

// ------------------------------------
// MAIN PIPELINE
// ------------------------------------
async function transcribeAudio(filePath) {
  validateFile(filePath);

  console.log("INPUT:", filePath);

  const wav = await convertToWav(filePath);
  console.log("WAV CREATED:", wav);

  const text = await runWhisper(wav);
  console.log("TRANSCRIPT:", text);

  return text || "No speech detected";
}

module.exports = { transcribeAudio };