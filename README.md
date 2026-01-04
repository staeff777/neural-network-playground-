# Neural Network Demonstrator

A library of visualization components for demonstrating neural network concepts.

[Demo](https://staeff777.github.io/neural-network-playground-/main/)

## Remark

Mainly developed using gemini + manual adjustments where the agent got stuck.
(current todo: fix the network visualizations)

## Installation

You can install this package by linking it locally or installing from a tarball/registry if published.

```bash
npm install /path/to/neural-network-playground-
# or if published
npm install nn-demonstrator
```

## Usage

Import the phase components in your React/Preact application:

```jsx
import { PhysicsPhase, SpamPhase, SpamAdvancedPhase, SpamNonlinearPhase, SpamHiddenPhase } from 'nn-demonstrator';
import 'nn-demonstrator/dist-lib/nn-demonstrator.css';


function App() {
  return (
    <div>
      <h1>Neural Network Playground</h1>
      <PhysicsPhase />
      <SpamPhase />
    </div>
  );
}
```

### Components

- **PhysicsPhase**: Phase 1 - Basic physics simulation.
- **SpamPhase**: Phase 2 - Simple spam detection.
- **SpamAdvancedPhase**: Phase 3 - Advanced spam features.
- **SpamNonlinearPhase**: Phase 4 - Nonlinear decision boundaries.
- **SpamHiddenPhase**: Phase 5 - Neural network with hidden layers.

## Development

- `npm run dev`: Start the dev server for the standalone app. All components are testable.
- `npm run build:lib`: Build the component library to `dist-lib/`.
