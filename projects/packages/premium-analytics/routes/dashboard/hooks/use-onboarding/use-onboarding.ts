/**
 * WordPress dependencies
 */
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import {
	DASHBOARD_ONBOARDING_KEY,
	DASHBOARD_PREFERENCES_SCOPE,
	DASHBOARD_STORE_ONBOARDING_KEY,
} from '../constants';
import type {
	OnboardingDismissReason,
	OnboardingWelcomeVariant,
} from '@jetpack-premium-analytics/ui';

export type OnboardingPhase = 'closed' | 'modal' | 'tour';

export type OnboardingFlow = OnboardingWelcomeVariant;

export type OnboardingOptions = {
	/** Whether the reader is on the surface the journey introduces; nothing opens until then. */
	enabled: boolean;

	/** Whether the dashboard shows the WooCommerce tab, which has its own introduction. */
	hasStoreSection?: boolean;

	/** Tour steps after the modal, per journey. Zero finishes the journey at Get started. */
	stepCounts?: Partial< Record< OnboardingFlow, number > >;
};

export type Onboarding = {
	phase: OnboardingPhase;

	/** The journey being shown, or the one about to open. */
	flow: OnboardingFlow;

	/** Zero-based tour step, meaningful while the phase is `tour`. */
	step: number;

	/** Get started: into the tour, or done when there are no steps. */
	start: () => void;

	/** Continue or Finish on a tour step. */
	next: () => void;

	/** The reader closed the modal or the tour, and how: done, and not shown again. */
	dismiss: ( reason?: OnboardingDismissReason ) => void;
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
 * The journey a reader has not been through yet: the new Stats, with the
 * WooCommerce tab when the dashboard shows it, or only the tab for a reader
 * who already knows the new Stats.
 *
 * @param statsSeen       - Whether the reader has been through the Stats journey.
 * @param storeSeen       - Whether the reader has been through the WooCommerce tab journey.
 * @param hasStoreSection - Whether the dashboard shows the WooCommerce tab.
 * @return The journey to show, or null when there is none left.
 */
function pendingFlow(
	statsSeen: boolean,
	storeSeen: boolean,
	hasStoreSection: boolean
): OnboardingFlow | null {
	if ( ! statsSeen ) {
		return hasStoreSection ? 'stats-and-store' : 'stats';
	}

	return hasStoreSection && ! storeSeen ? 'store' : null;
}

/**
 * Owns the onboarding journey: modal, then tour, then done. It opens once per
 * reader per site the first time the surface is ready, marking the preferences
 * as it opens so the journey never comes back, and records each move to Tracks.
 *
 * @param {OnboardingOptions} options - Journey options.
 * @return The current phase, journey and step, and the transitions the UI can trigger.
 */
export function useOnboarding( {
	enabled,
	hasStoreSection = false,
	stepCounts = {},
}: OnboardingOptions ): Onboarding {
	const trackEvent = useTrackEvent();

	const completedAt = useSelect(
		select =>
			( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
				DASHBOARD_PREFERENCES_SCOPE,
				DASHBOARD_ONBOARDING_KEY
			),
		[]
	);
	const storeCompletedAt = useSelect(
		select =>
			( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
				DASHBOARD_PREFERENCES_SCOPE,
				DASHBOARD_STORE_ONBOARDING_KEY
			),
		[]
	);
	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const pending = pendingFlow( !! completedAt, !! storeCompletedAt, hasStoreSection );

	const [ phase, setPhase ] = useState< OnboardingPhase >( 'closed' );
	const [ step, setStep ] = useState( 0 );
	// Held from the moment it opens: marking the preferences changes the pending journey.
	const [ openedFlow, setOpenedFlow ] = useState< OnboardingFlow | null >( null );
	const flow = openedFlow ?? pending ?? 'stats';
	const stepCount = stepCounts[ flow ] ?? 0;

	useEffect( () => {
		if ( ! enabled || hasOpenedThisLoad || ! pending ) {
			return;
		}

		hasOpenedThisLoad = true;
		setOpenedFlow( pending );
		setPhase( 'modal' );
		const now = new Date().toISOString();
		if ( pending !== 'store' ) {
			void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_ONBOARDING_KEY, now );
		}
		if ( hasStoreSection ) {
			void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_STORE_ONBOARDING_KEY, now );
		}
		trackEvent( 'jetpack_premium_analytics_onboarding_view', { flow: pending } );
	}, [ enabled, pending, hasStoreSection, set, trackEvent ] );

	const complete = useCallback( () => {
		setPhase( 'closed' );
		setStep( 0 );
	}, [] );

	const start = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_onboarding_start', { flow } );

		if ( stepCount === 0 ) {
			trackEvent( 'jetpack_premium_analytics_onboarding_finish', { flow } );
			complete();
			return;
		}

		setPhase( 'tour' );
		setStep( 0 );
		trackEvent( 'jetpack_premium_analytics_onboarding_step_view', { flow, step: 1 } );
	}, [ complete, flow, stepCount, trackEvent ] );

	const next = useCallback( () => {
		if ( step + 1 >= stepCount ) {
			trackEvent( 'jetpack_premium_analytics_onboarding_finish', { flow } );
			complete();
			return;
		}

		setStep( step + 1 );
		trackEvent( 'jetpack_premium_analytics_onboarding_step_view', { flow, step: step + 2 } );
	}, [ complete, flow, step, stepCount, trackEvent ] );

	const dismiss = useCallback(
		( reason: OnboardingDismissReason = 'other' ) => {
			trackEvent( 'jetpack_premium_analytics_onboarding_dismiss', {
				flow,
				phase,
				step: phase === 'tour' ? step + 1 : 0,
				reason,
			} );
			complete();
		},
		[ complete, flow, phase, step, trackEvent ]
	);

	/*
	 * The effect above opens the modal a commit after the surface is ready, and
	 * anything that hides behind the journey has to know it is coming rather
	 * than find out afterwards — a commit is long enough to paint and to count.
	 */
	const isOpening = enabled && ! hasOpenedThisLoad && !! pending;

	return { phase: isOpening ? 'modal' : phase, flow, step, start, next, dismiss };
}
