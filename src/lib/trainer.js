// Simple seeded random number generator (Mulberry32)
function mulberry32(a) {
  return function () {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

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

        // Approx accuracy
        let correctCount = 0;
        for (const point of data) {
          const p = this.model.predict(point.input);
          const cls = p >= 0.5 ? 1 : 0;
          // If target is probability (0 or 1), round it too?
          // Target is usually 0 OR 1.
          if (cls === point.target) correctCount++;
        }
        const accuracy = correctCount / data.length;


        if (mse < minError) {
          minError = mse;
          // Store deep copy
          bestParams = { weights: [...weights], bias };
        }

        // History might be too large for multi-dim, only store if needed or sample?
        // For 500 points it's fine.        
        history.push({ params: [...currentParams], error: mse, mae, accuracy });
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

        // Approx accuracy
        let correctCount = 0;
        for (const point of data) {
          const p = this.model.predict(point.input);
          const cls = p >= 0.5 ? 1 : 0;
          if (cls === point.target) correctCount++;
        }
        const accuracy = correctCount / data.length;


        if (mse < minError) {
          minError = mse;
          bestWeight = cw;
          bestBias = cb;
        }

        history.push({ weight: cw, bias: cb, error: mse, mae, accuracy });
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

          // Approx Accuracy
          let correctCount = 0;
          for (const point of data) {
            const p = this.model.predict(point.input);
            const cls = p >= 0.5 ? 1 : 0;
            if (cls === point.target) correctCount++;
          }
          const accuracy = correctCount / data.length;

          if (mse < minError) {
            minError = mse;
            bestWeight = cw;
            bestBias = cb;
          }

          const resultPoint = { weight: cw, bias: cb, error: mse, mae, accuracy };
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
        // 2. Set Model
        let decodedParams = {};
        if (this.model.setParams) {
          currentParams.forEach((val, idx) => {
            decodedParams[paramsConfig[idx].name] = val;
          });
          this.model.setParams(decodedParams);

          // For bestParams storage
          if (bias === undefined) bias = 0; // fallback
        } else {
          if (this.model.setWeights) {
            this.model.setWeights(weights);
          } else if (this.model.setWeight) {
            this.model.setWeight(weights[0]);
          }
          this.model.setBias(bias);
          decodedParams = { weights: [...weights], bias };
        }

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

        // Approx Accuracy
        let correctCount = 0;
        for (const point of data) {
          const p = this.model.predict(point.input);
          const cls = p >= 0.5 ? 1 : 0;
          if (cls === point.target) correctCount++;
        }
        const accuracy = correctCount / data.length;


        if (mse < minError) {
          minError = mse;
          bestParams = decodedParams;
        }

        // Store
        const point = { params: [...currentParams], error: mse, mae, accuracy };
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

  // --- Adaptive Random Search Trainer ---
  // Starts with wide search radius, narrows down over time.
  async trainRandomAsync(data, paramsConfig, onProgress, options = {}) {
    const { patience = 5000, seed } = options;
    const MAX_STEPS = 20000;
    const INITIAL_RADIUS_FACTOR = 0.5; // Start with searching 50% of the space
    const DECAY = 0.999; // decay radius per step
    const PHASE_1_RATIO = 0.8;
    let minError = Infinity;
    let bestParams = {};

    // 0. Setup Random Generator
    let currentSeed = seed;
    if (currentSeed === undefined || currentSeed === null) {
      currentSeed = Math.floor(Math.random() * 2147483647);
      console.log(`[AdaptiveRandom] Generated Seed: ${currentSeed}`);
    } else {
      console.log(`[AdaptiveRandom] Using Seed: ${currentSeed}`);
    }
    const random = mulberry32(currentSeed);


    // 0. Initialize Dynamic Ranges
    // We clone the config ranges so we can expand them if needed.
    let dynamicRanges = paramsConfig.map(c => ({
      min: c.min,
      max: c.max,
      span: c.max - c.min
    }));

    // 1. Initialize random starting point
    let currentParamsArr = dynamicRanges.map(c => {
      return c.min + random() * c.span;
    });

    // Evaluate Initial
    const evaluate = (paramArr) => {
      // Decode
      const weights = [];
      let bias = 0;
      paramArr.forEach((val, idx) => {
        const name = paramsConfig[idx].name.toLowerCase();
        if (name.includes('bias')) {
          bias = val;
        } else {
          weights.push(val);
        }
      });

      // Set
      let decodedParams = {};
      if (this.model.setParams) {
        paramArr.forEach((val, idx) => {
          decodedParams[paramsConfig[idx].name] = val;
        });
        this.model.setParams(decodedParams);
      } else {
        if (this.model.setWeights) {
          this.model.setWeights(weights);
        } else if (this.model.setWeight) {
          this.model.setWeight(weights[0]);
        }
        this.model.setBias(bias);
        decodedParams = { weights, bias };
      }

      // Calc Error
      let errorSum = 0;
      let absDiffSum = 0;
      for (const point of data) {
        const prediction = this.model.predict(point.input);
        const diff = point.target - prediction;
        errorSum += diff * diff;
        absDiffSum += Math.abs(diff);
      }
      let correctAcc = 0;

      // Re-loop for accuracy because we need fresh predictions? 
      // Actually we computed them in loop... but we didn't store.
      // Optimization: merge loops?
      // model.predict is fast for this toy app.
      for (const point of data) {
        const p = this.model.predict(point.input);
        const cls = p >= 0.5 ? 1 : 0;
        if (cls === point.target) correctAcc++;
      }
      const acc = correctAcc / data.length;

      return { mse: errorSum / data.length, mae: absDiffSum / data.length, accuracy: acc, decodedParams, weights, bias };
    };

    let currentRes = evaluate(currentParamsArr);
    minError = currentRes.mse;
    bestParams = currentRes.decodedParams
      ? { ...currentRes.decodedParams, _array: [...currentParamsArr] }
      : { weights: currentRes.weights, bias: currentRes.bias, _array: [...currentParamsArr] };

    // Yield initial
    if (onProgress) onProgress([{ params: [...currentParamsArr], error: minError, mae: currentRes.mae, accuracy: currentRes.accuracy }], { bestParams, minError });
    await new Promise(r => setTimeout(r, 0));


    // 2. Loop
    let chunk = [];
    const CHUNK_SIZE = 10;

    // SA State
    let currentError = minError;
    let currentBestParamsArray = [...currentParamsArr]; // The 'walker' position
    let stepsSinceLastImprovement = 0;

    for (let step = 0; step < MAX_STEPS; step++) {
      // Two-Stage Logic

      const isPhase1 = step < MAX_STEPS * PHASE_1_RATIO;

      // Temperature & Radius
      // Phase 1: Keep Temperature higher for exploration. 
      // Phase 2: Cool down for convergence.
      let T, radiusFactor;

      if (isPhase1) {
        // Exploration: Slower decay
        // Normalize step within phase
        const progress = step / (MAX_STEPS * PHASE_1_RATIO);
        T = 0.2 * (1 - progress * 0.5); // 0.2 -> 0.1
        radiusFactor = INITIAL_RADIUS_FACTOR * (1 - progress * 0.5); // 0.5 -> 0.25 (Keep it reasonably large)

      } else {
        // Refinement: Standard cooling
        const progress = (step - MAX_STEPS * PHASE_1_RATIO) / (MAX_STEPS * (1 - PHASE_1_RATIO));
        T = 0.1 * (1 - progress); // 0.1 -> 0.0
        radiusFactor = (INITIAL_RADIUS_FACTOR * 0.5) * Math.pow(DECAY, step - MAX_STEPS * PHASE_1_RATIO);
      }

      let extended = false;
      const candidateArr = [...currentBestParamsArray]; // Copy walker

      // Select params to mutate (Probabilistic to avoid coupled-noise interference)
      // At least one param must mutate.
      let mutated = false;
      while (!mutated) {
        candidateArr.forEach((val, idx) => {
          if (random() < 0.4) return; // 60% chance to mutate each (high flux) or tunable

          mutated = true;
          const range = dynamicRanges[idx];

          let didExtend = false;

          // --- Phase 1 Only: Dynamic Boundary Extension ---
          if (isPhase1) {
            const threshold = range.span * 0.3;
            const isBestVal = bestParams._array && Math.abs(val - bestParams._array[idx]) < 1e-9;

            if (isBestVal && val < range.min + threshold) {
              range.min -= range.span * 0.4;
              range.span = range.max - range.min;
              didExtend = true;
            }
            if (isBestVal && val > range.max - threshold) {
              range.max += range.span * 0.4;
              range.span = range.max - range.min;
              didExtend = true;
            }

            if (didExtend) extended = true;
          } else {
          }

          let effectiveRadius = range.span * radiusFactor;
          // Boost radius if we just extended to explore new space
          if (didExtend) {
            effectiveRadius = Math.max(effectiveRadius, range.span * 0.25);
          }

          const r = effectiveRadius;
          let newVal = val + (random() - 0.5) * 2 * r;

          if (newVal < range.min) newVal = range.min;
          if (newVal > range.max) newVal = range.max;

          candidateArr[idx] = newVal;
        });

        // Safety break if loop is weird, though forEach always runs once if array not empty.
        // If random chance caused none to update, force update random one?
        // Actually 'while(!mutated)' handles it by retrying the whole pass.
      }

      const res = evaluate(candidateArr);

      // Metropolis Acceptance Criterion
      const diff = res.mse - currentError;
      let accept = false;

      if (diff < 0) {
        accept = true; // Always accept accumulation of improvement
      } else {
        // Accept with probability even if worse
        const prob = Math.exp(-diff / (T + 1e-9));
        //if (random() < prob) accept = true;
      }

      if (accept) {
        currentBestParamsArray = candidateArr;
        currentError = res.mse;
      }

      // Update Global Best separately
      if (res.mse < minError) {
        minError = res.mse;
        bestParams = { weights: res.weights, bias: res.bias, _array: [...candidateArr] };
        stepsSinceLastImprovement = 0;
      } else {
        stepsSinceLastImprovement++;
      }

      if (stepsSinceLastImprovement >= patience && !isPhase1) {
        break;
      }

      // Store history (User sees the Walker's attempts)
      chunk.push({ params: [...candidateArr], error: res.mse, mae: res.mae, accuracy: res.accuracy });

      // Yield
      if (chunk.length >= CHUNK_SIZE) {
        let msg = undefined;
        if (extended) msg = "Grenzen dynamisch erweitert...";
        if (onProgress) onProgress(chunk, { bestParams, minError, message: msg });
        chunk = [];
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // Final flush
    if (chunk.length > 0 && onProgress) {
      onProgress(chunk, { bestParams, minError });
    }

    return { bestParams, minError };
  }
}
