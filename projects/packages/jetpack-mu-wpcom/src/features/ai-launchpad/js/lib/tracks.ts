import type { TailorSource } from './types.ts';

/*
 * Typed no-ops; Stream G replaces the bodies with real recordTracksEvent
 * calls that add launchpad_variant: 'ai' to every event. Streams D and E
 * call these through the signatures below — the signatures are the contract.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */

export function trackViewed(): void {}

export function trackWizardCompleted(): void {}

export function trackAiResponseReceived( props: { duration_ms: number; source: TailorSource } ): void {}

export function trackTaskClicked( props: { task_id: string } ): void {}

export function trackLaunched(): void {}
