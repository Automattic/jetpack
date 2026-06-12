import type { WizardInput } from './types.ts';

/**
 * Debounced background tailor call while the user types in the wizard.
 * Stream F replaces this body; until then it is a no-op hook.
 *
 * @param state - The partial wizard input collected so far.
 */
export function usePrewarm( state: Partial< WizardInput > ): void {} // eslint-disable-line @typescript-eslint/no-unused-vars
