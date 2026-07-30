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
 * the legacy Stats dashboard, so `getAnalyticsUrl()` treats presence as the
 * branch signal rather than taking a flag from every caller.
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
	 * otherwise a fixed UTC offset (`+05:30`). Used to encode date ranges the
	 * way the dashboard writes them to its own URL.
	 */
	timezone: string;
}

/**
 * A range of whole calendar days in the site's timezone, as `YYYY-MM-DD`.
 * Callers pass plain calendar dates; `getAnalyticsUrl()` owns the conversion to
 * whatever encoding the destination expects.
 */
export interface AnalyticsDateRange {
	from: string;
	to: string;
}

/**
 * A section of the analytics dashboard, in caller-facing vocabulary.
 */
export type AnalyticsDashboardSection = 'traffic' | 'insights' | 'subscribers' | 'store';

/**
 * A tab of the single-post analytics view, in caller-facing vocabulary.
 */
export type AnalyticsPostSection = 'traffic' | 'email-opens' | 'email-clicks';

/**
 * A standalone analytics report.
 */
export type AnalyticsReportId =
	| 'annual-insights'
	| 'authors'
	| 'clicks'
	| 'comment-followers'
	| 'comments'
	| 'downloads'
	| 'emails'
	| 'posts'
	| 'referrers'
	| 'search-terms'
	| 'tags'
	| 'utm'
	| 'videos';

/**
 * An analytics destination, described in terms of what the user should see
 * rather than how the URL is spelled.
 *
 * A discriminated union rather than a property bag, so that a report id can't
 * be passed alongside a post id, and each view only accepts the modifiers that
 * apply to it. `range` is accepted on every view because the dashboard, the
 * reports and the post detail page all read the same date-window params.
 *
 * Deliberately absent: the site and blog identifiers (resolved from script
 * data, so callers need not thread them through props) and product checkout,
 * which shares no path grammar with the analytics views.
 */
export type AnalyticsView =
	| { view: 'dashboard'; section?: AnalyticsDashboardSection; range?: AnalyticsDateRange }
	| { view: 'report'; report: AnalyticsReportId; section?: string; range?: AnalyticsDateRange }
	| { view: 'post'; id: number; section?: AnalyticsPostSection; range?: AnalyticsDateRange }
	| { view: 'video'; id: number; range?: AnalyticsDateRange };

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
