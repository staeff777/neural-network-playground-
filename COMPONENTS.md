# Exported Components

The following components are exported from this library and can be imported directly:

- **PhysicsPhase** (Phase 1)
- **SpamPhase** (Phase 2)
- **SpamAdvancedPhase** (Phase 3)
- **SpamNonlinearPhase** (Phase 4)
- **SpamHiddenPhase** (Phase 5)
- **setPlaygroundOptions** (global configuration)
- **getPlaygroundOptions** (read current configuration)
- **render** (Preact render helper)
- **h** (Preact hyperscript helper)

## Usage Example

```js
import { PhysicsPhase, SpamPhase } from 'nn-demonstrator';
import 'nn-demonstrator/nn-demonstrator.css'; 
```

## Global Options

You can configure global library behavior via `setPlaygroundOptions(...)`.

### `collapseModelArchitectureByDefault`

When set to `true`, the “Neural Model Architecture” box starts collapsed in both visualizations:
- Only the outer box and the input/output circles (with label + value) are visible
- Clicking the box toggles showing the full details (connections, weights/params, activations, hidden layers, etc.)

```js
import { setPlaygroundOptions, PhysicsPhase, render, h } from 'nn-demonstrator';
import 'nn-demonstrator/nn-demonstrator.css';

setPlaygroundOptions({ collapseModelArchitectureByDefault: true });
render(h(PhysicsPhase), document.getElementById('slide-container'));
```

## Vanilla HTML/JS Usage

You can use these components directly in a browser without a build step.
The library bundles the rendering engine (Preact) and exports `h` and `render` helpers.

```html
<link rel="stylesheet" href="./dist-lib/nn-demonstrator.css">
<div id="slide-container"></div>

<script type="module">
  import { PhysicsPhase, render, h, setPlaygroundOptions } from './dist-lib/nn-demonstrator.js';

  // Optional: start with Model Architecture collapsed (click box to expand)
  setPlaygroundOptions({ collapseModelArchitectureByDefault: true });

  // Mount the component to the div
  render(h(PhysicsPhase), document.getElementById('slide-container'));
</script>
```
