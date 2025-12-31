export class ExhaustiveTrainer {
  constructor(model) {
    this.model = model;
  }

  // Generic training method supporting arbitrary parameters
  // paramsConfig is an array of { name, min, max, step }
  // OR for backward compatibility: train(data, weightRange, biasRange)
  train(data, arg2, arg3) {
    // Backward compatibility check
    if (arg3 !== undefined) {
      return this.trainLegacy(data, arg2, arg3);
    }


    const paramsConfig = arg2; // Array of param configs
    const history = [];
    let minError = Infinity;
    let bestParams = {};

    // Helper to generate range
    const getRange = (config) => {
      const arr = [];
      // Protect against infinite loops if step is 0 or wrong direction
      if (config.step <= 0) return [config.min];

      for (let v = config.min; v <= config.max + 0.0001; v += config.step) {
        arr.push(parseFloat(v.toFixed(2)));
      }
      return arr;
    };

    // Recursive search
    const search = (paramIndex, currentParams) => {
      console.log({ paramIndex, currentParams });
      if (paramIndex === paramsConfig.length) {
        // Base case: all params set, evaluate model

        // Apply params to model
        // We assume the model has a way to accept these.
        // For the Vector model: setWeights and setBias.
        // For compatibility, we need to know which param maps to what.
        // Assumption: paramsConfig order matches model expectation or we use naming convention.
        // Since we defined the config in index.js, we can structure it.

        // Specific logic for LogisticModelVector:
        // It expects `setWeights` (array) and `setBias` (scalar).
        // We need to parse currentParams.

        // Let's assume the order is [w1, w2, ..., wn, bias]
        // We can detect "bias" by name or position.

        const weights = [];
        let bias = 0;

        currentParams.forEach((val, idx) => {
          const name = paramsConfig[idx].name.toLowerCase();
          if (name.includes('bias')) {
            bias = val;
          } else {
            weights.push(val);
          }
        });

        if (this.model.setWeights) {
          this.model.setWeights(weights);
        } else if (this.model.setWeight) {
          // Fallback for single weight model if used here
          this.model.setWeight(weights[0]);
        }

        this.model.setBias(bias);

        // Evaluate
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
          // Store deep copy
          bestParams = { weights: [...weights], bias };
        }

        // History might be too large for multi-dim, only store if needed or sample?
        // For 500 points it's fine.        
        history.push({ params: [...currentParams], error: mse, mae });
        return;
      }

      const config = paramsConfig[paramIndex];
      const range = getRange(config);

      for (const val of range) {
        currentParams[paramIndex] = val;
        search(paramIndex + 1, currentParams);
      }
    };

    search(0, new Array(paramsConfig.length));

    return { bestParams, history, minError };
  }

  // Legacy support for existing simulations (physics, spam v1)
  trainLegacy(data, weightRange, biasRange) {
    const history = [];
    let bestWeight = weightRange.min;
    let bestBias = biasRange.min;
    let minError = Infinity;

    for (let w = weightRange.min; w <= weightRange.max; w += weightRange.step) {
      for (let b = biasRange.min; b <= biasRange.max; b += biasRange.step) {
        const cw = parseFloat(w.toFixed(2));
        const cb = parseFloat(b.toFixed(2));

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

  // Async version for live visualization
  async trainAsync(data, paramsConfig, onProgress) {
    // Determine Legacy vs Generic
    const isLegacy = !Array.isArray(paramsConfig);

    if (isLegacy) {
      // Legacy Async Training (Weight/Bias loops)
      const weightRange = arguments[1]; // re-map for legacy call signature
      const biasRange = arguments[2];
      const onProgressLegacy = arguments[3];

      let bestWeight = weightRange.min;
      let bestBias = biasRange.min;
      let minError = Infinity;

      // We will chunk updates to run smooth at ~60fps
      let chunk = [];
      const CHUNK_SIZE = 20;
      let operations = 0;

      for (let w = weightRange.min; w <= weightRange.max; w += weightRange.step) {
        for (let b = biasRange.min; b <= biasRange.max; b += biasRange.step) {
          const cw = parseFloat(w.toFixed(2));
          const cb = parseFloat(b.toFixed(2));

          this.model.setWeight(cw);
          this.model.setBias(cb);

          let errorSum = 0;
          let absDiffSum = 0;
          for (const point of data) {
            const prediction = this.model.predict(point.input);
            const diff = point.target - prediction;
            errorSum += diff * diff; // MSE
            absDiffSum += Math.abs(diff); // MAE
          }
          const mse = errorSum / data.length;
          const mae = absDiffSum / data.length;

          if (mse < minError) {
            minError = mse;
            bestWeight = cw;
            bestBias = cb;
          }

          const resultPoint = { weight: cw, bias: cb, error: mse, mae };
          chunk.push(resultPoint);
          operations++;

          // Yield every CHUNK_SIZE
          if (operations % CHUNK_SIZE === 0) {
            if (onProgressLegacy) onProgressLegacy(chunk, { bestWeight, bestBias, minError });
            chunk = [];
            // Await a tick to let UI paint
            await new Promise(r => setTimeout(r, 0));
          }
        }
      }
      // Final flush
      if (chunk.length > 0 && onProgressLegacy) {
        onProgressLegacy(chunk, { bestWeight, bestBias, minError });
      }
      return { bestWeight, bestBias, minError };
    }

    // --- Generic Async Training ---
    let minError = Infinity;
    let bestParams = {};

    let operations = 0;
    const CHUNK_SIZE = 50; // Smaller chunk size for better responsiveness
    let chunk = [];

    const getRange = (config) => {
      const arr = [];
      if (config.step <= 0) return [config.min];
      for (let v = config.min; v <= config.max + 0.0001; v += config.step) {
        arr.push(parseFloat(v.toFixed(2)));
      }
      return arr;
    };

    const ranges = paramsConfig.map(getRange);

    // Recursive helper that purely awaits periodically
    const searchAsync = async (paramIndex, currentParams) => {
      if (paramIndex === paramsConfig.length) {
        // --- EVALUATE (Leaf Node) ---

        // 1. Decode Params
        const weights = [];
        let bias = 0;
        currentParams.forEach((val, idx) => {
          const name = paramsConfig[idx].name.toLowerCase();
          if (name.includes('bias')) {
            bias = val;
          } else {
            weights.push(val);
          }
        });

        // 2. Set Model
        if (this.model.setWeights) {
          this.model.setWeights(weights);
        } else if (this.model.setWeight) {
          this.model.setWeight(weights[0]);
        }
        this.model.setBias(bias);

        // 3. Calc Error
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
          bestParams = { weights: [...weights], bias };
        }

        // Store
        const point = { params: [...currentParams], error: mse, mae };
        chunk.push(point);
        operations++;

        // Check if we need to yield
        if (operations % CHUNK_SIZE === 0) {
          if (onProgress) onProgress(chunk, { bestParams, minError });
          chunk = [];
          await new Promise(r => setTimeout(r, 0));
        }
        return;
      }

      const range = ranges[paramIndex];
      for (const val of range) {
        currentParams[paramIndex] = val;
        await searchAsync(paramIndex + 1, currentParams);
      }
    };

    await searchAsync(0, new Array(paramsConfig.length));

    // Final flush
    if (chunk.length > 0 && onProgress) {
      onProgress(chunk, { bestParams, minError });
    }

    return { bestParams, minError };
  }
}
