import { SpamAdvancedTruth } from '../spam_advanced/ground_truth';
import { HiddenLayerModel } from './model';
import { SpamAdvancedCanvas } from '../../../components/simulations/SpamAdvancedCanvas';
import { config as advancedConfig } from '../spam_advanced/index';

// Generate params for 4 inputs -> 10 hidden -> 1 output
const generateParamsConfig = () => {
    const params = [];

    // Layer 1: 10 neurons
    for (let j = 0; j < 10; j++) {
        // Bias
        params.push({ name: `b1_${j}`, min: -3, max: 3, step: 1.0 });

        // Weights (4 inputs)
        for (let i = 0; i < 4; i++) {
            params.push({ name: `w1_${j}_${i}`, min: -3, max: 3, step: 1.0 });
        }
    }

    // Layer 2: 1 output neuron
    // Bias
    params.push({ name: `b2`, min: -3, max: 3, step: 1.0 });

    // Weights (10 hidden inputs)
    for (let j = 0; j < 10; j++) {
        params.push({ name: `w2_${j}`, min: -5, max: 5, step: 1.0 });
    }

    return params;
};

export const config = {
    id: 'spam_hidden',
    title: 'Phase 4: Deep Learning (Hidden Layer)',
    description: 'Spam-Erkennung mit einem Hidden Layer (10 Neuronen). Komplexere Muster können erkannt werden.',
    Model: HiddenLayerModel,
    GroundTruth: SpamAdvancedTruth,
    CanvasComponent: SpamAdvancedCanvas,

    // Default starting parameters
    // We can't easily list 60 params here, but the model init handles 0s.
    defaultParams: {
        // We can rely on Model defaults (random or zero)
        // Or we could try to load a pre-trained set if we had one.
    },

    // Reuse data generation from Phase 3
    getInput: advancedConfig.getInput,
    examples: advancedConfig.examples,
    generateData: advancedConfig.generateData,

    // Training Config
    trainingConfig: {
        params: generateParamsConfig()
    },

    networkViz: {
        formula: 'Deep Network',
        inputLabels: ["Spam-Worte", "Großbuchst.", "Links", "Gesamtworte"],
        outputLabel: "Spam?",
        biasLabel: "b"
    },

    isFinished: (time) => time >= 50
};
