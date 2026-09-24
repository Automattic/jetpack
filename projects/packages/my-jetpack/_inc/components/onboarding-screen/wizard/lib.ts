import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import {
	chartBar,
	cloud,
	comment,
	image,
	megaphone,
	page,
	plus,
	post,
	postCommentsForm,
	shield,
	store,
	trendingUp,
} from '@wordpress/icons';

/**
 * One choice offered by a step.
 */
export interface WizardStepOption {
	value: string;
	label: string;
	// Not rendered by the hairline row, which is label-only; kept for stage 3.
	description: string;
	icon: typeof plus;
	// Opens a text field for an answer the list does not cover.
	freeText?: boolean;
}

/*
 * The site-type answer that opens a text field. What the user then types stays
 * on this screen: it is the one answer in the wizard that is not from a fixed
 * set, and free text must never reach Tracks.
 */
export const SITE_TYPE_OTHER = 'other';

/**
 * One row of the start screen's benefits list.
 */
export interface WizardBenefit {
	// Stable across reorders: the React key.
	id: string;
	text: string;
	icon: typeof plus;
}

/**
 * Which shape a step takes: the start screen, or a question with options.
 */
export type WizardStepKind = 'start' | 'question';

/**
 * A step, as the rail and the question column both read it.
 */
export interface WizardStepMeta {
	// Stable across reorders: the React key, and the analytics name stage 2 reports.
	id: string;
	// Which component the shell renders for this step.
	kind: WizardStepKind;
	// The rail's row: a short name, because the rail is narrower than the question.
	// The row's glyph is not stored here: it reports where the user is, not what
	// the step is about, so the rail derives it from the current step instead.
	label: string;
	// The question column's heading and standfirst.
	title: string;
	description: string;
	// A step with nothing to choose is free to leave.
	options: WizardStepOption[];
}

/*
 * What the connection records as the origin of this registration. Its own
 * value, not the single-screen takeover's 'jetpack-onboarding', so the two
 * flows stay separable in the connection funnel.
 */
export const CONNECTION_FROM = 'jetpack-onboarding-wizard';

/*
 * Where WordPress.com sends the user back to once they have authorized. Relative
 * to wp-admin, as every other connection consumer passes it. It carries no step:
 * the wizard works out where to resume from the connection itself.
 */
export const CONNECTION_RETURN_URL = 'admin.php?page=my-jetpack&step=onboarding';

/*
 * Reported when the failure carries neither a server code nor an error name.
 * A fixed slug, because this value is sent to Tracks and free text must not be.
 */
const UNKNOWN_CONNECTION_ERROR = 'unknown_error';

/**
 * The bounded code for a failed registration, safe to send to Tracks.
 *
 * Either the server's own `WP_Error` code or, when the request never got as far
 * as a parsed body, the name of the error class the API client threw
 * (`JsonParseError`, `Api404Error`, `FetchNetworkError`, and so on). Both are
 * fixed vocabularies. The error's `message` is deliberately not considered:
 * it interpolates the server's prose and can carry the site's own URL.
 *
 * @param error - The rejection from `handleRegisterSite`, or the stored error.
 * @return A slug from a fixed set, never free text.
 */
export function connectionErrorCode( error: unknown ): string {
	if ( ! error || typeof error !== 'object' ) {
		return UNKNOWN_CONNECTION_ERROR;
	}

	const { response, name } = error as { response?: { code?: unknown }; name?: unknown };

	if ( typeof response?.code === 'string' && response.code ) {
		return response.code;
	}

	return typeof name === 'string' && name ? name : UNKNOWN_CONNECTION_ERROR;
}

/**
 * The raw detail shown under the plain sentence a failure is reported with.
 *
 * Rendered only, and never sent anywhere: the message interpolates whatever the
 * server said, which is what support needs and what telemetry must not have.
 * Falls back to the code, so a failure that carried no message still says
 * something more specific than "it did not work".
 *
 * @param error - The rejection from `handleRegisterSite`, or the stored error.
 * @return The message, or the code when there is no message.
 */
export function connectionErrorDetail( error: unknown ): string {
	const message = ( error as { message?: unknown } | null | undefined )?.message;

	return typeof message === 'string' && message.trim()
		? message.trim()
		: connectionErrorCode( error );
}

export type WizardStep = 0 | 1 | 2 | 3;

// The WizardStep union has to be hand-written; the count is read off the steps.
export const TOTAL_STEPS = wizardSteps().length;

export interface WizardState {
	// The option chosen on each step, keyed by step index.
	choices: Partial< Record< WizardStep, string > >;
}

/**
 * The steps, in order. Placeholder content until stage 3 brings the real steps.
 *
 * @return One entry per step, translated at call time.
 */
export function wizardSteps(): WizardStepMeta[] {
	return [
		{
			id: 'start',
			kind: 'start',
			label: __( 'Connect', 'jetpack-my-jetpack' ),
			title: __( 'Start with Jetpack for free', 'jetpack-my-jetpack' ),
			description: __(
				'One plugin, and your site can do the things it usually takes five to do.',
				'jetpack-my-jetpack'
			),
			options: [],
		},
		{
			id: 'site-type',
			kind: 'question',
			label: __( 'Your site', 'jetpack-my-jetpack' ),
			title: __( "Tell us what you're building", 'jetpack-my-jetpack' ),
			/*
			 * The prototype's line here says the site is new and there is nothing to
			 * read yet, which is true of its own new-site scenario only. V1 asks every
			 * site the same question, so the reassurance it carries is what survives.
			 */
			description: __(
				'Pick the closest fit — you can change any of this later.',
				'jetpack-my-jetpack'
			),
			/*
			 * Slugs rather than the prototype's prose values. Its label and stored
			 * value disagree on the business row, and these go to Tracks.
			 */
			options: [
				{
					value: 'blog',
					label: __( 'A blog or publication', 'jetpack-my-jetpack' ),
					description: __( 'Regular writing for an audience.', 'jetpack-my-jetpack' ),
					icon: post,
				},
				{
					value: 'store',
					label: __( 'An online store', 'jetpack-my-jetpack' ),
					description: __( 'Selling products or taking orders.', 'jetpack-my-jetpack' ),
					icon: store,
				},
				{
					value: 'portfolio',
					label: __( 'A portfolio or personal site', 'jetpack-my-jetpack' ),
					description: __( 'Your work, a project, or somewhere to start.', 'jetpack-my-jetpack' ),
					icon: image,
				},
				{
					value: 'business',
					label: __( 'A business or brochure site', 'jetpack-my-jetpack' ),
					description: __(
						'Services, opening hours, and how to get in touch.',
						'jetpack-my-jetpack'
					),
					icon: page,
				},
				{
					value: SITE_TYPE_OTHER,
					label: __( 'Something else…', 'jetpack-my-jetpack' ),
					description: __( 'Tell us in your own words.', 'jetpack-my-jetpack' ),
					icon: comment,
					freeText: true,
				},
			],
		},
		{
			id: 'features',
			kind: 'question',
			label: __( 'What you need', 'jetpack-my-jetpack' ),
			title: __( 'The feature list is not decided yet', 'jetpack-my-jetpack' ),
			description: __(
				'These three are stand-ins for it. Picking one turns nothing on and saves nothing.',
				'jetpack-my-jetpack'
			),
			options: [
				{
					value: 'protect',
					label: __( 'Example: keeping the site safe', 'jetpack-my-jetpack' ),
					description: __( 'A stand-in. Nothing is turned on.', 'jetpack-my-jetpack' ),
					icon: shield,
				},
				{
					value: 'grow',
					label: __( 'Example: reaching more people', 'jetpack-my-jetpack' ),
					description: __( 'A stand-in. Nothing is turned on.', 'jetpack-my-jetpack' ),
					icon: megaphone,
				},
				{
					value: 'speed',
					label: __( 'Example: making the site faster', 'jetpack-my-jetpack' ),
					description: __( 'A stand-in. Nothing is turned on.', 'jetpack-my-jetpack' ),
					icon: trendingUp,
				},
			],
		},
		{
			id: 'done',
			kind: 'question',
			label: __( 'Finish', 'jetpack-my-jetpack' ),
			title: __( 'The rest of this is not built yet', 'jetpack-my-jetpack' ),
			description: __(
				'Nothing has been turned on and nothing is saved. This step exists so the end of the flow can be judged alongside the rest.',
				'jetpack-my-jetpack'
			),
			options: [],
		},
	];
}

/**
 * The start screen's benefits, in order.
 *
 * Every feature named here is in the free tier. VideoPress and Backup are
 * deliberately absent: both are paid, and this screen cannot promise what sits
 * behind a plan. Do not add a row without checking its tier.
 *
 * @return One entry per row, translated at call time.
 */
export function startBenefits(): WizardBenefit[] {
	return [
		{
			id: 'secure',
			icon: shield,
			text: __( 'Spam, brute force and downtime, handled for you', 'jetpack-my-jetpack' ),
		},
		{
			id: 'fast',
			icon: cloud,
			text: __( 'Pages and images served fast from a global network', 'jetpack-my-jetpack' ),
		},
		{
			id: 'grow',
			icon: chartBar,
			text: __( 'Stats, SEO and social sharing, in one place', 'jetpack-my-jetpack' ),
		},
		{
			id: 'publish',
			icon: postCommentsForm,
			text: __( 'Forms, newsletters and podcasting, built in', 'jetpack-my-jetpack' ),
		},
	];
}

/**
 * How the user left setup.
 *
 * Finishing is recorded for the whole site, because the flow connects the site
 * and switches modules on; skipping is recorded against the person, so the first
 * admin to say "not now" does not answer for everyone else.
 */
export type SettleOutcome = 'completed' | 'skipped';

/**
 * Record that setup has been settled, so the takeover stops interrupting.
 *
 * The caller navigates whether or not this lands. A failed write means the user
 * is offered setup again on their next visit, which is a far better outcome than
 * holding them on a screen they have asked to leave.
 *
 * @param outcome - Whether they finished or skipped.
 * @return Resolves when the request has been answered.
 */
export function settleOnboarding( outcome: SettleOutcome ): Promise< unknown > {
	return apiFetch( {
		path: '/my-jetpack/v1/site/onboarding/settled',
		method: 'POST',
		data: { outcome },
	} );
}

/**
 * Which step the wizard opens on after the round trip to WordPress.com.
 *
 * Derived, not stored: a `step` parameter would be editable by the person it
 * describes. Keyed on the user connection rather than the site registration,
 * because a blog token with no owner is a half-finished connect step.
 *
 * @param isUserConnected - Whether this user holds a WordPress.com token.
 * @return The step index to open on.
 */
export function openingStep( isUserConnected: boolean ): WizardStep {
	return isUserConnected ? 1 : 0;
}

/**
 * Whether the user may advance from the given step.
 *
 * A step that offers options needs one picked; a step that offers none is free to leave.
 *
 * @param step  - The current step index.
 * @param state - The collected wizard state.
 * @return True when the primary action is enabled.
 */
export function canContinue( step: WizardStep, state: WizardState ): boolean {
	const meta = wizardSteps()[ step ];

	// The start screen asks nothing, and carries its own way forward.
	return meta.kind === 'start' || meta.options.length === 0 || state.choices[ step ] !== undefined;
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
