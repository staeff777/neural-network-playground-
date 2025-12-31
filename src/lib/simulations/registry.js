import { config as physicsConfig } from './physics/index';
import { config as spamConfig } from './spam/index';
import { config as spamAdvancedConfig } from './spam_advanced/index';

const registry = {
  [physicsConfig.id]: physicsConfig,
  [spamConfig.id]: spamConfig,
  [spamAdvancedConfig.id]: spamAdvancedConfig,
};

export function getSimulationConfig(id) {
  return registry[id] || registry['physics']; // Default to physics
}
