export class SimpleNeuralNet {
  constructor() {
    this.weight = 0;
    this.bias = 0;
  }

  predict(input) {
    return this.weight * input + this.bias;
  }

  setWeight(w) {
    this.weight = w;
  }

  setBias(b) {
    this.bias = b;
  }
}
