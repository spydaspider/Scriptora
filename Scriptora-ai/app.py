from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel
import tempfile
import os

app = Flask(__name__)
CORS(app)

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)

@app.route("/transcribe", methods=["POST"])
def transcribe_audio():

    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file"}), 400

        audio = request.files["audio"]

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            temp_path = tmp.name

        audio.save(temp_path)

        segments, info = model.transcribe(
            temp_path,
            beam_size=5,          # 🔥 improves accuracy
            vad_filter=True,      # 🔥 removes silence noise
            temperature=0.0       # 🔥 makes output stable
        )

        text = " ".join([s.text for s in segments]).strip().lower()

        if os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({"text": text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)