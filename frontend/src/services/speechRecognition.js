export const startSpeechRecognition = (onResult) => {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  let active = true;

  recognition.onstart = () => {
    console.log("VOICE RECOGNITION STARTED");
  };

  recognition.onresult = (event) => {
    const transcript =
      event.results[event.results.length - 1][0]
        .transcript;

    console.log("HEARD:", transcript);

    onResult(transcript.toLowerCase());
  };

  recognition.onerror = (err) => {
    console.error("VOICE ERROR:", err);
  };

  recognition.onend = () => {
    console.log("VOICE RESTARTING");

    if (active) {
      setTimeout(() => {
        recognition.start();
      }, 1000);
    }
  };

  recognition.start();

  return () => {
    active = false;
    recognition.stop();
  };
};