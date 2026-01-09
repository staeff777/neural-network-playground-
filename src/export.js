import './lib.css';

export { PhysicsPhase } from './components/phases/Phase1_Physics';
export { SpamPhase } from './components/phases/Phase2_Spam';
export { SpamAdvancedPhase } from './components/phases/Phase3_SpamAdvanced';
export { SpamNonlinearPhase } from './components/phases/Phase4_SpamNonlinear';
export { SpamHiddenPhase } from './components/phases/Phase5_SpamHidden';

export { setPlaygroundOptions, getPlaygroundOptions } from './lib/options.js';

export { render, h } from 'preact';
