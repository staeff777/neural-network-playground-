export class HiddenLayerModel {
    constructor(inputCount = 4, hiddenCount = 10) {
        this.inputCount = inputCount;
        this.hiddenCount = hiddenCount;

        // Layer 1 (Hidden): inputCount x hiddenCount weights + hiddenCount biases
        // weights[i][j] connect input i to hidden neuron j
        // Actually standard convention: weights[j][i] for W * x
        // Let's stick to simple implementation:
        // hiddenNeurons[j] = sigmoid(sum(inputs[i] * w_1[j][i]) + b_1[j])

        // We store weights as flat arrays or cleaner structures? 
        // Trainer expects to set them easily. 
        // Let's look at `setParams` usage.

        // Structure:
        // this.weights1 = [ [w00, w01, ...], ... ] (10 neurons, each 4 weights)
        // this.biases1 = [b0, b1, ...] (10 biases)
        // this.weights2 = [w0, w1, ...] (1 output neuron, 10 weights)
        // this.bias2 = b_out

        // Initialize with small random weights (Xavier-like)
        const limit = Math.sqrt(6 / (inputCount + hiddenCount));
        this.weights1 = Array(hiddenCount).fill(0).map(() =>
            Array.from({ length: inputCount }, () => (Math.random() * 2 * limit) - limit)
        );
        this.biases1 = Array(hiddenCount).fill(0);

        // Layer 2 weights initialization
        const limit2 = Math.sqrt(6 / (hiddenCount + 1));
        this.weights2 = Array.from({ length: hiddenCount }, () => (Math.random() * 2 * limit2) - limit2);
        this.bias2 = 0;
    }

    sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }

    predict(inputs) {
        // 1. Hidden Layer
        const hiddenOutputs = [];
        for (let j = 0; j < this.hiddenCount; j++) {
            let z = this.biases1[j];
            for (let i = 0; i < this.inputCount; i++) {
                z += this.weights1[j][i] * inputs[i];
            }
            hiddenOutputs.push(this.sigmoid(z));
        }

        // 2. Output Layer
        let zOut = this.bias2;
        for (let j = 0; j < this.hiddenCount; j++) {
            zOut += this.weights2[j] * hiddenOutputs[j];
        }
        const output = this.sigmoid(zOut);

        return output;
    }

    // Get internal state for visualization
    getActivations(inputs) {
        // 1. Hidden Layer
        const hiddenOutputs = [];
        for (let j = 0; j < this.hiddenCount; j++) {
            let z = this.biases1[j];
            for (let i = 0; i < this.inputCount; i++) {
                z += this.weights1[j][i] * inputs[i];
            }
            hiddenOutputs.push(this.sigmoid(z));
        }

        // 2. Output
        let zOut = this.bias2;
        for (let j = 0; j < this.hiddenCount; j++) {
            zOut += this.weights2[j] * hiddenOutputs[j];
        }
        const output = this.sigmoid(zOut);

        return {
            hidden: hiddenOutputs,
            output: [output]
        };
    }

    // Generic parameter setter for the trainer
    // params is an object { name: value }
    setParams(params) {
        // Expect names like:
        // w1_0_0 (layer 1, neuron 0, weight 0)
        // b1_0 (layer 1, neuron 0)
        // w2_0 (layer 2, weight 0 -> connecting hidden 0 to output)
        // b2 (layer 2 bias)

        // This might be slow if we parse strings every time in a loop.
        // Better: trainer calls setParams({ ... }) once per step? 
        // Actually trainer `trainRandomAsync` loops and calls `setParams` (or setWeight/setBias).
        // Our plan was to adapt trainer to pass the whole object.

        // To make it efficient, we can iterate our known structure and look up values.

        // Layer 1
        for (let j = 0; j < this.hiddenCount; j++) {
            // Biases
            const bKey = `b1_${j}`;
            if (params[bKey] !== undefined) this.biases1[j] = params[bKey];

            // Weights
            for (let i = 0; i < this.inputCount; i++) {
                const wKey = `w1_${j}_${i}`;
                if (params[wKey] !== undefined) this.weights1[j][i] = params[wKey];
            }
        }

        // Layer 2
        const b2Key = 'b2';
        if (params[b2Key] !== undefined) this.bias2 = params[b2Key];

        for (let j = 0; j < this.hiddenCount; j++) {
            const wKey = `w2_${j}`;
            if (params[wKey] !== undefined) this.weights2[j] = params[wKey];
        }
    }

    // Helper for Visualization (getting structure)
    getTopology() {
        return {
            inputCount: this.inputCount,
            hiddenCounts: [this.hiddenCount],
            outputCount: 1,
            weights1: this.weights1,
            biases1: this.biases1,
            weights2: this.weights2,
            bias2: this.bias2
        };
    }
}
