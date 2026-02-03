/**
 * Type definitions for newsletter settings
 */

/**
 * Type definitions for newsletter settings data
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
	wpcom_newsletter_categories_enabled: boolean;
	wpcom_newsletter_categories: string[];
	subscription_options?: {
		invitation: string;
		welcome: string;
		comment_follow: string;
	};
	[ key: string ]: unknown;
}

/**
 * Type definitions for Jetpack Newsletter settings passed from PHP
 */
export interface JetpackNewsletterSettings {
	isBlockTheme: boolean;
	siteAdminUrl: string;
	themeStylesheet: string;
	blogID: number;
	email: string;
	gravatar: string;
	displayName: string;
	dateExample: string;
	subscriberManagementUrl: string;
	isSubscriptionSiteEditSupported: boolean;
	setupPaymentPlansUrl: string;
	isSitePublic: boolean;
	isWpcomPlatform: boolean;
	isWpcomSimple: boolean;
	restApiRoot: string;
	restApiNonce: string;
	siteName: string;
}

/**
 * Type definition for WordPress category
 */
export interface WordPressCategory {
	id: string;
	name: string;
}
