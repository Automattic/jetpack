/**
 * Type definitions for newsletter settings
 */

/**
 * Type definitions for newsletter settings data from the API
 */
export interface NewsletterSettings {
	subscriptions: boolean;
	stb_enabled: boolean;
	stc_enabled: boolean;
	sm_enabled: boolean;
	jetpack_subscribe_overlay_enabled: boolean;
	jetpack_subscribe_floating_button_enabled: boolean;
	jetpack_subscriptions_subscribe_post_end_enabled: boolean;
	jetpack_subscriptions_login_navigation_enabled: boolean;
	jetpack_subscriptions_subscribe_navigation_enabled: boolean;
	wpcom_featured_image_in_email: boolean;
	wpcom_subscription_emails_use_excerpt: string;
	jetpack_gravatar_in_email: boolean;
	jetpack_author_in_email: boolean;
	jetpack_post_date_in_email: boolean;
	jetpack_subscriptions_reply_to: 'comment' | 'author' | 'no-reply';
	jetpack_subscriptions_from_name: string;
	wpcom_newsletter_send_default: boolean;
	wpcom_newsletter_categories_enabled: boolean;
	wpcom_newsletter_categories: string[];
	subscription_options?: {
		invitation: string;
		welcome: string;
		comment_follow: string;
		subscribe_modal_heading: string;
	};
	newsletter_has_active_plan: boolean;
	[ key: string ]: unknown;
}

/**
 * Newsletter-specific data added to JetpackScriptData via the jetpack_admin_js_script_data filter.
 * Common data like admin_url, rest_nonce, title, is_wpcom_platform, and
 * user.current_user.display_name are provided by Script_Data defaults.
 */
export interface NewsletterScriptData {
	isBlockTheme: boolean;
	themeStylesheet: string;
	email: string;
	gravatar: string;
	dateExample: string;
	subscriberManagementUrl: string;
	subscriberManagementEnabled: boolean;
	isSubscriptionSiteEditSupported: boolean;
	setupPaymentPlansUrl: string;
	isSitePublic: boolean;
	tracksUserData?:
		| {
				userid: number;
				username: string;
		  }
		| false;
	/**
	 * Whether Newsletter Mode is available on this site at all (the spike-stage
	 * feature gate). Bootstrapped from Mode::is_available(). The opt-in toggle is
	 * only surfaced when this is true.
	 */
	modeAvailable: boolean;
	/**
	 * Whether Newsletter Mode is switched on for this site. Bootstrapped from
	 * Mode::is_enabled() in class-settings.php.
	 */
	modeEnabled: boolean;
}

/**
 * Data the Newsletter Mode surfaces need, added to JetpackScriptData by
 * Mode::maybe_add_script_data().
 *
 * A namespace of its own rather than more keys on {@link NewsletterScriptData},
 * because that payload comes from Settings::add_script_data(), which is bound to
 * the Newsletter page's own load hook and so never runs on the mode's pages.
 * Sharing the key would mean one name covering two shapes that never coexist.
 */
export interface NewsletterModeScriptData {
	/**
	 * The name to greet the current user by on the Dashboard — their nickname,
	 * else their first name, else an empty string.
	 */
	greetingName: string;
	/**
	 * Where "Write" goes: the mu-wpcom Write editor when that feature is loaded,
	 * else the block editor. Resolved by Mode::get_write_url(), the same source
	 * the nav's Write button uses.
	 */
	writeUrl: string;
	/** The newsletter's public address — what the Share modal hands out. */
	siteUrl: string;
	/**
	 * Where the Dashboard's "Make it yours" row goes: the Newsletter Settings
	 * tab — including the `p` param the SPA router reads — carrying a `focus`
	 * hint the identity section uses to put the cursor in the title field.
	 */
	settingsUrl: string;
	/**
	 * The Posts screen as the curated nav links to it — carrying NAV_QUERY_ARG so
	 * arriving there keeps the visitor inside Newsletter Mode. Used by the
	 * Dashboard's "View all".
	 */
	postsUrl: string;
	/**
	 * Whether this user has dismissed the Dashboard's getting-started checklist.
	 * Bootstrapped so the page renders in its final shape rather than flashing
	 * the checklist and then pulling it away.
	 */
	checklistDismissed: boolean;
	/**
	 * Whether this user has already seen the one-time Newsletter Mode intro.
	 * Bootstrapped from Mode::is_intro_seen().
	 */
	introSeen: boolean;
	/**
	 * URL of the intro artwork, resolved server side by
	 * Mode::get_intro_art_url(). Served from the package rather than bundled
	 * because wp-build cannot load images.
	 */
	introArtUrl: string;
	/**
	 * This site's Earn screen on WordPress.com — the same destination the nav's
	 * Monetize item opens. Both come from Mode::get_monetize_url().
	 */
	monetizeUrl: string;
	/**
	 * Ids of the getting-started checklist tasks this user has completed.
	 * Bootstrapped from Mode::get_completed_checklist_tasks(); the ids are the
	 * ones in Mode::CHECKLIST_TASKS.
	 */
	checklistCompleted: string[];
}

/**
 * Type definition for WordPress category
 */
export interface WordPressCategory {
	id: string;
	name: string;
}
