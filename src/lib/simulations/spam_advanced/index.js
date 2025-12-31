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

  // Example Texts for visualization
  examples: {
    spam: [
      "WINNER! Won $1000 Gift Card! Claim at http://prize-giveaway.net",
      "URGENT: Verify account at http://secure-bank-login.com/fraud",
      "Cheap Rolex watches! 50% OFF at www.fake-watches.cn",
      "Lose weight fast! Buy pills: http://diet-miracle.com",
      "CONGRATS! Cash prize waiting: http://claim-money.org",
      "HOT singles waiting! Chat now: http://local-dating.xyz",
      "Refinance 1% APR. Apply: http://easy-loans.biz",
      "Buy 1 get 1 FREE Viagra. http://meds-direct.com",
      "Meet rich men. Signup: http://millionaire-match.com",
      "SECURITY ALERT: Suspicious activity. Check http://account-security-check.com"
    ],
    ham: [
      "Meeting agenda for tomorrow's team sync",
      "Hey, are we still on for lunch?",
      "Invoice #12345 from AWS Services",
      "Project deadline extended to Friday",
      "Happy Birthday! Hope you have a great day.",
      "Can you review this pull request?",
      "Your Amazon order has shipped.",
      "Fwd: Tickets for the concert",
      "Question about the quarterly report",
      "Let's catch up sometime next week."
    ],
  },

  generateData: (groundTruth) => {
    // Helper to analyze text to extract "Features"
    const analyze = (text) => {
      // 1. Spam Words (Simple keyword match)
      // Some simple keywords often found in spam
      const spamKeywords = ['winner', 'won', 'gift card', 'urgent', 'rolex', 'viagra', 'cash', 'prize', 'singles', 'marketing', 'buy', 'free', 'money', 'security alert', 'click', 'claim', 'fake', 'verification'];
      const lower = text.toLowerCase();
      let spamCount = 0;
      spamKeywords.forEach(k => {
        if (lower.includes(k)) spamCount += 1; // Count actual matches
      });
      // Clamp
      if (spamCount > 10) spamCount = 10;

      // 2. Caps
      const capsCount = (text.match(/[A-Z]/g) || []).length;

      // 3. Links
      const linkCount = (text.match(/http/g) || []).length;

      // 4. Total Words
      const wordCount = text.split(/\s+/).length;

      return [spamCount, capsCount, linkCount, wordCount];
    };

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
  // We have 5 params. To keep it fast, we use very coarse steps.
  // 3 steps per weight = 3^4 = 81.
  // 10 steps for bias = 810. Manageable.
  trainingConfig: {
    params: [
      { name: 'w1 (Spam-Worte)', min: 1, max: 4, step: 0.5 }, // 0, 1, 2
      { name: 'w2 (Großbuchst.)', min: 0, max: 2, step: 0.5 }, // 0, 0.5, 1
      { name: 'w3 (Links)', min: 0, max: 3, step: 0.5 }, // 0, 1.5, 3
      { name: 'w4 (Gesamtworte)', min: -2, max: 2, step: 0.5 }, // -1, -0.5, 0
      { name: 'bias', min: -8, max: 8, step: 2 } // -10, -8, ..., 0 (6 steps)
    ]

  },

  networkViz: {
    formula: 'p = σ(w₁x₁ + w₂x₂ + w₃x₃ + w₄x₄ + b)',
    inputLabels: ["Spam-Worte", "Großbuchst.", "Links", "Gesamtworte"],
    outputLabel: "Spam? (p)",
    biasLabel: "b"
  },

  isFinished: (time) => time >= 50 // 50 units of time
};
