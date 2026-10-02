import { useCallback, useMemo } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import type { WizardStep } from './lib';

/*
 * Every name here has to match Tracks' own
 * `Jetpack_Tracks_Event::EVENT_NAME_REGEX`, `/^(([a-z0-9]+)_){2}([a-z0-9_]+)$/`
 * — two lowercase segments, then the rest. A name that misses it is dropped
 * server side with nothing said, so they are written out in full rather than
 * assembled from parts a search could not find.
 */
export const WIZARD_EVENTS = {
	stepView: 'jetpack_myjetpack_onboarding_wizard_step_view',
	siteTypeSelect: 'jetpack_myjetpack_onboarding_wizard_site_type_select',
	siteTypeDetail: 'jetpack_myjetpack_onboarding_wizard_site_type_detail',
	moduleToggle: 'jetpack_myjetpack_onboarding_wizard_module_toggle',
	stepComplete: 'jetpack_myjetpack_onboarding_wizard_step_complete',
	applyResult: 'jetpack_myjetpack_onboarding_wizard_apply_result',
	complete: 'jetpack_myjetpack_onboarding_wizard_complete',
	skip: 'jetpack_myjetpack_onboarding_wizard_skip',
	connectClick: 'jetpack_myjetpack_onboarding_wizard_connect_click',
	connectSuccess: 'jetpack_myjetpack_onboarding_wizard_connect_success',
	connectError: 'jetpack_myjetpack_onboarding_wizard_connect_error',
} as const;

const FLOW_ID_KEY = 'jetpack-onboarding-flow-id';

/**
 * An id for one run through the wizard.
 *
 * Session storage, because connecting leaves wp-admin for WordPress.com and
 * comes back to a fresh page: without this the two halves of a run are two
 * unrelated sets of events and the funnel cannot be joined up.
 *
 * @return The id, or 'none' where storage cannot be reached.
 */
function flowId(): string {
	try {
		const held = window.sessionStorage.getItem( FLOW_ID_KEY );

		if ( held ) {
			return held;
		}

		const made = window.crypto.randomUUID();
		window.sessionStorage.setItem( FLOW_ID_KEY, made );

		return made;
	} catch {
		// Private browsing, blocked site data, and an insecure origin all throw.
		// A run with no id still reports; it just cannot be stitched to its other
		// half, which is better than reporting nothing.
		return 'none';
	}
}

/**
 * How long the free text was, in buckets.
 *
 * The words themselves never leave the browser. What someone types about their
 * own site is theirs, it is the one field here that could carry a name or an
 * address, and no question we have needs the string to answer it — whether the
 * field gets used at all, and roughly how much people write in it, does.
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
 * Reports one run through the wizard.
 *
 * Every event carries the run's id and the step it happened on, so the funnel
 * is one query rather than a join across event names. The step is its slug and
 * never its index: a connected site starts at the second step, so the index of
 * a given screen is not the same number for everyone.
 *
 * Nothing here fires on a site that has neither agreed to the terms nor
 * connected a user. Tracks' own script is not on the page until one of those is
 * true (`Tracking::should_enable_tracking`), so the start screen's events are
 * queued into an array nothing drains. That is the gate working, not a bug, and
 * it is why the funnel starts where it does.
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

/**
 * The slug of a step, for the `step` property.
 *
 * @param steps - The steps, in order.
 * @param step  - Which one.
 * @return Its id, or 'unknown' for an index the steps do not have.
 */
export function stepSlug( steps: Array< { id: string } >, step: WizardStep ): string {
	return steps[ step ]?.id ?? 'unknown';
}
