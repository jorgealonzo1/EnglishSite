// app.js
// Lógica principal de la app de spelling.
// Usa SpeechSynthesis (para hablar) y SpeechRecognition (para escuchar).
//
// Nota: SpeechRecognition solo funciona bien en Chrome / Edge de escritorio.
// El usuario debe darle permiso al micrófono la primera vez.

// ===== 1. Referencias a elementos del DOM =====
const hearBtn        = document.getElementById("hearBtn");
const spellBtn       = document.getElementById("spellBtn");
const nextBtn        = document.getElementById("nextBtn");
const resetBtn       = document.getElementById("resetBtn");
const statusEl       = document.getElementById("status");
const resultEl       = document.getElementById("result");
const heardEl        = document.getElementById("heard");
const wordEl         = document.getElementById("word");
const voiceSelect    = document.getElementById("voiceSelect");
const pendingListEl  = document.getElementById("pendingList");
const completedListEl = document.getElementById("completedList");
const pendingCountEl = document.getElementById("pendingCount");
const completedCountEl = document.getElementById("completedCount");

// ===== 2. Estado de la app =====
let currentWord    = "";
let pendingWords   = [];
let completedWords = [];
let englishVoices  = [];

// Estado del reconocimiento (modo continuo):
let activeRecognition     = null;   // instancia actual o null si no escuchamos
let accumulatedTranscript = "";     // todo lo que la niña ha dicho en esta sesión

const PREFERRED_VOICES = [
  "Google US English",
  "Google UK English Female",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Samantha",
  "Allison",
  "Ava (Premium)",
  "Karen",
  "Daniel"
];

function loadVoices() {
  const all = window.speechSynthesis.getVoices();
  englishVoices = all.filter(v => v.lang && v.lang.toLowerCase().startsWith("en"));

  voiceSelect.innerHTML = "";
  if (englishVoices.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "(no English voices found)";
    voiceSelect.appendChild(opt);
    return;
  }

  englishVoices.forEach((voice, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    const tag = voice.localService ? "" : " 🌐";
    opt.textContent = `${voice.name} (${voice.lang})${tag}`;
    voiceSelect.appendChild(opt);
  });

  const preferredIdx = englishVoices.findIndex(v =>
    PREFERRED_VOICES.some(name => v.name.includes(name))
  );
  voiceSelect.value = preferredIdx >= 0 ? preferredIdx : 0;
}

window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// ===== 3. Manejo de listas pendiente / completadas =====
function initWordLists() {
  pendingWords   = [...WORDS];
  completedWords = [];
  currentWord    = "";
}

function renderLists() {
  pendingListEl.innerHTML = "";
  pendingWords.forEach(w => {
    const li = document.createElement("li");
    li.textContent = w;
    if (w === currentWord) li.classList.add("current");
    pendingListEl.appendChild(li);
  });
  pendingCountEl.textContent = pendingWords.length;

  completedListEl.innerHTML = "";
  completedWords.forEach(w => {
    const li = document.createElement("li");
    li.textContent = w;
    completedListEl.appendChild(li);
  });
  completedCountEl.textContent = completedWords.length;

  const currentLi = pendingListEl.querySelector("li.current");
  if (currentLi) currentLi.scrollIntoView({ block: "nearest" });
}

function markCurrentCorrect() {
  if (!currentWord) return;
  pendingWords = pendingWords.filter(w => w !== currentWord);
  if (!completedWords.includes(currentWord)) {
    completedWords.push(currentWord);
  }
  renderLists();
}

// ===== 4. Elegir palabra aleatoria =====
function pickRandomWord() {
  if (pendingWords.length === 0) {
    currentWord = "";
    wordEl.textContent = "🎉 All done!";
    statusEl.textContent = "Press Reset to play again.";
    resultEl.textContent = "";
    resultEl.className = "result";
    heardEl.textContent = "";
    renderLists();
    return;
  }

  const pool = pendingWords.filter(w => w !== currentWord);
  const choices = pool.length > 0 ? pool : pendingWords;
  const i = Math.floor(Math.random() * choices.length);
  currentWord = choices[i].toLowerCase();

  wordEl.textContent = currentWord;
  resultEl.textContent = "";
  resultEl.className = "result";
  heardEl.textContent = "";
  statusEl.textContent = 'Press "Hear the word" to listen.';
  renderLists();
}

// ===== 5. Pronunciar la palabra (Text-to-Speech) =====
function speakWord(word) {
  if (!("speechSynthesis" in window)) {
    statusEl.textContent = "Sorry, your browser can't speak.";
    return;
  }
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(word);

  const idx = parseInt(voiceSelect.value, 10);
  const chosen = englishVoices[idx];
  if (chosen) {
    utter.voice = chosen;
    utter.lang  = chosen.lang;
  } else {
    utter.lang = "en-US";
  }

  utter.rate  = 0.9;
  utter.pitch = 1.0;
  window.speechSynthesis.speak(utter);
}

function normalize(word) {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

// ===== 6. Mapa para convertir letras habladas a letras reales =====
const LETTER_MAP = {
  "a": "a", "ay": "a", "ai": "a", "eh": "a",
  "b": "b", "bee": "b", "be": "b",
  "c": "c", "see": "c", "sea": "c", "ce": "c",
  "d": "d", "dee": "d", "de": "d",
  "e": "e", "ee": "e",
  "f": "f", "ef": "f", "eff": "f",
  "g": "g", "gee": "g", "ge": "g",
  "h": "h", "aitch": "h", "ach": "h", "haitch": "h",
  "i": "i", "eye": "i", "ai": "i",
  "j": "j", "jay": "j",
  "k": "k", "kay": "k", "ka": "k",
  "l": "l", "el": "l", "ell": "l",
  "m": "m", "em": "m",
  "n": "n", "en": "n",
  "o": "o", "oh": "o", "ow": "o",
  "p": "p", "pee": "p", "pe": "p",
  "q": "q", "cue": "q", "queue": "q",
  "r": "r", "ar": "r", "are": "r",
  "s": "s", "ess": "s", "es": "s",
  "t": "t", "tee": "t", "te": "t",
  "u": "u", "you": "u", "yu": "u",
  "v": "v", "vee": "v", "ve": "v",
  "w": "w", "double u": "w", "double-u": "w", "doubleyou": "w",
  "x": "x", "ex": "x", "ecks": "x",
  "y": "y", "why": "y", "wy": "y",
  "z": "z", "zee": "z", "zed": "z"
};

function transcriptToLetters(transcript) {
  const cleaned = transcript
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .trim();

  const tokens = cleaned.split(/\s+/);
  let letters = "";
  let mappedAll = true;

  for (const token of tokens) {
    if (LETTER_MAP[token]) {
      letters += LETTER_MAP[token];
    } else if (token.length === 1 && /[a-z]/.test(token)) {
      letters += token;
    } else {
      mappedAll = false;
      break;
    }
  }

  if (mappedAll && letters.length > 0) return letters;

  if (/^[a-z]+$/.test(cleaned.replace(/\s+/g, ""))) {
    return cleaned.replace(/\s+/g, "");
  }

  return "";
}

// ===== 7. Reconocimiento de voz en MODO CONTINUO =====
// La niña abre el micrófono con un click, y lo cierra con otro click
// (o se cierra solo cuando acierta la palabra completa).

function setSpellButtonListening(isListening) {
  if (isListening) {
    spellBtn.textContent = "⏹ Stop listening";
    spellBtn.classList.add("listening");
  } else {
    spellBtn.textContent = "🎤 Spell it";
    spellBtn.classList.remove("listening");
  }
}

function startListening() {
  // Si ya estamos escuchando, este click significa "detener".
  if (activeRecognition) {
    try { activeRecognition.stop(); } catch (e) {}
    return;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    statusEl.textContent = "Your browser doesn't support speech recognition. Try Chrome.";
    return;
  }

  const recognition = new SR();
  recognition.lang = "en-US";
  recognition.continuous = true;          // ← clave: deja el mic abierto
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;

  accumulatedTranscript = "";
  activeRecognition = recognition;
  setSpellButtonListening(true);
  statusEl.textContent = "🎤 Listening... take your time. Click Stop when ready.";
  heardEl.textContent  = "";

  const target = normalize(currentWord);

  recognition.onresult = (event) => {
    // Procesamos solo los resultados nuevos (desde resultIndex)
    for (let r = event.resultIndex; r < event.results.length; r++) {
      if (!event.results[r].isFinal) continue;
      const alts = event.results[r];

      // De las alternativas, escogemos la que mejor lleva a la palabra objetivo.
      let chosenText = alts[0].transcript;
      for (let a = 0; a < alts.length; a++) {
        const tentative = transcriptToLetters(accumulatedTranscript + " " + alts[a].transcript);
        if (tentative === target) { chosenText = alts[a].transcript; break; }
      }
      accumulatedTranscript += " " + chosenText;
    }

    const lettersSoFar = transcriptToLetters(accumulatedTranscript);
    heardEl.textContent =
      `Heard: "${accumulatedTranscript.trim()}" → ${lettersSoFar || "(...)"}`;

    // Si ya formó la palabra correcta, paramos automáticamente.
    if (lettersSoFar === target) {
      try { recognition.stop(); } catch (e) {}
    }
  };

  recognition.onerror = (event) => {
    // "no-speech" y "aborted" son normales en modo continuo: los ignoramos.
    if (event.error === "no-speech" || event.error === "aborted") return;
    statusEl.textContent = `Mic error: ${event.error}.`;
  };

  recognition.onend = () => {
    activeRecognition = null;
    setSpellButtonListening(false);

    const target = normalize(currentWord);
    const finalLetters = transcriptToLetters(accumulatedTranscript);

    if (finalLetters === target) {
      resultEl.textContent = `✅ Correct! The word is "${currentWord}".`;
      resultEl.className = "result correct";
      markCurrentCorrect();
      statusEl.textContent = "Great job! Press 'Next word' for another.";
    } else if (accumulatedTranscript.trim() === "") {
      statusEl.textContent = "I didn't hear anything. Try again.";
    } else {
      resultEl.textContent = `❌ Try Again! You spelled: "${finalLetters || "(unclear)"}"`;
      resultEl.className = "result wrong";
      statusEl.textContent = "Press 🎤 to try this word again, or ➡️ for a new one.";
    }
  };

  try {
    recognition.start();
  } catch (e) {
    statusEl.textContent = "Could not start the mic. Try clicking again.";
    activeRecognition = null;
    setSpellButtonListening(false);
  }
}

// ===== 8. Conexión de botones =====
hearBtn.addEventListener("click", () => {
  if (!currentWord) {
    statusEl.textContent = "No more words! Press Reset to start over.";
    return;
  }
  speakWord(currentWord);
  statusEl.textContent = "Now press 🎤 Spell it and say the letters.";
});

spellBtn.addEventListener("click", () => {
  if (!currentWord) {
    statusEl.textContent = "Press Reset to start over.";
    return;
  }
  startListening();
});

nextBtn.addEventListener("click", () => {
  // Si está escuchando, primero paramos
  if (activeRecognition) {
    try { activeRecognition.stop(); } catch (e) {}
  }
  pickRandomWord();
});

resetBtn.addEventListener("click", () => {
  if (activeRecognition) {
    try { activeRecognition.stop(); } catch (e) {}
  }
  initWordLists();
  pickRandomWord();
  statusEl.textContent = "Fresh start! Press 'Hear the word'.";
});

// ===== 9. Inicialización =====
initWordLists();
pickRandomWord();
