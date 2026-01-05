import { SpamFilterTruth } from './ground_truth';
import { LogisticModel } from './model';
import { SpamCanvas } from '../../../components/simulations/SpamCanvas';

// Pseudo-random generator for consistent "random" values based on time/seed
const pseudoRand = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const config = {
  id: 'logistic_regression',
  // Previously "Phase 2: Spam Classification"
  title: 'Phase 2: Logistic Regression',
  description: 'Klassifikation von E-Mails als "Spam" oder "Kein Spam" basierend auf der Wortanzahl. Dies ist eine logistische Regression.',
  Model: LogisticModel,
  GroundTruth: SpamFilterTruth,
  CanvasComponent: SpamCanvas,
  defaultParams: {
    weight: 0,
    bias: 0,
  },
  groundTruthDefaults: [0.5, -5],

  // Input for the model is a random word count based on the current time step
  getInput: (time) => {
    const currentMsgId = Math.floor(time);
    return Math.floor(pseudoRand(currentMsgId) * 20);
  },

  generateData: (groundTruth) => {
    const data = [];
    for (let i = 0; i < 50; i++) {
      const wordCount = Math.floor(Math.random() * 21); // 0 to 20
      const isSpam = groundTruth.classify(wordCount);
      data.push({
        input: wordCount,
        target: isSpam
      });
    }
    return data.sort((a, b) => a.input - b.input);
  },

  trainingConfig: {
    maxSteps: 3000,
    params: [
      { name: 'weight', min: 0, max: 2, step: 0.1 },
      { name: 'bias', min: -10, max: 5, step: 0.5 }
    ]
  },

  networkViz: {
    formula: 'p = σ(w * x + b)',
    inputLabel: "Wörter (x)",
    outputLabel: "Spam (p)",
    biasLabel: "b"
  },

  // Simulation Control
  // 50 points total, speed is 2 points/sec
  isFinished: (time) => time >= 25
};
