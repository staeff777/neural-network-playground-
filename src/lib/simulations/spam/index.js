import { SpamFilterTruth } from "./ground_truth";
import { LogisticModel } from "./model";
import { SpamCanvas } from "../../../components/simulations/SpamCanvas";

// Pseudo-random generator for consistent "random" values based on time/seed
const pseudoRand = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const config = {
  id: "logistic_regression",
  // Previously "Phase 2: Spam Classification"
  title: "Phase 2: Logistic Regression",
  description:
    'Classification of emails as "Spam" or "Not Spam" based on word count. This is a logistic regression.',
  collapseModelArchitectureByDefault: false,
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

  generateData: (_groundTruth) => {
    const SPAM_WORDS = new Set([
      "FREE",
      "WIN",
      "PRIZE",
      "CLAIM",
      "URGENT",
      "OFFER",
      "BONUS",
      "CLICK",
      "LINK",
      "NOW",
      "LIMITED",
      "DISCOUNT",
      "VERIFY",
      "ACCOUNT",
      "PAYMENT",
      "SUSPENDED",
      "APPROVED",
      "CASH",
      "REWARD",
      "SECURITY",
      "ALERT",
      "ACT",
      "TODAY",
    ]);

    const countSpamWords = (text) => {
      // Count only all-caps tokens so "Account" doesn't count but "ACCOUNT" does.
      const tokens = String(text || "").match(/[A-Z0-9]+/g) || [];
      let count = 0;
      for (const token of tokens) {
        if (SPAM_WORDS.has(token)) count++;
      }
      return count;
    };

    const makeData = (text, target) => ({
      input: countSpamWords(text),
      target,
      text,
    });

    const spamTokens = Array.from(SPAM_WORDS);
    const pickTokens = (count, seed) => {
      const tokens = [...spamTokens];
      for (let i = tokens.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRand(seed + i * 97) * (i + 1));
        [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
      }
      return tokens.slice(0, count);
    };

    const subjectBase = [
      "Project update",
      "Quick question",
      "Invoice follow up",
      "Meeting schedule",
      "Account notice",
      "Delivery status",
      "Action required",
      "Weekly summary",
    ];

    const bodyBase = [
      "Hi, just following up. Could you take a look when you have a moment?",
      "Hello, sharing the details below. Thanks for your time.",
      "Hey, can you confirm receipt and let me know if anything is missing?",
      "Hi, please review and reply when convenient. Appreciate it.",
      "Hello, sending this over for your review. Thanks.",
    ];

    const makeEmailText = (spamWordCount, seed) => {
      const subject =
        subjectBase[Math.floor(pseudoRand(seed + 11) * subjectBase.length)];
      const body =
        bodyBase[Math.floor(pseudoRand(seed + 29) * bodyBase.length)];
      const tokens = pickTokens(spamWordCount, seed + 101);
      const keywordTail = tokens.length ? ` ${tokens.join(" ")}` : "";
      return `Subject: ${subject}${keywordTail}\n${body}`;
    };

    // Create 50 samples over x=0..20 (word count), labels sampled from sigmoid with exceptions.
    const xs = [];
    for (let x = 0; x <= 20; x++) {
      xs.push(x, x); // 42 total
    }
    for (let x = 0; x < 8; x++) xs.push(x); // +8 = 50 total

    const candidates = xs.map((x, idx) => {
      const seed = x * 1000 + idx;
      const text = makeEmailText(x, seed);
      const probability = _groundTruth?.getProbability
        ? _groundTruth.getProbability(x)
        : 0;
      const u = pseudoRand(seed + 999);
      return { x, idx, text, score: probability - u };
    });

    // Keep exactly 25 SPAM / 25 HAM while still following the sigmoid curve:
    // points with the strongest "spam evidence" (probability - random) become SPAM.
    const spamIdx = new Set(
      [...candidates]
        .sort((a, b) => b.score - a.score)
        .slice(0, 25)
        .map((c) => c.idx),
    );

    const data = candidates.map((c) =>
      makeData(c.text, spamIdx.has(c.idx) ? 1 : 0),
    );
    return data.sort((a, b) => a.input - b.input);
  },

  trainingConfig: {
    maxSteps: 3000,
    params: [
      { name: "weight", min: 0, max: 2, step: 0.1 },
      { name: "bias", min: -10, max: 5, step: 0.5 },
    ],
  },

  networkViz: {
    formula: "p = σ(w * x + b)",
    inputLabel: "Spam Words",
    outputLabel: "Spam (p)",
    biasLabel: "b",
  },

  // Simulation Control
  // 50 points total, speed is 2 points/sec
  isFinished: (time) => time >= 25,
};
