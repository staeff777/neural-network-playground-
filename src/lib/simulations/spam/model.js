export class LogisticModel {
  constructor() {
    this.weight = 0;
    this.bias = 0;
  }

  sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  predict(input) {
    // input is word count
    const z = this.weight * input + this.bias;
    return this.sigmoid(z);
  }

  setWeight(w) {
    this.weight = w;
  }

  setBias(b) {
    this.bias = b;
  }
}
