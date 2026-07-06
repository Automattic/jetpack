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

export interface JetpackScriptData {
	site: SiteData;
	user: UserData;
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
