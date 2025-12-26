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
  train(data, weightRange = { min: 0, max: 60, step: 0.5 }, biasRange = { min: 0, max: 100, step: 1 }) {
    const history = [];
    let bestWeight = weightRange.min;
    let bestBias = biasRange.min;
    let minError = Infinity;

    for (let w = weightRange.min; w <= weightRange.max; w += weightRange.step) {
       for (let b = biasRange.min; b <= biasRange.max; b += biasRange.step) {
          // Fix float precision issues for cleaner display
          const cw = parseFloat(w.toFixed(2));
          const cb = parseFloat(b.toFixed(2));

          let errorSum = 0;
          let absDiffSum = 0;
          for (const point of data) {
            const prediction = cw * point.input + cb;
            const diff = point.target - prediction;
            errorSum += diff * diff;
            absDiffSum += Math.abs(diff);
          }
          const mse = errorSum / data.length;
          const mae = absDiffSum / data.length;

          if (mse < minError) {
            minError = mse;
            bestWeight = cw;
            bestBias = cb;
          }

          history.push({ weight: cw, bias: cb, error: mse, mae });
       }
    }

    return { bestWeight, bestBias, history };
  }
}
