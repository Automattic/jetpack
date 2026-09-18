import { __ } from '@wordpress/i18n';
import type { GoalSlug, TailoredOutput, TailoredTask, WizardInput } from './types.ts';

/**
 * Subtitles for catalog task IDs. Unmapped IDs get a generic subtitle so subtitle's minLength:1 is
 * always satisfied. Built per call so each `__()` runs once the locale data is in place.
 *
 * @return The subtitle map.
 */
function taskSubtitles(): Record< string, string > {
	return {
		first_post_published: __( 'Write and publish your first post.', 'jetpack-mu-wpcom' ),
		woo_products: __( 'Add your first product to the store.', 'jetpack-mu-wpcom' ),
		woo_customize_store: __( 'Customize how your store looks.', 'jetpack-mu-wpcom' ),
		set_up_payments: __( 'Set up a way to get paid.', 'jetpack-mu-wpcom' ),
		add_10_email_subscribers: __( 'Grow your list to your first subscribers.', 'jetpack-mu-wpcom' ),
		site_theme_selected: __( 'Pick a theme that fits your site.', 'jetpack-mu-wpcom' ),
		add_about_page: __( 'Tell visitors who you are.', 'jetpack-mu-wpcom' ),
		design_edited: __( 'Make the design your own.', 'jetpack-mu-wpcom' ),
		complete_profile: __( 'Complete your public profile.', 'jetpack-mu-wpcom' ),
		verify_email: __( 'Confirm your email address.', 'jetpack-mu-wpcom' ),
		connect_social_media: __( 'Connect your social accounts.', 'jetpack-mu-wpcom' ),
		site_launched: __( 'Launch your site for the world to see.', 'jetpack-mu-wpcom' ),
		blog_launched: __( 'Launch your blog for the world to see.', 'jetpack-mu-wpcom' ),
	};
}

/**
 * Per-goal task ID lists. Exactly six IDs each; the last is always a launch task.
 */
const GOAL_TASK_IDS: Record< GoalSlug, string[] > = {
	write: [
		'first_post_published',
		'site_theme_selected',
		'add_about_page',
		'complete_profile',
		'connect_social_media',
		'site_launched',
	],
	build: [
		'add_about_page',
		'site_theme_selected',
		'design_edited',
		'complete_profile',
		'connect_social_media',
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
		'first_post_published',
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
		'connect_social_media',
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
	const subtitles = taskSubtitles();
	const generic = __( 'Get this set up.', 'jetpack-mu-wpcom' );
	return GOAL_TASK_IDS[ goal ].map( id => ( {
		id,
		subtitle: subtitles[ id ] ?? generic,
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
		about_page_draft: {
			title: 'About',
			paragraphs: [
				'This is where the story of ' +
					siteName +
					' begins. Use this page to share who is behind the site and what it is all about.',
				'Tell visitors how it started, what they can expect to find here, and where it is headed next.',
			],
		},
	};
}
