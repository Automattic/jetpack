export interface SocialUrls {
	connectionsManagementPage: string;
}

export interface FeatureFlags {
	useAdminUiV1: boolean;
}

export type ConnectionService = {
	ID: string;
	label: string;
	type: 'publicize' | 'other';
	description: string;
	connect_URL: string;
	external_users_only?: boolean;
	multiple_external_user_ID_support?: boolean;
};

export interface ApiPaths {
	refreshConnections: string;
	resharePost: string;
}

export interface SocialScriptData {
	api_paths: ApiPaths;
	is_publicize_enabled: boolean;
	feature_flags: FeatureFlags;
	supported_services: Array< ConnectionService >;
	urls: SocialUrls;
}

type JetpackSettingsSelectors = {
	getJetpackSettings: () => {
		publicize_active: boolean;
		show_pricing_page: boolean;
		showNudge: boolean;
	};
	isModuleEnabled: () => boolean;
	showPricingPage: () => boolean;
	isUpdatingJetpackSettings: () => boolean;
	hasPaidPlan: () => boolean;
};

type ConnectionDataSelectors = {
	getConnections: () => Array< object >;
	hasConnections: () => boolean;
};

type SharesDataSelectors = {
	getSharesCount: () => number;
	getPostsCount: () => number;
};

type SiteDataSelectors = {
	getSiteData: () => Array< object >;
	getSiteTitle: () => string;
};

type SocialImageGeneratorSettingsSelectors = {
	getSocialImageGeneratorSettings: () => {
		available: boolean;
		enabled: boolean;
		defaults: () => {
			template: string;
		};
	};
	isSocialImageGeneratorAvailable: () => boolean;
	isSocialImageGeneratorEnabled: () => boolean;
	isUpdatingSocialImageGeneratorSettings: () => boolean;
	getSocialImageGeneratorDefaultTemplate: () => string;
};

/**
 * Types of the Social Store selectors.
 *
 * @module projects/js-packages/publicize-components/src/social-store/index.js
 */
export type SocialStoreSelectors = JetpackSettingsSelectors &
	ConnectionDataSelectors &
	SharesDataSelectors &
	SiteDataSelectors &
	SocialImageGeneratorSettingsSelectors;
