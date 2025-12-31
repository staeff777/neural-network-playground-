export class SpamFilterTruth {
  constructor(weight = 0.5, bias = -5) {
    this.weight = weight;
    this.bias = bias;
  }

  sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  // Returns true (1) or false (0) based on probability
  classify(wordCount) {
    const probability = this.sigmoid(this.weight * wordCount + this.bias);
    // Add some noise or just straightforward probability threshold?
    // For a demonstrator, strict thresholding on probability creates a clean separation,
    // but sampling `Math.random() < probability` creates realistic noisy data.
    // Given the user wants to learn the curve, noisy data is better.
    return Math.random() < probability ? 1 : 0;
  }

  // Return the pure probability for visualization
  getProbability(wordCount) {
    return this.sigmoid(this.weight * wordCount + this.bias);
  }
}
