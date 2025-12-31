# Agent Instructions

## Project Overview
This is a Neural Network Demonstrator web application built with Preact and Vite. It visualizes the difference between "Ground Truth" (physical/mathematical laws) and a simple Neural Network model attempting to learn those laws.

## Simulation Architecture

The application is designed to support multiple simulation types (e.g., Linear Regression Physics, Logistic Regression Spam Filter).

### Directory Structure
*   `src/lib/simulations/`: Contains the simulation modules.
*   `src/lib/simulations/registry.js`: Central point to register new simulations.

### Adding a New Simulation
1.  Create a new folder in `src/lib/simulations/{id}`.
2.  Implement the following files:
    *   `model.js`: The neural network model (must implement `predict(input)`, `setWeight(w)`, `setBias(b)`).
    *   `ground_truth.js`: The logic generating the "true" values.
    *   `index.js`: The configuration file.
3.  Register the config in `src/lib/simulations/registry.js`.

### Configuration Object (`index.js`)
The configuration object must export the following schema:

```javascript
export const config = {
  id: 'unique_id',
  title: 'Display Title',
  description: 'Short description of the task',

  // Classes
  Model: YourModelClass,
  GroundTruth: YourGroundTruthClass,
  CanvasComponent: YourPreactComponent, // Visualization component

  // Parameters
  defaultParams: { weight: 0, bias: 0 },
  groundTruthDefaults: [param1, param2], // Arguments for GroundTruth constructor

  // Data Generation
  generateData: (groundTruthInstance) => {
    // Return array of { input, target }
  },

  // Training Limits
  trainingConfig: {
    weightRange: { min, max, step },
    biasRange: { min, max, step }
  },

  // Visualization Labels
  networkViz: {
    formula: 'string', // e.g., 'y = w*x + b'
    inputLabel: 'string',
    outputLabel: 'string',
    biasLabel: 'string'
  },

  // Optional Lifecycle Hooks
  getInput: (time) => val, // Transform simulation time to model input (default: identity)
  isFinished: (time) => boolean // Return true to auto-stop simulation loop
};
```

### Timing & Loop
The main application loop in `App.jsx` uses `performance.now()` to calculate a time delta (`dt`).
*   `time` advances in seconds (scaled by a factor, currently 3.0x for Physics compatibility).
*   Simulations requiring "Single Run" behavior (like Spam Filter) should implement `isFinished(time)` to stop the loop automatically.
