import { SpamAdvancedTruth } from './ground_truth';
import { LogisticModelVector } from './model';
import { SpamAdvancedCanvas } from '../../../components/simulations/SpamAdvancedCanvas';

// Pseudo-random generator
const pseudoRand = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Helper to analyze text to extract "Features"
const analyze = (text) => {
  // 1. Spam Words (Simple keyword match)
  const spamKeywords = ['winner', 'won', 'gift card', 'urgent', 'rolex', 'viagra', 'cash', 'prize', 'singles', 'marketing', 'buy', 'free', 'money', 'security alert', 'click', 'claim', 'fake', 'verification'];
  const lower = text.toLowerCase();
  let spamCount = 0;
  spamKeywords.forEach(k => {
    if (lower.includes(k)) spamCount += 1; // Count actual matches
  });
  // Clamp
  if (spamCount > 10) spamCount = 10;

  // 2. Links
  const linkCount = (text.match(/http/g) || []).length;

  // 3. Total Words (Normalize by 50)
  const wordCount = text.split(/\s+/).length / 50;

  return [spamCount, linkCount, wordCount];
};

export const config = {
  id: 'multiple_inputs',
  title: 'Phase 3: Multiple Inputs',
  description: 'Advanced spam detection with multiple linear features (spam words, links, total words). The network learns a separation line.',
  Model: LogisticModelVector,
  GroundTruth: SpamAdvancedTruth,
  CanvasComponent: SpamAdvancedCanvas,

  // Default starting parameters for the model
  defaultParams: {
    weights: [0, 0, 0],
    bias: 0,
  },

  // Ground truth weights (hidden from user initially)
  groundTruthDefaults: [[1.5, 2.0, -0.5], -5],

  // Generate a random email vector based on time
  getInput: (time) => {
    // Deterministic Selection based on time
    const seed = Math.floor(time * 0.3); // Switch every ~3.3 seconds (Time moves at 3.0x in app)

    // 50/50 Prob
    const isSpam = pseudoRand(seed) > 0.5;
    const list = isSpam ? config.examples.spam : config.examples.ham;

    // Pick text
    const textIdx = Math.floor(pseudoRand(seed + 99) * list.length);
    const text = list[textIdx];

    // Analyze
    const features = analyze(text);

    // Attach Metadata (using array properties to keep compatibility with Model.predict(array))
    features.text = text;
    features.groundTruth = isSpam ? 1 : 0;

    return features;
  },

  // Example Texts for visualization
  examples: {
    spam: [
      "Winner! You won a $1000 gift card. Claim at http://prize-giveaway.net",
      "Urgent: verify your account at http://secure-bank-login.com/fraud",
      "Cheap Rolex watches. 50% off at http://fake-watches.cn",
      "Lose weight fast. Buy pills at http://diet-miracle.com",
      "Congrats! Cash prize waiting at http://claim-money.org",
      "Singles waiting. Chat now at http://local-dating.xyz",
      "Refinance 1% APR. Apply at http://easy-loans.biz",
      "Buy one get one free Viagra at http://meds-direct.com",
      "Meet rich men. Sign up at http://millionaire-match.com",
      "Security alert: suspicious activity. Check http://account-security-check.com"
    ],
    ham: [
      "Meeting agenda for tomorrow's team sync",
      "Hey, are we still on for lunch?",
      "Invoice #12345 from Aws Services",
      "Project deadline extended to Friday",
      "Happy birthday. Hope you have a great day.",
      "Can you review this pull request?",
      "Your Amazon order has shipped",
      "Fwd: Tickets for the concert",
      "Question about the quarterly report",
      "Let's catch up sometime next week."
    ],
  },

  generateData: (groundTruth) => {
    const data = [];

    // Process all Spam examples
    config.examples.spam.forEach(text => {
      const inputs = analyze(text);
      // Add slight jitter so identical emails don't perfectly overlap
      const jitter = () => (Math.random() - 0.5) * 0.1;
      const inputsJittered = inputs.map(v => Math.max(0, v + jitter()));

      data.push({
        input: inputsJittered,
        target: 1, // SPAM
        text: text
      });
    });

    // Process all Ham examples
    config.examples.ham.forEach(text => {
      const inputs = analyze(text);
      // Jitter
      const inputsJittered = inputs.map(v => Math.max(0, v + (Math.random() - 0.5) * 0.1));

      data.push({
        input: inputsJittered,
        target: 0, // HAM
        text: text
      });
    });

    // Shuffle data so Training doesn't see all Spam then all Ham
    for (let i = data.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [data[i], data[j]] = [data[j], data[i]];
    }

    return data;
  },

  // Grid Search Config
  // We have 4 params (3 weights + bias). To keep it fast, we use coarse steps.
  trainingConfig: {
    maxSteps: 3000,
    params: [
      { name: 'w1 (Spam Words)', min: 1, max: 4, step: 0.5 }, // 0, 1, 2
      { name: 'w2 (Links)', min: 0, max: 3, step: 0.5 }, // 0, 1.5, 3
      { name: 'w3 (Total Words)', min: -2, max: 2, step: 0.5 }, // -1, -0.5, 0
      { name: 'bias', min: -8, max: 8, step: 2 } // -10, -8, ..., 0 (6 steps)
    ]

  },

  networkViz: {
    formula: 'p = σ(w₁x₁ + w₂x₂ + w₃x₃ + b)',
    inputLabels: ["Spam Words", "Links", "Words (/50)"],
    outputLabel: "Spam (p)",
    biasLabel: "b"
  },

  // Custom features for Canvas
  featuresConfig: [
    { label: "Spam Words", idx: 0, max: 15 },
    { label: "Links", idx: 1, max: 8 },
    { label: "Total Words", idx: 2, max: 100 }
  ],

  isFinished: (time) => time >= 50 // 50 units of time
};
