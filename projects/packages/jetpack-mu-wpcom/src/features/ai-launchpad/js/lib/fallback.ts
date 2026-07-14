import type { GoalSlug, TailoredOutput, TailoredTask, WizardInput } from './types.ts';

/**
 * English subtitles for catalog task IDs. Unmapped IDs get a generic subtitle so
 * subtitle's minLength:1 is always satisfied.
 */
const TASK_SUBTITLES: Record< string, string > = {
	first_post_published: 'Write and publish your first post.',
	first_post_published_newsletter: 'Send your first newsletter to subscribers.',
	woo_products: 'Add your first product to the store.',
	woo_customize_store: 'Customize how your store looks.',
	set_up_payments: 'Set up a way to get paid.',
	add_10_email_subscribers: 'Grow your list to your first subscribers.',
	site_theme_selected: 'Pick a theme that fits your site.',
	add_about_page: 'Tell visitors who you are.',
	design_edited: 'Make the design your own.',
	complete_profile: 'Complete your public profile.',
	verify_email: 'Confirm your email address.',
	connect_social_media: 'Connect your social accounts.',
	drive_traffic: 'Help people find your site.',
	site_launched: 'Launch your site for the world to see.',
	blog_launched: 'Launch your blog for the world to see.',
	link_in_bio_launched: 'Launch your link-in-bio page.',
};

const GENERIC_SUBTITLE = 'Get this set up.';

/**
 * Per-goal task ID lists. Exactly six IDs each; the last is always a launch task.
 */
const GOAL_TASK_IDS: Record< GoalSlug, string[] > = {
	write: [
		'first_post_published',
		'site_theme_selected',
		'add_about_page',
		'complete_profile',
		'drive_traffic',
		'site_launched',
	],
	build: [
		'add_about_page',
		'site_theme_selected',
		'design_edited',
		'complete_profile',
		'drive_traffic',
		'site_launched',
	],
	sell: [
		'woo_customize_store',
		'woo_products',
		'set_up_payments',
		'site_theme_selected',
		'complete_profile',
		'site_launched',
	],
	newsletter: [
		'first_post_published_newsletter',
		'add_10_email_subscribers',
		'add_about_page',
		'site_theme_selected',
		'complete_profile',
		'site_launched',
	],
	educate: [
		'first_post_published',
		'add_about_page',
		'site_theme_selected',
		'complete_profile',
		'drive_traffic',
		'site_launched',
	],
	portfolio: [
		'first_post_published',
		'add_about_page',
		'site_theme_selected',
		'design_edited',
		'complete_profile',
		'site_launched',
	],
};

/**
 * Map a goal's task IDs to TailoredTask objects with deterministic subtitles.
 *
 * @param goal - The wizard goal.
 * @return The six tasks for the goal.
 */
function buildTasks( goal: GoalSlug ): TailoredTask[] {
	return GOAL_TASK_IDS[ goal ].map( id => ( {
		id,
		subtitle: TASK_SUBTITLES[ id ] ?? GENERIC_SUBTITLE,
	} ) );
}

/**
 * Truncate a string to at most `max` characters.
 *
 * @param value - The string to clamp.
 * @param max   - The maximum length.
 * @return The clamped string.
 */
function clamp( value: string, max: number ): string {
	return value.length > max ? value.slice( 0, max ) : value;
}

/**
 * Deterministic fallback when the AI call fails or returns invalid output.
 *
 * @param input - The collected wizard input.
 * @return A schema-valid tailored output.
 */
export function selectFallback( input: WizardInput ): TailoredOutput {
	const siteName = input.site_name.trim() || 'your new site';

	return {
		tasks: buildTasks( input.goal ),
		inferred: {
			goal: input.goal,
			brand_name: clamp( input.site_name, 80 ),
		},
		first_post_draft: {
			title: clamp( 'Getting started with ' + siteName, 80 ),
			subtitle: clamp( 'Introduce ' + siteName + ' to your readers.', 120 ),
			paragraphs: [
				'This is the first post on ' +
					siteName +
					'. It marks the starting point of something new, and there is plenty more to come.',
				'Thanks for being here at the very beginning. Stay tuned for what comes next.',
			],
		},
	};
}
