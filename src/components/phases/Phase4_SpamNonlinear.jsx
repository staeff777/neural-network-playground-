import { BaseSpamAdvancedPhase } from './BaseSpamAdvancedPhase';

export function SpamNonlinearPhase({ collapseModelArchitectureByDefault } = {}) {
    return (
        <BaseSpamAdvancedPhase
            simId="single_layer_nonlinear"
            collapseModelArchitectureByDefault={collapseModelArchitectureByDefault}
        />
    );
}
