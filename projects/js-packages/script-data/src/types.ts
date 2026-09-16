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
 * Data My Jetpack prints on every Jetpack admin page, so other packages can link into it.
 */
export interface MyJetpackScriptData {
	/** Site editor state. Only on the My Jetpack page. */
	siteEditor?: {
		isBlockTheme: boolean;
		isSharingBlockAvailable: boolean;
		isLikeBlockAvailable: boolean;
		activeThemeStylesheet: string;
	};
	/** Absolute URL of My Jetpack's built images directory, with a trailing slash. */
	assetsUrl?: string;
	/** The tab that replaces Products, or null while it is unchanged. */
	productsSection?: { slug: 'features'; label: string } | null;
}

export interface JetpackScriptData {
	site: SiteData;
	user: UserData;
	myJetpack?: MyJetpackScriptData;
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
