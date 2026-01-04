import { SpamAdvancedTruth } from '../spam_advanced/ground_truth';
import { HiddenLayerModel } from './model';
import { SpamAdvancedCanvas } from '../../../components/simulations/SpamAdvancedCanvas';
import { generateNonlinearData, FEATURES } from '../spam_nonlinear/index';

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
    id: 'spam_hidden',
    title: 'Phase 5: Deep Learning (Hidden Layer)',
    description: 'Spam-Erkennung mit einem Hidden Layer (10 Neuronen). Das Deep Neural Network kann die nicht-lineare Verteilung ("Spam-Insel") erkennen.',
    Model: HiddenLayerModel,
    GroundTruth: SpamAdvancedTruth,
    CanvasComponent: SpamAdvancedCanvas,

    // Default starting parameters
    defaultParams: {},

    // Reuse data generation from Phase 4
    // We provide a dummy input for the "Simulation" tab live view if needed
    getInput: (time) => {
        return {
            input: [50, 0],
            text: "Live Input"
        };
    },

    generateData: (groundTruth) => {
        return generateNonlinearData();
    },

    trainingConfig: {
        seed: 1041971602,
        params: generateParamsConfig()
    },

    networkViz: {
        formula: 'Deep Network',
        inputLabels: ["Worte", "Links"],
        outputLabel: "Spam?",
        biasLabel: "b"
    },

    // Custom features for Canvas
    featuresConfig: FEATURES,

    isFinished: (time) => time >= 50
};
