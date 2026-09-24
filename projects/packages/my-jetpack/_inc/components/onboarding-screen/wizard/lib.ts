import { __ } from '@wordpress/i18n';
import {
	chartBar,
	cloud,
	megaphone,
	people,
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
}

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

/**
 * The route into setup the start screen recorded. Stage 2 turns it into a
 * connection; here it is only remembered.
 */
export const START_INTENT = {
	// Create a WordPress.com account as part of setup.
	create: 'new',
	// Sign in to an account that already exists and connect this site to it.
	signIn: 'existing',
} as const;

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
			title: __( 'What is this site for?', 'jetpack-my-jetpack' ),
			description: __(
				'This step is still being built. Your answer is not saved yet, and nothing is set up from it.',
				'jetpack-my-jetpack'
			),
			options: [
				{
					value: 'business',
					label: __( 'A business or organization', 'jetpack-my-jetpack' ),
					description: __( 'Services, bookings, or a storefront.', 'jetpack-my-jetpack' ),
					icon: store,
				},
				{
					value: 'publication',
					label: __( 'A blog or publication', 'jetpack-my-jetpack' ),
					description: __( 'Regular writing for an audience.', 'jetpack-my-jetpack' ),
					icon: post,
				},
				{
					value: 'personal',
					label: __( 'A personal site', 'jetpack-my-jetpack' ),
					description: __( 'A portfolio, a project, or somewhere to start.', 'jetpack-my-jetpack' ),
					icon: people,
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
