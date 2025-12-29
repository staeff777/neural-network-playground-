export class LogisticModel {
  constructor() {
    // 4 weights for 4 features: SpamWords, Links, CapsLock, Exclamations
    this.weights = [0, 0, 0, 0];
    this.bias = 0;
  }

  sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  // Input is now an array of feature counts [f1, f2, f3, f4]
  predict(inputs) {
    // Dot product + bias
    let z = this.bias;
    if (Array.isArray(inputs)) {
        for(let i=0; i<inputs.length; i++) {
            z += (this.weights[i] || 0) * inputs[i];
        }
    } else {
        // Fallback for single dimension legacy calls if any
        z += (this.weights[0] || 0) * inputs;
    }

    return this.sigmoid(z);
  }

  setWeight(index, val) {
    if (typeof index === 'number') {
        this.weights[index] = val;
    } else if (Array.isArray(index)) {
        this.weights = index;
    }
  }

  // Legacy support for single weight calls
  setLegacyWeight(w) {
    this.weights[0] = w;
  }

  setBias(b) {
    this.bias = b;
  }
}
