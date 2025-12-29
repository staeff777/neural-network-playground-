import { SpamFilterTruth } from './ground_truth';
import { LogisticModel } from './model';
import { EmailVisualizer } from '../../../components/simulations/EmailVisualizer';
import { emails } from './emails';

// Web Worker loader
// We need to import the worker constructor.
// Vite handles 'new Worker(new URL(...))' nicely.
// We cannot import it directly here easily without setup?
// Let's pass the worker factory to the config.

export const config = {
  id: 'spam',
  title: 'Phase 2: Logistische Regression (Spam Filter)',
  description: 'Analyse von 4 Kriterien: Spam-Wörter, Links, Großbuchstaben, Ausrufezeichen.',
  Model: LogisticModel,
  GroundTruth: SpamFilterTruth,
  CanvasComponent: EmailVisualizer,

  defaultParams: {
    weight: [0, 0, 0, 0], // Start neutral
    bias: 0,
  },
  groundTruthDefaults: [[0.8, 0.5, 0.2, 0.2], -3],

  // Data Generation: Now generates random feature vectors based on our 4 dimensions
  // To keep it simple for "Data" tab, we generate synthetic vectors
  generateData: (groundTruth) => {
    const data = [];
    // Generate 50 random vectors roughly matching the email distribution
    for(let i=0; i<50; i++) {
        // Randomly simulate features
        const f1 = Math.floor(Math.random() * 3); // Words 0-2
        const f2 = Math.random() < 0.3 ? 1 : 0;   // Link?
        const f3 = Math.floor(Math.random() * 5); // Caps 0-4
        const f4 = Math.floor(Math.random() * 3); // Exclam 0-2

        const input = [f1, f2, f3, f4];
        const isSpam = groundTruth.classify(input);

        data.push({ input, target: isSpam });
    }
    return data;
  },

  trainingConfig: {
    // 4 dimensions + bias
    // Range: -2 to 2 is usually enough for normalized-ish features.
    // Step: Coarse step to keep 5^N reasonable.
    // 5 points per param: (-2, -1, 0, 1, 2) -> 5^5 = 3125 iters. Fast!
    weightRanges: [
        { min: -1, max: 2, step: 1 }, // w1 (SpamWords)
        { min: -1, max: 2, step: 1 }, // w2 (Links)
        { min: -1, max: 1, step: 1 }, // w3 (Caps) - Keep smaller range
        { min: -1, max: 1, step: 1 }  // w4 (Exclam)
    ],
    biasRange: { min: -5, max: 0, step: 1 }, // b

    // We use a worker for training
    useWorker: true,
    workerPath: new URL('./trainer.worker.js', import.meta.url)
  },

  networkViz: {
    formula: 'p = σ(w₁x₁ + w₂x₂ + w₃x₃ + w₄x₄ + b)',
    inputLabel: "Features",
    outputLabel: "Spam?",
    biasLabel: "b",
    // Labels for the input nodes
    inputNodeLabels: ['Wörter', 'Links', 'CAPS', '!!!']
  },

  // Email visualizer doesn't need loop control really, it's interactive.
  // But if we hit "Run", maybe it auto-cycles?
  // Let's implement auto-cycle for fun.
  isFinished: (time) => time > 10, // Just stop after some cycles
  getInput: (time) => {
      // Return a mock feature set changing over time?
      // Actually EmailVisualizer manages its own state (index).
      // We can ignore this for now or pass index.
      return Math.floor(time) % 4;
  }
};
