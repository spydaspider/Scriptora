from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel
import os

app = Flask(__name__)
CORS(app)

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)

@app.route("/transcribe", methods=["POST"])
def transcribe_audio():

    if "audio" not in request.files:
        return jsonify({
            "error": "No audio file"
        }), 400

    audio = request.files["audio"]

    temp_path = "temp.mp3"

    audio.save(temp_path)

    segments, info = model.transcribe(
        temp_path
    )

    text = ""

    for segment in segments:
        text += segment.text + " "

    os.remove(temp_path)

    return jsonify({
        "text": text.strip()
    })

if __name__ == "__main__":
    app.run(port=5000)