import { config as physicsConfig } from './physics/index';
import { config as spamConfig } from './spam/index';
import { config as spamAdvancedConfig } from './spam_advanced/index';
import { config as spamHiddenConfig } from './spam_hidden/index';

const registry = {
  [physicsConfig.id]: physicsConfig,
  [spamConfig.id]: spamConfig,
  [spamAdvancedConfig.id]: spamAdvancedConfig,
  [spamHiddenConfig.id]: spamHiddenConfig,
};

export function getSimulationConfig(id) {
  return registry[id] || registry['physics']; // Default to physics
}
