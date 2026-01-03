import { GroundTruth } from './ground_truth';
import { SimpleNeuralNet } from './model';
import { PhysicsCanvas } from '../../../components/simulations/PhysicsCanvas';

export const config = {
  id: 'physics',
  title: 'Phase 1: Lineare Regression (Exhaustive Search 2D)',
  description: 'Physiksimulation: Weg-Zeit-Gesetz (s = v*t + s0)',
  Model: SimpleNeuralNet,
  GroundTruth: GroundTruth,
  CanvasComponent: PhysicsCanvas,
  defaultParams: {
    weight: 0,
    bias: 0,
  },
  groundTruthDefaults: [30, 50],

  // Input for the model is simply time
  getInput: (time) => time,

  generateData: (groundTruth) => {
    const times = Array.from({ length: 20 }, (_, i) => i * 0.5);
    return times.map(t => ({
      input: t,
      target: groundTruth.getPosition(t)
    }));
  },

  trainingConfig: {
    params: [
      { name: 'weight', min: 0, max: 60, step: 1 },
      { name: 'bias', min: 0, max: 100, step: 2 }
    ]
  },

  networkViz: {
    formula: 'pos = w * t + b',
    inputLabel: 'Zeit (t)',
    outputLabel: 'Pos (m)',
    biasLabel: 'b'
  }
};
