import type { GoalSlug, TailoredInferred, TailorSource, TrackEventProps } from './types.ts';

/** The Tracks bootstrap the Site Setup page sets before this module runs. */
interface TracksBootstrap {
	// The AI standard props, resolved server-side. See wpcom_ai_launchpad_standard_props().
	props: TrackEventProps;
	// The Tracks identity to push as identifyUser, on Atomic only — null on Simple, where
	// wpcom's stats.php has already pushed it.
	identity: { userid: number; username: string } | null;
}

declare global {
	interface Window {
		// Widened past [ 'recordEvent', … ]: the queue also carries identifyUser pushes.
		_tkq: unknown[][];
		wpcomAiLaunchpadTracks?: TracksBootstrap;
	}
}

/** The screens the Site Setup page can open on. */
export type ViewedStep = 'goal' | 'site_details' | 'launchpad';

/** The wizard steps that can be completed or skipped. */
export type WizardStepName = 'goal' | 'site_details';

/**
 * Context merged into every event, so each one can be analyzed against the
 * site's goal, inferred details, and rendered list without joins. Keys are null
 * until the corresponding data exists (e.g. everything is null during the
 * wizard funnel — tailoring hasn't run yet).
 */
export interface TracksContext {
	goal: string | null;
	niche: string | null;
	theme_category: string | null;
	vibe: string | null;
	audience: string | null;
	// JSON-stringified array of rendered task ids, in render order.
	rendered_list: string | null;
	// The goal the AI infers from the site name and description alone.
	inferred_goal: string | null;
	// Whether the rendered list came from the AI or the deterministic fallback, the same value
	// under the standard's name, and the id of the tailoring run that produced it. Null until a
	// tailor completes in this page load, so the server-resolved values in the bootstrap global
	// show through for a returning user.
	source: string | null;
	outcome: string | null;
	ai_session_id: string | null;
}

const EMPTY_CONTEXT: TracksContext = {
	goal: null,
	niche: null,
	theme_category: null,
	vibe: null,
	audience: null,
	rendered_list: null,
	inferred_goal: null,
	source: null,
	outcome: null,
	ai_session_id: null,
};

let context: TracksContext = { ...EMPTY_CONTEXT };

// wizard_completed means "landed on the tasklist for the FIRST time", so it can
// only ever fire once per page load — latched here so a re-render/remount of the
// firing component can never double-count the funnel's terminal step.
let wizardCompletedRecorded = false;

// identifyUser only has to be pushed once per page load, and only where nothing else does it.
let userIdentified = false;

/**
 * Merges values into the shared event context. Call as data becomes available
 * (initial read, goal confirmation, tailored output, rendered list).
 *
 * @param partial - The context keys to set.
 */
export function setTracksContext( partial: Partial< TracksContext > ): void {
	context = { ...context, ...partial };
}

/** Resets the shared context and the wizard-completed latch. For tests. */
export function resetTracksContext(): void {
	context = { ...EMPTY_CONTEXT };
	wizardCompletedRecorded = false;
	userIdentified = false;
}

/**
 * Derives context values from the AI output's inferred blob, coalescing missing
 * fields to null so stale values never survive a re-tailor.
 *
 * @param inferred - The inferred blob from the persisted AI output, if any.
 * @return The context slice to merge.
 */
export function contextFromInferred(
	inferred: TailoredInferred | null | undefined
): Partial< TracksContext > {
	return {
		goal: inferred?.goal ?? null,
		niche: inferred?.niche ?? null,
		theme_category: inferred?.theme_category ?? null,
		vibe: inferred?.vibe ?? null,
		audience: inferred?.audience ?? null,
		inferred_goal: inferred?.inferred_goal ?? null,
	};
}

/**
 * Derives the rendered-list context value from the rendered task ids.
 *
 * @param ids - The rendered task ids, in render order.
 * @return The context slice to merge.
 */
export function contextFromTaskIds( ids: string[] ): Partial< TracksContext > {
	return { rendered_list: JSON.stringify( ids ) };
}

/**
 * Derives the tailoring-scoped context from a completed tailor call, so every event fired
 * afterwards is attributable to that run and to whether the AI or the fallback produced it.
 *
 * `outcome` is redundant with `source` by construction. The AI property standard requires it
 * and cross-product dashboards group by it, so it is derived rather than carried separately.
 *
 * @param source      - Whether the output came from the AI or the deterministic fallback.
 * @param aiSessionId - The id minted for this tailoring run.
 * @return The context slice to merge.
 */
export function contextFromTailorResult(
	source: TailorSource,
	aiSessionId: string
): Partial< TracksContext > {
	return {
		source,
		outcome: 'ai' === source ? 'success' : 'error',
		// '' means crypto.randomUUID was unavailable, so no id was minted. Null rather than the
		// empty string: null is what record()'s filter drops, letting the bootstrap's
		// server-resolved value show through. The server never persisted the empty id either, so
		// both recorders then report 'none' rather than disagreeing.
		ai_session_id: '' !== aiSessionId ? aiSessionId : null,
	};
}

/**
 * Records a Tracks event with the standard props and the shared context merged in, so call
 * sites can't forget either. Null-valued context props are omitted: the Tracks pipeline would
 * otherwise record them as literal "null" strings. The standard props merge outside that
 * filter, and first, so `is_test: 'false'` survives and a call site still wins over both.
 *
 * @param eventName - The Tracks event name, already feature-prefixed.
 * @param props     - Event properties. No PII: task IDs are fine, free text is not.
 */
function record( eventName: string, props: TrackEventProps = {} ): void {
	const merged = Object.fromEntries(
		Object.entries( { ...context, ...props } ).filter( ( [ , value ] ) => value !== null )
	);
	window._tkq = window._tkq || [];
	identifyUser();
	window._tkq.push( [
		'recordEvent',
		eventName,
		{ ...( window.wpcomAiLaunchpadTracks?.props ?? {} ), ...merged },
	] );
}

/**
 * Pushes the Tracks identity once per page load, before the first event.
 *
 * Only Atomic supplies one: on Simple wpcom's stats.php has already identified the user for
 * every admin page load, and pushing a second time would be redundant.
 */
function identifyUser(): void {
	if ( userIdentified ) {
		return;
	}
	userIdentified = true;

	const identity = window.wpcomAiLaunchpadTracks?.identity;
	if ( identity ) {
		window._tkq.push( [ 'identifyUser', identity.userid, identity.username ] );
	}
}

/**
 * Records the page-view event, once per Site Setup page load.
 *
 * @param props      - The event properties.
 * @param props.step - The screen the page opened on.
 */
export function trackViewed( props: { step: ViewedStep } ): void {
	record( 'jetpack_ai_launchpad_viewed', props );
}

/**
 * Records a goal-card click (fires on every click, including reselection).
 *
 * @param props              - The event properties.
 * @param props.goal_clicked - The goal card the user clicked.
 */
export function trackWizardGoalClicked( props: { goal_clicked: GoalSlug } ): void {
	record( 'jetpack_ai_launchpad_wizard_goal_clicked', props );
}

/**
 * Records a wizard step being completed (Continue on the goals step, Finish on
 * the site-details step).
 *
 * @param props      - The event properties.
 * @param props.step - The completed step.
 */
export function trackWizardStepCompleted( props: { step: WizardStepName } ): void {
	record( 'jetpack_ai_launchpad_wizard_step_completed', props );
}

/**
 * Records a wizard step being skipped.
 *
 * @param props      - The event properties.
 * @param props.step - The step the user skipped from.
 */
export function trackWizardStepSkipped( props: { step: WizardStepName } ): void {
	record( 'jetpack_ai_launchpad_wizard_step_skipped', props );
}

/**
 * Records a Back click in the wizard.
 *
 * @param props      - The event properties.
 * @param props.step - The step the user clicked Back from.
 */
export function trackWizardBackClicked( props: { step: WizardStepName } ): void {
	record( 'jetpack_ai_launchpad_wizard_back_clicked', props );
}

/**
 * Records that the user modified a site-details field before completing the
 * step (compared against the pre-filled value; one event per changed field).
 *
 * @param props       - The event properties.
 * @param props.field - The field the user changed.
 */
export function trackWizardSiteDetailsChanged( props: { field: 'title' | 'description' } ): void {
	record( 'jetpack_ai_launchpad_wizard_site_details_changed', props );
}

/**
 * Records the wizard-completed event: the user finishes the wizard and lands on
 * the tasklist for the first time. Latched — repeat calls in the same page load
 * record nothing.
 */
export function trackWizardCompleted(): void {
	if ( wizardCompletedRecorded ) {
		return;
	}
	wizardCompletedRecorded = true;
	record( 'jetpack_ai_launchpad_wizard_completed' );
}

/** A task's state at click time: skipped wins over the coerced completed flag. */
export type TaskStatus = 'completed' | 'skipped' | 'to_do';

/**
 * Records a user click on a collapsed task (a to-do card expanding, or a
 * completed/skipped card, which cannot expand — surfacing users who try to
 * reopen them). Collapsing the open card records nothing; auto-expansion never
 * fires this.
 *
 * @param props             - The event properties.
 * @param props.task_id     - The id of the clicked task.
 * @param props.task_status - The task's state at click time.
 */
export function trackTaskClicked( props: { task_id: string; task_status: TaskStatus } ): void {
	record( 'jetpack_ai_launchpad_task_clicked', props );
}

/**
 * Records a click on a task's primary CTA (incl. "Mark as complete").
 *
 * @param props         - The event properties.
 * @param props.task_id - The id of the task whose CTA was clicked.
 */
export function trackTaskCtaClicked( props: { task_id: string } ): void {
	record( 'jetpack_ai_launchpad_task_cta_clicked', props );
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
