export interface FeatureFlags {
	useAdminUiV1: boolean;
}

export interface SocialUrls {
	connectionsManagementPage: string;
}

export interface SocialScriptData {
	is_publicize_enabled: boolean;
	feature_flags: FeatureFlags;
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
	getServices: () => Array< object >;
	hasConnections: () => boolean;
};

type SharesDataSelectors = {
	getSharesCount: () => number;
	getPostsCount: () => number;
	isShareLimitEnabled: () => boolean;
	numberOfSharesRemaining: () => number;
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
