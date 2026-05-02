// words.js
// Palabras del Spelling Bee 2026 — Little Eagles 4-5.
// Las dejamos agrupadas por categoría con comentarios para que sea fácil
// agregar/quitar palabras en el futuro. La app usa el arreglo plano WORDS.

const REGULAR_WORDS = [
  "back", "celebrate", "bigger", "cabbage", "begin",
  "blond", "bone", "costume", "cuter", "cucumber",
  "amazing", "elbow", "lose", "grow", "cold",
  "cool", "knee", "firework", "fever", "famous",
  "lantern", "win", "relatives", "lettuce", "learn",
  "headache", "twice", "hiking", "smaller", "sneeze",
  "party", "smarter", "plant", "difficult", "popular",
  "balloons", "ice skating", "taller", "expensive", "tissue",
  "birthday", "younger", "important", "invitation", "glasses",
  "chores", "scratch", "writer", "wavy", "easy",
  "sometimes", "worse", "penguin", "cough", "thirsty",
  "square", "score", "opposite", "moustache", "little",
  "worst", "weather", "shout", "would", "toothbrush",
  "bruise", "loudly", "nothing", "quickly", "outside",
  "strong", "village", "noise", "round", "towel",
  "slowly", "treasure", "swimsuit", "temperature", "mistake"
];

const CHALLENGING_WORDS = [
  "believe", "daughter", "earache", "afterwards", "friendlier",
  "frightened", "planetarium", "inherit", "laugh", "mistake",
  "muscle", "old-fashioned", "mouthpiece", "stomachache", "vegetable"
];

const EXTRA_WORDS = [
  "wednesday", "upstairs", "sauce", "something", "rainbow",
  "matter", "milkshake", "inside", "granddaughter", "excuse",
  "exciting", "difference", "change", "brilliant", "badly"
];

// Arreglo plano que usa la app. Si quieres practicar solo una categoría,
// cambia esta línea por: const WORDS = REGULAR_WORDS; (o la que prefieras)
const WORDS = [...REGULAR_WORDS, ...CHALLENGING_WORDS, ...EXTRA_WORDS];
