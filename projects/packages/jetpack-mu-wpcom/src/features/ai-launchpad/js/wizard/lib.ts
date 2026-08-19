import type { GoalSlug, WizardInput } from '../lib/types.ts';

export const GOAL_SLUGS: GoalSlug[] = [
	'write',
	'build',
	'sell',
	'newsletter',
	'educate',
	'portfolio',
];

export const TOTAL_STEPS = 2;

export type WizardStep = 0 | 1;

export interface WizardState {
	goal: GoalSlug | null;
	siteName: string;
	intent: string;
	locale: string;
}

/**
 * Whether the user may advance from the given step. Goal is the only required
 * field; the details step is always free to submit.
 *
 * @param step  - The current step index.
 * @param state - The collected wizard state.
 * @return True when the primary action is enabled.
 */
export function canContinue( step: WizardStep, state: WizardState ): boolean {
	return step === 0 ? state.goal !== null : true;
}

/**
 * Whether the given step is the final one.
 *
 * @param step - The current step index.
 * @return True on the last step.
 */
export function isLastStep( step: WizardStep ): boolean {
	return step === TOTAL_STEPS - 1;
}

/**
 * The partial wizard input shared with the prewarm hook while the user types.
 * Mirrors the REST PUT body so the prewarmed call and the persisted payload
 * agree.
 *
 * @param state - The collected wizard state.
 * @return The partial wizard input.
 */
export function toPrewarmInput( state: WizardState ): Partial< WizardInput > {
	return {
		goal: state.goal ?? undefined,
		site_name: state.siteName,
		description: state.intent,
		locale: state.locale,
	};
}

/**
 * The body sent to `PUT /wpcom/v2/ai-launchpad/wizard` on Finish. The REST
 * endpoint requires a non-null goal, so callers gate this behind a selected
 * goal.
 *
 * @param goal  - The selected goal.
 * @param state - The collected wizard state.
 * @return The request body.
 */
export function buildWizardPayload( goal: GoalSlug, state: WizardState ): WizardInput {
	return {
		goal,
		site_name: state.siteName,
		description: state.intent,
		locale: state.locale,
	};
}

/**
 * Pick one example placeholder from a goal's variants. Extracted so the
 * rotating behavior is unit-testable without rendering. The default uses
 * `Math.random`; tests pass a deterministic picker.
 *
 * @param variants - The non-empty list of example placeholders.
 * @param pick     - Returns a fraction in [0, 1); defaults to Math.random.
 * @return One placeholder from the list.
 */
export function pickPlaceholder( variants: string[], pick: () => number = Math.random ): string {
	return variants[ Math.floor( pick() * variants.length ) ];
}
