import { SpamAdvancedTruth } from "./ground_truth";
import { LogisticModelVector } from "./model";
import { SpamAdvancedCanvas } from "../../../components/simulations/SpamAdvancedCanvas";

// Pseudo-random generator
const pseudoRand = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Helper to analyze text to extract "Features"
const analyze = (text) => {
  // 1. Spam Words (Simple keyword match)
  const spamKeywords = [
    "winner",
    "won",
    "gift card",
    "urgent",
    "rolex",
    "viagra",
    "cash",
    "prize",
    "singles",
    "marketing",
    "buy",
    "free",
    "money",
    "security alert",
    "click",
    "claim",
    "fake",
    "verification",
  ];
  const lower = text.toLowerCase();
  let spamCount = 0;
  spamKeywords.forEach((k) => {
    if (lower.includes(k)) spamCount += 1; // Count actual matches
  });
  // Clamp
  if (spamCount > 10) spamCount = 10;

  // 2. Links
  const linkCount = (text.match(/http/g) || []).length;

  // 3. Total Words
  const wordCount = text.split(/\s+/).length;

  return [spamCount, linkCount, wordCount];
};

export const config = {
  id: "multiple_inputs",
  title: "Phase 3: Multiple Inputs",
  description:
    "Advanced spam detection with multiple linear features (spam words, links, total words). The network learns a separation line.",
  collapseModelArchitectureByDefault: false,
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
      "See the details here: http://rewards-center.example",
      "Free sample available today: http://meds-offer.example",
      "Winner: you won a prize and a free gift card. Click to claim at http://rewards-center.example",
      "Urgent verification required. Security alert: click http://secure-verify.example to claim access",
      "Buy Viagra today, free delivery. Claim cash bonus at http://meds-offer.example",
      "Marketing promo: winner cash prize today. Click http://promo-redeem.example to claim now",
      "Fake Rolex deal: buy now and claim a free upgrade at http://rolex-deals.example",
      "Singles offer: click http://dating-now.example to claim your free match",
      "Urgent: claim money refund. Click http://money-claim.example for verification",
      "Winner notice: free cash prize inside. Claim at http://instant-prize.example http://promo-redeem.example",
      "Security alert: verification needed—click http://account-check.example or http://secure-verify.example to claim access",
      "Gift card bonus: claim your prize at http://gift-redeem.example http://rewards-center.example http://instant-prize.example http://promo-redeem.example",
    ],
    ham: [
      "Quick reminder: standup is 9:15 in Room B, please be on time.",
      "Lunch at 12:30 today? If that works, I will book a table.",
      "Can you review the slides and leave comments by end of day?",
      "Your package is at reception; please pick it up before 5pm.",
      "Security alert: new sign-in from your laptop. Verification is required in the portal.",
      "Urgent: can you review the release checklist today and reply with any blockers?",
      "Please click the doc link and confirm the numbers match the spreadsheet.",
      "Hi team, here are the notes from today's planning session: scope, risks, and owners. Please add comments in the doc before Thursday afternoon.",
      "Can you review the latest API changes and confirm the error codes match the spec? I pushed a small patch and added a checklist for QA.",
      "Reminder: the workshop is next Wednesday at 10:00. Agenda and slides are here: http://intranet.example/events/workshop. Let me know if you have topics to add.",
      "I updated the quarterly report draft with the new charts and assumptions. If you spot any inconsistencies, reply with the section number and your suggestion.",
      "Thanks for your help earlier. I tested the release candidate on staging and everything looks stable, including the migration and rollback steps.",
      "Could you send the updated invoice details for vendor ACME? Finance needs the PO number, billing address, and the cost center for this month.",
      "Please confirm whether we should keep the current caching strategy for search results. I can write up the trade-offs and share a proposal tomorrow.",
      "Fwd: travel itinerary for the conference. Flights and hotel are attached; the venue map is here: http://maps.example/venue. I'll arrive Monday evening.",
      "Here are the references for the design review: http://intranet.example/designs/v2 and http://intranet.example/notes/1234. Please skim before the meeting.",
      "I uploaded the draft docs and samples here: http://intranet.example/docs/api http://intranet.example/docs/errors http://intranet.example/docs/examples. Feedback welcome.",
      "I created a short checklist for onboarding the new engineer: accounts, access requests, and first-week tasks. Happy to walk through it on our next call.",
      "Do you have time to pair on the UI polish? I'd like to align on spacing, typography, and accessibility before we merge the final changes.",
    ],
  },

  generateData: (groundTruth) => {
    const data = [];

    // Process all Spam examples
    config.examples.spam.forEach((text) => {
      const inputs = analyze(text);
      // Add slight jitter so identical emails don't perfectly overlap
      const jitter = () => (Math.random() - 0.5) * 0.1;
      const inputsJittered = inputs.map((v) => Math.max(0, v + jitter()));

      data.push({
        input: inputsJittered,
        target: 1, // SPAM
        text: text,
      });
    });

    // Process all Ham examples
    config.examples.ham.forEach((text) => {
      const inputs = analyze(text);
      // Jitter
      const inputsJittered = inputs.map((v) =>
        Math.max(0, v + (Math.random() - 0.5) * 0.1),
      );

      data.push({
        input: inputsJittered,
        target: 0, // HAM
        text: text,
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
      { name: "w1 (Spam Words)", min: 1, max: 4, step: 0.5 }, // 0, 1, 2
      { name: "w2 (Links)", min: 0, max: 3, step: 0.5 }, // 0, 1.5, 3
      { name: "w3 (Total Words)", min: -2, max: 2, step: 0.5 }, // -1, -0.5, 0
      { name: "bias", min: -8, max: 8, step: 2 }, // -10, -8, ..., 0 (6 steps)
    ],
  },

  networkViz: {
    formula: "p = σ(w₁x₁ + w₂x₂ + w₃x₃ + b)",
    inputLabels: ["Spam Words", "Links", "Total Words"],
    outputLabel: "Spam (p)",
    biasLabel: "b",
  },

  // Custom features for Canvas
  featuresConfig: [
    { label: "Spam Words", idx: 0, max: 15 },
    { label: "Links", idx: 1, max: 8 },
    { label: "Total Words", idx: 2, max: 100 },
  ],

  isFinished: (time) => time >= 50, // 50 units of time
};
