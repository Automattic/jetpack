/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_ONBOARDING_KEY, DASHBOARD_PREFERENCES_SCOPE } from './constants';
import { useTrackEvent } from './use-track-event';

export type OnboardingPhase = 'closed' | 'modal' | 'tour';

export type OnboardingOptions = {
	/** Whether the reader is on the surface the journey introduces; nothing opens until then. */
	enabled: boolean;

	/** Tour steps after the modal. Zero finishes the journey at Get started. */
	stepCount?: number;
};

export type Onboarding = {
	phase: OnboardingPhase;

	/** Zero-based tour step, meaningful while the phase is `tour`. */
	step: number;

	/** Get started: into the tour, or done when there are no steps. */
	start: () => void;

	/** Continue or Finish on a tour step. */
	next: () => void;

	/** The reader closed the modal or the tour: done, and not shown again. */
	dismiss: () => void;
};

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => string | undefined;
};

type PreferencesActions = {
	set: ( scope: string, key: string, value: string ) => Promise< void > | void;
};

// Once per page load, not per mount: the dashboard stage remounts on the way
// back from a report, before the persisted preference has necessarily landed.
let hasOpenedThisLoad = false;

/**
 * Reset the once-per-load latch. Test-only.
 */
export function resetOnboardingForTesting() {
	hasOpenedThisLoad = false;
}

/**
 * Owns the onboarding journey: modal, then tour, then done. It opens once per
 * reader per site the first time the surface is ready, marking the preference
 * as it opens so the journey never comes back, and records each move to Tracks.
 *
 * @param options           - Journey options.
 * @param options.enabled   - Whether the surface the journey introduces is ready.
 * @param options.stepCount - Tour steps after the modal; zero ends the journey at Get started.
 * @return The current phase and step, and the transitions the UI can trigger.
 */
export function useOnboarding( { enabled, stepCount = 0 }: OnboardingOptions ): Onboarding {
	const trackEvent = useTrackEvent();

	const completedAt = useSelect(
		select =>
			( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
				DASHBOARD_PREFERENCES_SCOPE,
				DASHBOARD_ONBOARDING_KEY
			),
		[]
	);
	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const [ phase, setPhase ] = useState< OnboardingPhase >( 'closed' );
	const [ step, setStep ] = useState( 0 );

	useEffect( () => {
		if ( ! enabled || hasOpenedThisLoad || completedAt ) {
			return;
		}

		hasOpenedThisLoad = true;
		setPhase( 'modal' );
		void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_ONBOARDING_KEY, new Date().toISOString() );
		trackEvent( 'jetpack_premium_analytics_onboarding_view' );
	}, [ enabled, completedAt, set, trackEvent ] );

	const complete = useCallback( () => {
		setPhase( 'closed' );
		setStep( 0 );
	}, [] );

	const start = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_onboarding_start' );

		if ( stepCount === 0 ) {
			trackEvent( 'jetpack_premium_analytics_onboarding_finish' );
			complete();
			return;
		}

		setPhase( 'tour' );
		setStep( 0 );
		trackEvent( 'jetpack_premium_analytics_onboarding_step_view', { step: 1 } );
	}, [ complete, stepCount, trackEvent ] );

	const next = useCallback( () => {
		if ( step + 1 >= stepCount ) {
			trackEvent( 'jetpack_premium_analytics_onboarding_finish' );
			complete();
			return;
		}

		setStep( step + 1 );
		trackEvent( 'jetpack_premium_analytics_onboarding_step_view', { step: step + 2 } );
	}, [ complete, step, stepCount, trackEvent ] );

	const dismiss = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_onboarding_dismiss', {
			phase,
			step: phase === 'tour' ? step + 1 : 0,
		} );
		complete();
	}, [ complete, phase, step, trackEvent ] );

	return { phase, step, start, next, dismiss };
}
