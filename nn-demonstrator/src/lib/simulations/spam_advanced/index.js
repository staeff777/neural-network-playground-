import { SpamAdvancedTruth } from './ground_truth';
import { LogisticModelVector } from './model';
import { SpamAdvancedCanvas } from '../../../components/simulations/SpamAdvancedCanvas';

// Pseudo-random generator
const pseudoRand = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

export const config = {
  id: 'spam_advanced',
  title: 'Phase 3: Erweiterter Spam-Filter (4 Eingaben)',
  description: 'Spam-Erkennung mit 4 Merkmalen: Spam-Worte, Großbuchstaben, Links, Gesamtworte.',
  Model: LogisticModelVector,
  GroundTruth: SpamAdvancedTruth,
  CanvasComponent: SpamAdvancedCanvas,

  // Default starting parameters for the model
  defaultParams: {
    weights: [0, 0, 0, 0],
    bias: 0,
  },

  // Ground truth weights (hidden from user initially)
  // 1. Spam Words (High positive)
  // 2. Caps (Medium positive)
  // 3. Links (High positive)
  // 4. Total Words (Small negative - normalized)
  groundTruthDefaults: [[1.5, 0.5, 2.0, -0.5], -5],

  // Generate a random email vector based on time
  getInput: (time) => {
    const seed = Math.floor(time * 10);
    // 1. Spam Words: 0-10
    const spamWords = Math.floor(pseudoRand(seed) * 11);
    // 2. Caps: 0-20
    const caps = Math.floor(pseudoRand(seed + 1) * 21);
    // 3. Links: 0-5
    const links = Math.floor(pseudoRand(seed + 2) * 6);
    // 4. Total Words: 10-100 (Normalized for stability? Or raw? Let's keep raw but use small weight)
    const totalWords = Math.floor(pseudoRand(seed + 3) * 90) + 10;

    return [spamWords, caps, links, totalWords];
  },

  generateData: (groundTruth) => {
    const data = [];
    // Generate 50 emails
    for(let i=0; i<50; i++) {
        const seed = i * 1337;
        const spamWords = Math.floor(pseudoRand(seed) * 11);
        const caps = Math.floor(pseudoRand(seed + 1) * 21);
        const links = Math.floor(pseudoRand(seed + 2) * 6);
        const totalWords = Math.floor(pseudoRand(seed + 3) * 90) + 10;

        const inputs = [spamWords, caps, links, totalWords];
        const isSpam = groundTruth.classify(inputs);

        data.push({
            input: inputs,
            target: isSpam
        });
    }
    return data;
  },

  // Grid Search Config
  // We have 5 params. To keep it fast, we use very coarse steps.
  // 3 steps per weight = 3^4 = 81.
  // 10 steps for bias = 810. Manageable.
  trainingConfig: {
    params: [
        { name: 'w1 (Spam-Worte)', min: 0, max: 2, step: 1.0 }, // 0, 1, 2
        { name: 'w2 (Großbuchst.)', min: 0, max: 1, step: 0.5 }, // 0, 0.5, 1
        { name: 'w3 (Links)', min: 0, max: 3, step: 1.5 }, // 0, 1.5, 3
        { name: 'w4 (Gesamtworte)', min: -1, max: 0, step: 0.5 }, // -1, -0.5, 0
        { name: 'bias', min: -10, max: 0, step: 2 } // -10, -8, ..., 0 (6 steps)
    ]
    // Total iterations: 3 * 3 * 3 * 3 * 6 = 486. Very fast.
  },

  networkViz: {
    formula: 'p = σ(w₁x₁ + w₂x₂ + w₃x₃ + w₄x₄ + b)',
    inputLabels: ["Spam-Worte", "Großbuchst.", "Links", "Gesamtworte"],
    outputLabel: "Spam? (p)",
    biasLabel: "b"
  },

  isFinished: (time) => time >= 50 // 50 units of time
};
