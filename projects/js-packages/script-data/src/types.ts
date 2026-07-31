export interface SitePlan {
	product_slug: string;
	features?: {
		active: Array< string >;
		available?: Record< string, Array< string > >;
	};
}

export interface WPCOMSiteData {
	blog_id: number;
}

export interface PublicSiteData {
	icon: string;
	title: string;
}

export interface AdminSiteData {
	admin_url: string;
	date_format: string;
	host?: 'woa' | 'atomic' | 'newspack' | 'vip' | 'wpcom' | 'unknown';
	is_multisite: boolean;
	is_wpcom_platform: boolean;
	plan: SitePlan;
	rest_nonce: string;
	rest_root: string;
	suffix?: string;
	wp_version: string;
	wpcom: WPCOMSiteData;
}

export interface SiteData extends PublicSiteData, Partial< AdminSiteData > {}

export interface UserCapabilities {
	edit_others_posts: boolean;
	manage_options: boolean;
	manage_modules: boolean;
}

export interface CurrentUserData {
	id: number;
	display_name: string;
	capabilities: UserCapabilities;
	wpcom?: {
		ID: number;
		login: string;
	};
}

export interface UserData {
	current_user: CurrentUserData;
}

/**
 * Analytics dashboard data, published by the Premium Analytics package only on
 * sites where it *is* the analytics UI. Its absence means the site still runs
 * the legacy Stats dashboard, so consumers treat presence as the branch signal
 * rather than taking a flag from every caller.
 *
 * Only the shape of the global lives here, which is this package's job. Building
 * URLs from it is the Jetpack plugin's — see `_inc/shared/analytics-url.ts`.
 */
export interface AnalyticsScriptData {
	/**
	 * Whether Premium Analytics is the analytics UI on this site.
	 */
	enabled: boolean;

	/**
	 * The admin page slug hosting the dashboard.
	 */
	page_slug: string;

	/**
	 * Whether the current user can open the dashboard. False means every
	 * analytics link should be hidden rather than leading to a capability error.
	 */
	can_view: boolean;

	/**
	 * The site's timezone — an IANA name (`America/New_York`) when one is set,
	 * otherwise a fixed UTC offset (`+05:30`). Used to encode date ranges the way
	 * the dashboard writes them to its own URL.
	 */
	timezone: string;
}

export interface JetpackScriptData {
	site: SiteData;
	user: UserData;
	analytics?: AnalyticsScriptData;
}

declare global {
	interface Window {
		JetpackScriptData: JetpackScriptData;
	}
}

/**
 * Site type categories for analytics and conditional logic.
 * - 'simple': WordPress.com Simple sites
 * - 'woa': WordPress.com sites on Atomic infrastructure
 * - 'jetpack': Self-hosted Jetpack sites
 */
export type SiteType = 'simple' | 'woa' | 'jetpack';
