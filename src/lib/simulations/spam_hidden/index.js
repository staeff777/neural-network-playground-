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
        features.text = item.text;
        features.groundTruth = item.target;
        return features;
    },

    generateData: (groundTruth) => {
        return generateNonlinearData();
    },

    trainingConfig: {
        seed: 1319434789,
        maxSteps: 10000,
        params: generateParamsConfig()
    },

    networkViz: {
        formula: 'p = σ(W₂ · σ(W₁ · x + b₁) + b₂)',
        inputLabels: ["Spam Words", "Links"],
        outputLabel: "Spam (p)",
        biasLabel: "b"
    },

    // Custom features for Canvas
    featuresConfig: FEATURES,

    isFinished: (time) => time >= 50
};
