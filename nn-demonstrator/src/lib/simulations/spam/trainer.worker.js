// Web Worker for Exhaustive Search
// Handles 5D loop (4 weights + 1 bias) without blocking UI

self.onmessage = (e) => {
  const { data, weightRanges, biasRange } = e.data;
  // data: array of { input: [f1,f2,f3,f4], target: 0/1 }
  // weightRanges: array of { min, max, step } for each weight
  // biasRange: { min, max, step }

  if (!data || data.length === 0) {
    self.postMessage({ error: "No data" });
    return;
  }

  // Pre-calculate ranges to flat arrays for easier iteration?
  // Or just nested loops.
  // 5 Nested loops. Recursive approach is cleaner for N weights.

  const history = [];
  let minError = Infinity;
  let bestWeights = [];
  let bestBias = 0;

  const ranges = [...weightRanges, biasRange]; // [w1, w2, w3, w4, b]
  const currentParams = new Array(ranges.length).fill(0);

  // Helper to generate steps
  const getSteps = (r) => {
    const steps = [];
    for(let v = r.min; v <= r.max; v += r.step) {
        steps.push(parseFloat(v.toFixed(2)));
    }
    return steps;
  };

  const paramSteps = ranges.map(getSteps);

  // Stats for progress reporting
  const totalIterations = paramSteps.reduce((acc, steps) => acc * steps.length, 1);
  let processed = 0;
  const reportInterval = Math.floor(totalIterations / 20); // Report 20 times

  // Recursive looper
  // depth 0..3 are weights, depth 4 is bias
  const iterate = (depth) => {
    if (depth === ranges.length) {
        // Calculate Error
        const weights = currentParams.slice(0, 4);
        const bias = currentParams[4];

        let errorSum = 0;

        // MSE Calculation
        for (let i = 0; i < data.length; i++) {
            const inputs = data[i].input; // array
            const target = data[i].target;

            // Prediction
            let z = bias;
            for(let j=0; j<4; j++) {
                z += weights[j] * inputs[j];
            }
            const pred = 1 / (1 + Math.exp(-z));
            const diff = target - pred;
            errorSum += diff * diff;
        }

        const mse = errorSum / data.length;

        // Save history?
        // Saving 10^5 points usually crashes the chart or browser memory if we pass it all back.
        // We should only pass back "significant" points or a sampled history?
        // OR: Users want to see the "Heatmap".
        // For 5 dimensions, we can't visualize a heatmap easily.
        // We will store "Best So Far" and maybe "Marginal" data?
        // Let's store ONLY updates that improve error significantly or just random samples?
        // The user wants to see "The search".
        // Let's push to history but maybe limit array size if it gets huge.

        // Actually, existing app logic stores EVERYTHING in history for 2D.
        // For 5D, totalIterations might be huge.
        // If totalIterations > 5000, we should subsample.

        if (mse < minError) {
            minError = mse;
            bestWeights = [...weights];
            bestBias = bias;
        }

        // Store sample for visualization (limited to ~5000 points max to keep UI responsive)
        // Or if simple logic:
        if (Math.random() < (5000 / totalIterations)) {
             history.push({ weights: [...weights], bias, error: mse });
        }

        processed++;
        if (processed % reportInterval === 0) {
             self.postMessage({ type: 'progress', processed, total: totalIterations });
        }
        return;
    }

    const steps = paramSteps[depth];
    for (let i = 0; i < steps.length; i++) {
        currentParams[depth] = steps[i];
        iterate(depth + 1);
    }
  };

  iterate(0);

  // Ensure best result is in history
  history.push({ weights: bestWeights, bias: bestBias, error: minError });

  self.postMessage({
    type: 'done',
    bestWeights,
    bestBias,
    history
  });
};
