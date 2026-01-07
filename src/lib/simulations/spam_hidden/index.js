import { SpamAdvancedTruth } from '../spam_advanced/ground_truth';
import { HiddenLayerModel } from './model';
import { SpamAdvancedCanvas } from '../../../components/simulations/SpamAdvancedCanvas';
import { generateNonlinearData, FEATURES } from '../spam_nonlinear/index';

const pseudoRand = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const buildLinks = (count, seed) => {
    if (!count) return '';
    const paths = ['login', 'verify', 'offer', 'invoice', 'tracking', 'reset', 'promo', 'survey'];
    const domains = ['example.com', 'secure-mail.net', 'tracking-info.org', 'account-help.co', 'promo-deals.io'];
    const links = [];
    for (let i = 0; i < count; i++) {
        const domain = domains[Math.floor(pseudoRand(seed + i * 31) * domains.length)];
        const path = paths[Math.floor(pseudoRand(seed + i * 57) * paths.length)];
        links.push(`http://${domain}/${path}/${Math.floor(pseudoRand(seed + i * 97) * 9000 + 1000)}`);
    }
    return links.join(' ');
};

const variedEmailText = (item, idx) => {
    const [words, links] = item.input;
    const seed = words * 100 + links * 10 + idx;

    const hamShortSubjects = [
        'Security notice',
        'Login code',
        '2FA code',
        'Device sign-in',
        'One-time password'
    ];

    const hamLongSubjects = [
        'Quarterly report attached',
        'Project status update',
        'Meeting notes and next steps',
        'Draft contract for review',
        'Budget summary'
    ];

    const spamSubjects = [
        'LIMITED OFFER inside',
        'URGENT: VERIFY ACCOUNT',
        'WIN a PRIZE today',
        'FREE BONUS available',
        'SECURITY ALERT: action required'
    ];

    const closings = [
        'Thanks,',
        'Best regards,',
        'Kind regards,',
        'Sincerely,',
        '—'
    ];

    const signature = ['Alex', 'Sam', 'Taylor', 'Jordan', 'Casey'][Math.floor(pseudoRand(seed + 7) * 5)];
    const closing = `${closings[Math.floor(pseudoRand(seed + 13) * closings.length)]} ${signature}`;
    const linkBlock = buildLinks(links, seed + 101);

    // Keep the text consistent with the point (HAM short alerts, HAM long reports, SPAM promo-ish)
    if (item.target === 0 && words < 60) {
        const subject = hamShortSubjects[Math.floor(pseudoRand(seed + 19) * hamShortSubjects.length)];
        const code = Math.floor(pseudoRand(seed + 23) * 900000 + 100000);
        const body = `Your login code is ${code}. It expires in 10 minutes.\nIf you did not request this, ignore this message.`;
        return `Subject: ${subject}\n${body}\n${closing}`;
    }

    if (item.target === 0) {
        const subject = hamLongSubjects[Math.floor(pseudoRand(seed + 29) * hamLongSubjects.length)];
        const body = [
            'Hi team,',
            'Sharing the latest update and a few action items for this week.',
            'Please review when you have a moment and reply with any questions.',
            linkBlock ? `References: ${linkBlock}` : '',
        ].filter(Boolean).join('\n');
        return `Subject: ${subject}\n${body}\n${closing}`;
    }

    // SPAM
    const subject = spamSubjects[Math.floor(pseudoRand(seed + 37) * spamSubjects.length)];
    const hooks = [
        'CLICK LINK NOW to CLAIM your REWARD.',
        'ACT NOW: LIMITED DISCOUNT expires TODAY.',
        'VERIFY ACCOUNT to avoid SUSPENDED access.',
        'WIN CASH PRIZE — CLAIM BONUS NOW.',
        'FREE OFFER available — CLICK LINK to continue.'
    ];
    const body = [
        hooks[Math.floor(pseudoRand(seed + 41) * hooks.length)],
        linkBlock ? `Links: ${linkBlock}` : 'Links: http://promo-deals.io/offer/1234',
        closing
    ].join('\n');
    return `Subject: ${subject}\n${body}`;
};

// Generate params for 2 inputs -> 10 hidden -> 1 output
const generateParamsConfig = () => {
    const params = [];

    // Layer 1: 10 neurons
    for (let j = 0; j < 10; j++) {
        // Bias
        params.push({ name: `b1_${j}`, min: -30, max: 30, step: 1.0 });

        // Weights (2 inputs)
        for (let i = 0; i < 2; i++) {
            params.push({ name: `w1_${j}_${i}`, min: -30, max: 30, step: 1.0 });
        }
    }

    // Layer 2: 1 output neuron
    // Bias
    params.push({ name: `b2`, min: -3, max: 3, step: 1.0 });

    // Weights (10 hidden inputs)
    for (let j = 0; j < 10; j++) {
        params.push({ name: `w2_${j}`, min: -50, max: 50, step: 1.0 });
    }

    return params;
};

// seeds: 536112786 with: 

export const config = {
    id: 'double_layer_nonlinear',
    title: 'Phase 5: Double Layer Nonlinear Data',
    description: 'Spam detection with a Hidden Layer (10 neurons). The Deep Neural Network can detect the nonlinear distribution ("Spam Island").',
    Model: HiddenLayerModel,
    GroundTruth: SpamAdvancedTruth,
    CanvasComponent: SpamAdvancedCanvas,

    // Default starting parameters
    defaultParams: {},

    // Reuse data generation from Phase 4
    // We provide a dummy input for the "Simulation" tab live view if needed
    getInput: (time) => {
        // Re-use logic from Phase 4 if available, or implement fresh
        // Since we didn't export it yet, let's just create a dynamic one here that mirrors it
        // Or better: import the prepared data via generator
        // Let's just create a dynamic sample on the fly to avoid dependency mess for now
        // Actually Phase 5 uses generateNonlinearData() which returns preparedData.
        const data = generateNonlinearData();
        const idx = Math.floor(time * 0.5) % data.length;
        const item = data[idx];
        const features = [...item.input];
        features.text = variedEmailText(item, idx);
        features.groundTruth = item.target;
        return features;
    },

    generateData: (groundTruth) => {
        return generateNonlinearData().map((item, idx) => ({
            ...item,
            text: variedEmailText(item, idx),
        }));
    },

    trainingConfig: {
        seed: 1319434789,
        maxSteps: 10000,
        params: generateParamsConfig()
    },

    networkViz: {
        formula: 'p = σ(W₂ · σ(W₁ · x + b₁) + b₂)',
        inputLabels: ["Spam\nWords", "Links"],
        outputLabel: "Spam (p)",
        biasLabel: "b"
    },

    // Custom features for Canvas
    featuresConfig: FEATURES,

    isFinished: (time) => time >= 50
};
