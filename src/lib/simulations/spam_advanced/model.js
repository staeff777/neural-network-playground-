export class LogisticModelVector {
  constructor(inputCount = 3) {
    this.weights = new Array(inputCount).fill(0);
    this.bias = 0;
  }

  sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  predict(inputs) {
    // inputs is array of numbers
    let z = this.bias;
    const safeLen = Math.min(this.weights.length, inputs?.length ?? 0);
    for (let i = 0; i < safeLen; i++) {
      z += this.weights[i] * inputs[i];
    }
    return this.sigmoid(z);
  }

  // Setters for trainer
  setWeights(wArray) {
    this.weights = [...wArray];
  }

  setBias(b) {
    this.bias = b;
  }

  // Helper for single weight update if needed
  setWeightAt(index, val) {
    if (index >= 0 && index < this.weights.length) {
        this.weights[index] = val;
    }
  }
}
