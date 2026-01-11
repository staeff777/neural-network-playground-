import { BaseSpamAdvancedPhase } from './BaseSpamAdvancedPhase';

export function SpamHiddenPhase({ collapseModelArchitectureByDefault } = {}) {
    return (
        <BaseSpamAdvancedPhase
            simId="double_layer_nonlinear"
            collapseModelArchitectureByDefault={collapseModelArchitectureByDefault}
        />
    );
}
