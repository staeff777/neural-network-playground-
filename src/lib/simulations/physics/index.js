
import { GroundTruth } from './ground_truth';
import { SimpleNeuralNet } from './model';
import { PhysicsCanvas } from '../../../components/simulations/PhysicsCanvas';

export const config = {
  id: 'linear_regression',
  title: 'Phase 1: Linear Regression',
  description: 'A simple neuron learns the relationship between time and position. This corresponds to a linear regression.',
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
    maxSteps: 2000,
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
