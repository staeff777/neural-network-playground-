export class SpamAdvancedTruth {
  constructor(weights = [0.5, 0.2, 0.8, -0.1], bias = -3) {
    this.weights = weights;
    this.bias = bias;
  }

  sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  // Returns true (1) or false (0) based on probability
  classify(inputs) {
    let z = this.bias;
    for(let i=0; i<this.weights.length; i++) {
        z += this.weights[i] * inputs[i];
    }
    const probability = this.sigmoid(z);

    // Random sampling based on probability
    return Math.random() < probability ? 1 : 0;
  }

  getProbability(inputs) {
    let z = this.bias;
    for(let i=0; i<this.weights.length; i++) {
        z += this.weights[i] * inputs[i];
    }
    return this.sigmoid(z);
  }
}
