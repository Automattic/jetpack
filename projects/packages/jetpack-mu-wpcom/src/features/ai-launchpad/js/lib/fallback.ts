import { __, sprintf } from '@wordpress/i18n';
import type { GoalSlug, SiteCopy, TailoredOutput, TailoredTask, WizardInput } from './types.ts';

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
 * Fill the site name into a translated `%s` template. `@wordpress/i18n` types `sprintf`'s arguments
 * from a literal format string, and these come from the server.
 *
 * @param template - The translated template.
 * @param siteName - The site name.
 * @return The filled-in text.
 */
function withSiteName( template: string, siteName: string ): string {
	const filled = ( sprintf as ( format: string, ...args: string[] ) => string )(
		template,
		siteName
	);
	// A malformed translation (a stray `%`) makes sprintf hand the template back unfilled.
	return filled === template ? template.replace( /%(1\$)?s/, siteName ) : filled;
}

/**
 * Deterministic fallback when the AI call fails or returns invalid output.
 *
 * @param input - The collected wizard input.
 * @param copy  - The site-language copy for the post and page drafts.
 * @return A schema-valid tailored output.
 */
export function selectFallback( input: WizardInput, copy: SiteCopy ): TailoredOutput {
	const siteName = input.site_name.trim() || copy.fallback_site_name;

	return {
		tasks: buildTasks( input.goal ),
		inferred: {
			goal: input.goal,
			brand_name: clamp( input.site_name, 80 ),
		},
		first_post_draft: {
			title: clamp( withSiteName( copy.fallback_post_title, siteName ), 80 ),
			subtitle: clamp( withSiteName( copy.fallback_post_subtitle, siteName ), 120 ),
			paragraphs: copy.fallback_post_paragraphs.map( text => withSiteName( text, siteName ) ),
		},
		about_page_draft: {
			title: copy.about_page_title,
			paragraphs: copy.fallback_about_paragraphs.map( text => withSiteName( text, siteName ) ),
		},
	};
}
