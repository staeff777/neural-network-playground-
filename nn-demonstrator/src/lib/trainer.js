export class ExhaustiveTrainer {
  constructor(model) {
    this.model = model;
  }

  // Perform exhaustive search
  train(data, weightRange, biasRange) {
    const history = [];
    let bestWeight = weightRange.min;
    let bestBias = biasRange.min;
    let minError = Infinity;

    // We store initial state to restore later if needed, but the app usually updates it.
    // Ideally we shouldn't mutate the model being viewed during calculation if it affects the UI immediately,
    // but JS is single threaded and this runs synchronously, so it's fine.

    for (let w = weightRange.min; w <= weightRange.max; w += weightRange.step) {
       for (let b = biasRange.min; b <= biasRange.max; b += biasRange.step) {
          // Fix float precision issues for cleaner display
          const cw = parseFloat(w.toFixed(2));
          const cb = parseFloat(b.toFixed(2));

          // Update model state for prediction
          this.model.setWeight(cw);
          this.model.setBias(cb);

          let errorSum = 0;
          let absDiffSum = 0;
          for (const point of data) {
            const prediction = this.model.predict(point.input);
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
