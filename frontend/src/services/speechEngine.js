import { parseBibleReferenceSmart } from "./bibleParser";
import { validateReference } from "./bibleValidator";
import { looksLikeBibleSpeech } from "./bibleSpeechDetector";


const lastSpeech = {
  text: "",
  time: 0
};


const pendingReference = {
  value: "",
  count: 0
};


const COOLDOWN = 3000;


export const speechEngine = (text, callbacks) => {

  if (!text || text.trim() === "") {
    return;
  }


  text = text.toLowerCase().trim();


  /*
  -----------------------------
  1. DUPLICATE CHECK
  -----------------------------
  */

  if (
    lastSpeech.text === text &&
    Date.now() - lastSpeech.time < 2000
  ) {
    return;
  }


  lastSpeech.text = text;
  lastSpeech.time = Date.now();



  /*
  -----------------------------
  2. COOLDOWN CHECK
  -----------------------------
  */

  if (
    callbacks.lastAction &&
    Date.now() - callbacks.lastAction.current < COOLDOWN
  ) {
    return;
  }



  /*
  -----------------------------
  3. CHECK IF BIBLE SPEECH
  -----------------------------
  */

  if (!looksLikeBibleSpeech(text)) {
    console.log(
      "Ignored normal speech:",
      text
    );

    return;
  }



  /*
  -----------------------------
  4. PARSE
  -----------------------------
  */

  const parsed =
    parseBibleReferenceSmart(text);


  console.log(
    "ENGINE PARSED:",
    parsed
  );


  if (!parsed) {
    return;
  }



  /*
  -----------------------------
  5. COMMANDS
  -----------------------------
  */


  if (parsed.command) {

    callbacks.runCommand(
      parsed.command
    );

    callbacks.lastAction.current =
      Date.now();

    return;
  }




  /*
  -----------------------------
  6. VALIDATE REFERENCE
  -----------------------------
  */


  const validation =
    validateReference(parsed);


  if (!validation.valid) {

    console.log(
      "Rejected:",
      validation.reason
    );

    return;
  }





  /*
  -----------------------------
  7. CONFIRM TWICE
  -----------------------------
  */


  const reference =
`${parsed.book}-${parsed.chapter}-${parsed.verse || 1}`;


  if (
    pendingReference.value === reference
  ) {

    pendingReference.count++;

  } else {

    pendingReference.value =
      reference;

    pendingReference.count = 1;

    return;
  }



  if (
    pendingReference.count < 2
  ) {

    return;

  }





  /*
  -----------------------------
  8. EXECUTE
  -----------------------------
  */


 callbacks.goToReference(
    parsed.book,
    parsed.chapter,
    parsed.verse || 1
);


  callbacks.lastAction.current =
    Date.now();


};