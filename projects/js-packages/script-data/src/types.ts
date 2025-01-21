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
	plan: SitePlan;
	rest_nonce: string;
	rest_root: string;
	suffix?: string;
	wp_version: string;
	wpcom: WPCOMSiteData;
}

export interface SiteData extends PublicSiteData, Partial< AdminSiteData > {}

export interface CurrentUserData {
	id: number;
	display_name: string;
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
