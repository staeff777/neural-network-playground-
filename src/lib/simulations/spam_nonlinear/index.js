import { SpamAdvancedTruth } from '../spam_advanced/ground_truth';
import { LogisticModelVector } from '../spam_advanced/model';
import { SpamAdvancedCanvas } from '../../../components/simulations/SpamAdvancedCanvas';

export const FEATURES = [
    { label: "Gesamtworte", idx: 0, max: 400 },
    { label: "Links", idx: 1, max: 10 }
];



const usePreparedData = true;
const preparedData = [
    {
        "input": [367, 5],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },

    {
        "input": [365, 2],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },
    {
        "input": [364, 6],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },

    {
        "input": [327, 7],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },
    {
        "input": [302, 5],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },
    {
        "input": [314, 3],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },

    {
        "input": [345, 4],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },
    {
        "input": [265, 5],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },
    {
        "input": [287, 4],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },
    {
        "input": [311, 1],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },
    {
        "input": [268, 2],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },
    {
        "input": [283, 0],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },

    {
        "input": [261, 3],
        "target": 0,
        "text": "Attached is the quarterly report found at..."
    },
    {
        "input": [197, 0],
        "target": 0,
        "text": "Just a normal short message."
    },
    {
        "input": [150, 0],
        "target": 0,
        "text": "Just a normal short message."
    },
    {
        "input": [124, 0],
        "target": 0,
        "text": "Just a normal short message."
    },
    {
        "input": [65, 1],
        "target": 0,
        "text": "Just a normal short message."
    },
    {
        "input": [85, 0],
        "target": 0,
        "text": "Just a normal short message."
    },

    {
        "input": [58, 0],
        "target": 0,
        "text": "Just a normal short message."
    },
    {
        "input": [45, 0],
        "target": 0,
        "text": "Security Alert: Login Code 2542"
    },
    {
        "input": [36, 0],
        "target": 0,
        "text": "Security Alert: Login Code 5607"
    },
    {
        "input": [38, 1],
        "target": 0,
        "text": "Security Alert: Login Code 909"
    },
    {
        "input": [24, 1],
        "target": 0,
        "text": "Security Alert: Login Code 8385"
    },
    {
        "input": [17, 1],
        "target": 0,
        "text": "Security Alert: Login Code 2083"
    },






    {
        "input": [215, 1],
        "target": 1,
        "text": "You won a prize! Click here."
    },

    {
        "input": [230, 3],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [234, 5],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [221, 2],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [215, 4],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [153, 3],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [152, 1],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [137, 2],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [124, 4],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [120, 2],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [92, 3],
        "target": 1,
        "text": "You won a prize! Click here."
    },
    {
        "input": [93, 5],
        "target": 1,
        "text": "You won a prize! Click here."
    },

    {
        "input": [86, 5],
        "target": 1,
        "text": "You won a prize! Click here."
    },

    {
        "input": [84, 3],
        "target": 1,
        "text": "You won a prize! Click here."
    },

    {
        "input": [53, 4],
        "target": 1,
        "text": "You won a prize! Click here."
    },



    {
        "input": [55, 3],
        "target": 1,
        "text": "You won a prize! Click here."
    },

];


// Nonlinear Data Generator
export const generateNonlinearData = () => {
    let data = [];
    const count = 40;

    if (usePreparedData) {
        console.log("Using prepared data with length " + preparedData.length);
        return preparedData;
    }

    // Helper to add jitter
    const jitter = (val, mag = 0.5) => val + (Math.random() - 0.5) * mag;

    for (let i = 0; i < count; i++) {
        let input, target, text;
        const rand = Math.random();

        // 10% Short/Safe (Alerts, OTPs) - Words < 50, Links low -> Ham
        if (rand < 0.1) {
            const words = Math.floor(Math.max(0, 10 + Math.random() * 40)); // 10-50 words
            const links = Math.floor(Math.random() * 2); // 0 or 1 link
            input = [words, links];
            target = 0; // HAM
            text = "Security Alert: Login Code " + Math.floor(Math.random() * 9999);
        }
        // 50% Possible Spam - Words 50-250
        else if (rand < 0.6) {
            const words = Math.floor(50 + Math.random() * 200); // 50-250 words
            // If links > 0 -> Spam, else Ham
            // But we want it mostly spam for this region if they have links?
            // "possible spam with low to medium links. no links: no spam"

            const hasLinks = Math.random() > 0.2; // 80% chance of links
            const links = hasLinks ? 1 + Math.floor(Math.random() * 5) : 0;

            input = [words, links];
            target = links > 0 ? 1 : 0; // SPAM if links > 0
            text = links > 0 ? "You won a prize! Click here." : "Just a normal short message.";
        }
        // 40% Legitimate - Words > 250 (Long emails), even with links
        else {
            const words = 250 + Math.random() * 150; // 250-400 words
            const links = Math.floor(Math.random() * 8); // 0-8 links
            input = [words, links];
            target = 0; // HAM
            text = "Attached is the quarterly report found at...";
        }

        // Add some noise to inputs for distinctness
        input[0] = Math.max(0, Math.floor(input[0]));
        input[1] = Math.max(0, Math.floor(input[1]));

        data.push({
            input,
            target,
            text
        });


    }

    console.log("Generated Data Export:");
    console.log(JSON.stringify(data, null, 2));

    return data;
};


export const config = {
    id: 'spam_nonlinear',
    title: 'Phase 4: Nicht-lineare Daten',
    description: 'Spam-Erkennung mit nur 2 Merkmalen, aber komplexer Verteilung. Ein einfacher linearer Klassifikator (Perzeptron) wird hier scheitern.',
    Model: LogisticModelVector,
    GroundTruth: SpamAdvancedTruth, // Reuse, only acts as a container
    CanvasComponent: SpamAdvancedCanvas,

    defaultParams: {
        weights: [0, 0],
        bias: 0,
    },

    // Not really used for generation anymore since we have a custom generator, 
    // but useful for "predict" calls if the canvas asks for "getInput(time)"
    getInput: (time) => {
        const features = [50, 0];
        features.text = "Live Input";
        return features;
    },

    generateData: (groundTruth) => {
        return generateNonlinearData();
    },

    trainingConfig: {
        maxSteps: 4000,
        params: [
            { name: 'w1 (Worte)', min: -5, max: 5, step: 0.5 },
            { name: 'w2 (Links)', min: -5, max: 5, step: 0.5 },
            { name: 'bias', min: -10, max: 10, step: 1 }
        ]
    },

    networkViz: {
        formula: 'p = σ(w₁x₁ + w₂x₂ + b)',
        inputLabels: ["Worte", "Links"],
        outputLabel: "Spam?",
        biasLabel: "b"
    },

    // CUSTOM PROP for Canvas to use our 2 features
    featuresConfig: FEATURES,

    // Canvas needs these props passed through app.jsx -> CanvasComponent
    // We can inject them by wrapping or just ensuring App passes everything from config?
    // App.jsx: const vizProps = simConfig.networkViz || {}; ...
    // App.jsx passes: ...extraProps}
    // and extraProps logic in App.jsx checks simConfig.id. 
    // We might need to update App.jsx to pass `features` prop if it exists in config.

    isFinished: (time) => false
};
