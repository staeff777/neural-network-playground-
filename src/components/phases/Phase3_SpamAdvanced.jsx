import { BaseSpamAdvancedPhase } from './BaseSpamAdvancedPhase';

export function SpamAdvancedPhase({ collapseModelArchitectureByDefault } = {}) {
    return (
        <BaseSpamAdvancedPhase
            simId="multiple_inputs"
            collapseModelArchitectureByDefault={collapseModelArchitectureByDefault}
        />
    );
}
