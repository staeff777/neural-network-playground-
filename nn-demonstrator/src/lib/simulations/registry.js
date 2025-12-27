import { config as physicsConfig } from './physics/index';
import { config as spamConfig } from './spam/index';

const registry = {
  [physicsConfig.id]: physicsConfig,
  [spamConfig.id]: spamConfig,
};

export function getSimulationConfig(id) {
  return registry[id] || registry['physics']; // Default to physics
}
