# Exported Components

The following components are exported from this library and can be imported directly:

- **PhysicsPhase** (Phase 1)
- **SpamPhase** (Phase 2)
- **SpamAdvancedPhase** (Phase 3)
- **SpamNonlinearPhase** (Phase 4)
- **SpamHiddenPhase** (Phase 5)
- **render** (Preact render helper)
- **h** (Preact hyperscript helper)

## Usage Example

```js
import { PhysicsPhase, SpamPhase } from 'nn-demonstrator';
import 'nn-demonstrator/nn-demonstrator.css'; 
```

## Model Architecture Collapse

The “Model Architecture” box can start collapsed (hiding internal details like connections/weights/hidden layers).
This is configured per phase/simulation via the simulation config field:

- `collapseModelArchitectureByDefault: true | false`

Defaults:
- Phase 1: `true`
- Phases 2–5: `false`

### Overriding When Using The Library

Each exported Phase component accepts an optional `collapseModelArchitectureByDefault` prop to override the default for that phase instance:

```js
import { PhysicsPhase, SpamHiddenPhase, render, h } from 'nn-demonstrator';
import 'nn-demonstrator/nn-demonstrator.css';

render(
  h('div', {}, [
    h(PhysicsPhase, { collapseModelArchitectureByDefault: false }),
    h(SpamHiddenPhase, { collapseModelArchitectureByDefault: true }),
  ]),
  document.getElementById('slide-container')
);
```

## Vanilla HTML/JS Usage

You can use these components directly in a browser without a build step.
The library bundles the rendering engine (Preact) and exports `h` and `render` helpers.

```html
<link rel="stylesheet" href="./dist-lib/nn-demonstrator.css">
<div id="slide-container"></div>

<script type="module">
  import { PhysicsPhase, render, h } from './dist-lib/nn-demonstrator.js';

  // Mount the component to the div
  render(h(PhysicsPhase), document.getElementById('slide-container'));
</script>
```
