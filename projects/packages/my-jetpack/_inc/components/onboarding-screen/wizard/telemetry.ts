import { useCallback, useMemo } from 'react';
import useAnalytics from '../../../hooks/use-analytics';

/*
 * Tracks silently drops any name that misses `Jetpack_Tracks_Event::EVENT_NAME_REGEX`.
 * Written out in full, not assembled, so a search finds each one.
 */
export const WIZARD_EVENTS = {
	stepView: 'jetpack_my_jetpack_onboarding_wizard_step_view',
	siteTypeSelect: 'jetpack_my_jetpack_onboarding_wizard_site_type_select',
	siteTypeDetail: 'jetpack_my_jetpack_onboarding_wizard_site_type_detail',
	moduleToggle: 'jetpack_my_jetpack_onboarding_wizard_module_toggle',
	stepComplete: 'jetpack_my_jetpack_onboarding_wizard_step_complete',
	applyResult: 'jetpack_my_jetpack_onboarding_wizard_apply_result',
	complete: 'jetpack_my_jetpack_onboarding_wizard_complete',
	skip: 'jetpack_my_jetpack_onboarding_wizard_skip',
	// Shared with the single-screen flow, which `flow` tells apart.
	connectClick: 'jetpack_my_jetpack_onboarding_click',
	// The wizard's own until the connection package records registration failures (CONNECT-502).
	connectError: 'jetpack_my_jetpack_onboarding_connect_error',
} as const;

const FLOW_ID_KEY = 'jetpack-onboarding-flow-id';

/**
 * An id for one run through the wizard.
 *
 * In session storage, so a run that leaves for WordPress.com to connect keeps it.
 *
 * @return The id, or 'none' where storage cannot be reached.
 */
function flowId(): string {
	try {
		const held = window.sessionStorage.getItem( FLOW_ID_KEY );

		if ( held ) {
			return held;
		}

		const made = makeId();
		window.sessionStorage.setItem( FLOW_ID_KEY, made );

		return made;
	} catch {
		// Private browsing and blocked site data throw. A run with no id still reports;
		// it just cannot be stitched to its other half, which beats reporting nothing.
		return 'none';
	}
}

/**
 * A random id. `randomUUID()` exists only in secure contexts, and wp-admin can be plain HTTP.
 *
 * @return The id.
 */
function makeId(): string {
	if ( typeof window.crypto.randomUUID === 'function' ) {
		return window.crypto.randomUUID();
	}

	return Array.from( window.crypto.getRandomValues( new Uint8Array( 16 ) ), byte =>
		byte.toString( 16 ).padStart( 2, '0' )
	).join( '' );
}

/**
 * End this run's id, so the next run in the same tab gets its own.
 */
export function forgetFlowId(): void {
	try {
		window.sessionStorage.removeItem( FLOW_ID_KEY );
	} catch {
		// Nothing was stored where storage is blocked.
	}
}

/**
 * How long the free text was, in buckets.
 *
 * The words never leave the browser: it is the one field that could carry a name or an address.
 *
 * @param text - What was typed.
 * @return A bucket name, never the text.
 */
export function lengthBucket( text: string ): string {
	const length = text.trim().length;

	if ( length === 0 ) {
		return 'empty';
	}

	if ( length <= 20 ) {
		return 'short';
	}

	return length <= 60 ? 'medium' : 'long';
}

type WizardEvent = ( typeof WIZARD_EVENTS )[ keyof typeof WIZARD_EVENTS ];
type EventProperties = Record< string, string | number | boolean >;

/**
 * Reports one run through the wizard, tagging every event with the run's id and the step's slug.
 *
 * The slug, not the index, because a connected site starts at the second step.
 * Nothing is sent before the terms are agreed (`Tracking::should_enable_tracking`).
 *
 * @param stepId - The slug of the step being reported on.
 * @return A recorder bound to this step.
 */
export function useWizardTracks( stepId: string ) {
	const { recordEvent } = useAnalytics();

	const flow = useMemo( () => flowId(), [] );

	return useCallback(
		( event: WizardEvent, properties: EventProperties = {} ) => {
			recordEvent( event, {
				flow_id: flow,
				step: stepId,
				...properties,
			} );
		},
		[ recordEvent, flow, stepId ]
	);
}
