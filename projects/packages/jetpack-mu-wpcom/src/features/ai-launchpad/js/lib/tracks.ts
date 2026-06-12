import type { TailorSource } from './types.ts';

/*
 * Typed no-ops; Stream G replaces the bodies with real recordTracksEvent
 * calls that add launchpad_variant: 'ai' to every event. Streams D and E
 * call these through the signatures below — the signatures are the contract.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */

/** Stream G records the page-view event. */
export function trackViewed(): void {}

/** Stream G records the wizard-completed event. */
export function trackWizardCompleted(): void {}

/**
 * Stream G records the AI-response-received event.
 *
 * @param props             - The event properties.
 * @param props.duration_ms - How long the AI response took, in milliseconds.
 * @param props.source      - Where the tailored output came from.
 */
export function trackAiResponseReceived( props: {
	duration_ms: number;
	source: TailorSource;
} ): void {}

/**
 * Stream G records the task-clicked event.
 *
 * @param props         - The event properties.
 * @param props.task_id - The id of the clicked task.
 */
export function trackTaskClicked( props: { task_id: string } ): void {}

/** Stream G records the launched event. */
export function trackLaunched(): void {}
