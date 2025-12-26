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
}

export class ExhaustiveTrainer {
  constructor(model) {
    this.model = model;
  }

  // Generate training data from ground truth
  // timeSteps is an array of time values (e.g. [0, 1, 2, 3...])
  generateData(groundTruth, timeSteps) {
    return timeSteps.map(t => ({
      input: t,
      target: groundTruth.getPosition(t)
    }));
  }

  // Perform exhaustive search
  train(data, rangeMin = 0, rangeMax = 60, step = 0.5) {
    const history = [];
    let bestWeight = rangeMin;
    let minError = Infinity;

    for (let w = rangeMin; w <= rangeMax; w += step) {
      // Fix float precision issues for cleaner display
      w = parseFloat(w.toFixed(2));

      let errorSum = 0;
      for (const point of data) {
        const prediction = w * point.input; // Bias assumed 0 for this simplified demo
        const diff = point.target - prediction;
        errorSum += diff * diff;
      }
      const mse = errorSum / data.length;

      if (mse < minError) {
        minError = mse;
        bestWeight = w;
      }

      history.push({ weight: w, error: mse });
    }

    return { bestWeight, history };
  }
}
