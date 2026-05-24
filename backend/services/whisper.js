const { exec } = require("child_process");
const { parseBibleReference } = require("./bibleParser");
const bibleFixes = require("../services/utils/bibleFixes");

const WHISPER_PATH =
  "../whisper.cpp/build/bin/Release/whisper-cli.exe";

const MODEL_PATH =
  "../whisper.cpp/models/ggml-base.en.bin";

// -------------------------------------
// CLEAN OUTPUT PIPELINE
// -------------------------------------
const cleanOutput = (text) => {

  const raw = text
    .split("\n")
    .filter(line => line.trim())
    .pop()
    .trim();

  const fixed = bibleFixes(raw);

  const parsed = parseBibleReference(fixed);

  if (parsed) {
    return `${parsed.book} ${parsed.chapter}:${parsed.verse}`;
  }

  return fixed;
};

// -------------------------------------
// WHISPER EXECUTION
// -------------------------------------
const transcribeAudio = (filePath) => {
  return new Promise((resolve, reject) => {

    const cmd = `"${WHISPER_PATH}" -m "${MODEL_PATH}" -f "${filePath}" -nt`;

   exec(cmd, (err, stdout, stderr) => {

  if (err) {
    console.error("WHISPER ERROR:", err);
    console.error("STDERR:", stderr);
    return reject(err);
  }

  console.log("WHISPER STDOUT:", stdout);
  console.log("WHISPER STDERR:", stderr);

  const result = cleanOutput(stdout);
  resolve(result);
});
  });
};

module.exports = { transcribeAudio };