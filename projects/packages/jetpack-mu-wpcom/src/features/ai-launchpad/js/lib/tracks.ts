import type { TailorSource, TrackEventProps } from './types.ts';

declare global {
	interface Window {
		_tkq: Array< [ 'recordEvent', string, TrackEventProps ] >;
	}
}

/**
 * Records a Tracks event with `launchpad_variant: 'ai'` baked in, so call sites
 * can't forget it.
 *
 * @param eventName - The Tracks event name, already feature-prefixed.
 * @param props     - Event properties. No PII: task IDs are fine, free text is not.
 */
function record( eventName: string, props: TrackEventProps = {} ): void {
	window._tkq = window._tkq || [];
	window._tkq.push( [ 'recordEvent', eventName, { ...props, launchpad_variant: 'ai' } ] );
}

/** Records the page-view event. */
export function trackViewed(): void {
	record( 'jetpack_ai_launchpad_viewed' );
}

/** Records the wizard-completed event. */
export function trackWizardCompleted(): void {
	record( 'jetpack_ai_launchpad_wizard_completed' );
}

/** Records the wizard-skipped event. */
export function trackWizardSkipped(): void {
	record( 'jetpack_ai_launchpad_wizard_skipped' );
}

/**
 * Records the AI-response-received event.
 *
 * @param props             - The event properties.
 * @param props.duration_ms - How long the AI response took, in milliseconds.
 * @param props.source      - Where the tailored output came from.
 */
export function trackAiResponseReceived( props: {
	duration_ms: number;
	source: TailorSource;
} ): void {
	record( 'jetpack_ai_launchpad_ai_response_received', props );
}

/**
 * Records the task-clicked event.
 *
 * @param props         - The event properties.
 * @param props.task_id - The id of the clicked task.
 */
export function trackTaskClicked( props: { task_id: string } ): void {
	record( 'jetpack_ai_launchpad_task_clicked', props );
}

/**
 * Records the task-skipped event.
 *
 * @param props         - The event properties.
 * @param props.task_id - The id of the skipped task.
 */
export function trackTaskSkipped( props: { task_id: string } ): void {
	record( 'jetpack_ai_launchpad_task_skipped', props );
}

/**
 * Records the launched event. Intentionally unwired in the MVP: launch completes
 * server-side, so there is no reliable client-side trigger here.
 */
export function trackLaunched(): void {
	record( 'jetpack_ai_launchpad_launched' );
}
