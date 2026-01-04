# Exported Components

The following components are exported from this library and can be imported directly:

- **PhysicsPhase** (Phase 1)
- **SpamPhase** (Phase 2)
- **SpamAdvancedPhase** (Phase 3)
- **SpamNonlinearPhase** (Phase 4)
- **SpamHiddenPhase** (Phase 5)

## Usage Example

```js
import { PhysicsPhase, SpamPhase } from 'nn-demonstrator';
import 'nn-demonstrator/nn-demonstrator.css'; 
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
