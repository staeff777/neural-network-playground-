import { BaseSpamAdvancedPhase } from './BaseSpamAdvancedPhase';

export function SpamAdvancedPhase() {
    return <BaseSpamAdvancedPhase simId="spam_advanced" />;
}

export function SpamNonlinearPhase() {
    return <BaseSpamAdvancedPhase simId="spam_nonlinear" />;
}

export function SpamHiddenPhase() {
    return <BaseSpamAdvancedPhase simId="spam_hidden" />;
}
