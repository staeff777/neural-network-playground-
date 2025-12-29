export class SpamFilterTruth {
  // Configured with reasonable "True" weights
  // 1. SpamWords: Strong indicator (+)
  // 2. Links: Medium indicator (+)
  // 3. CapsLock: Weak indicator (+)
  // 4. Exclamations: Weak indicator (+)
  constructor(weights = [0.8, 0.5, 0.2, 0.2], bias = -3) {
    this.weights = weights;
    this.bias = bias;
  }

  sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  getProbability(inputs) {
    let z = this.bias;
    for(let i=0; i<inputs.length; i++) {
        z += (this.weights[i] || 0) * inputs[i];
    }
    return this.sigmoid(z);
  }

  classify(inputs) {
    const probability = this.getProbability(inputs);
    return Math.random() < probability ? 1 : 0;
  }
}
