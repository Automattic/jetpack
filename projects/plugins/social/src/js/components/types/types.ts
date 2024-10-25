type JetpackSettingsSelectors = {
	getJetpackSettings: () => {
		publicize_active: boolean;
		show_pricing_page: boolean;
		showNudge: boolean;
	};
	isModuleEnabled: () => boolean;
	showPricingPage: () => boolean;
	isUpdatingJetpackSettings: () => boolean;
};

type ConnectionDataSelectors = {
	getConnections: () => Array< object >;
	hasConnections: () => boolean;
};

type SiteDataSelectors = {
	getSiteData: () => Array< object >;
	getSiteTitle: () => string;
	getSiteSuffix: () => string;
	getBlogID: () => number;
};

type SocialImageGeneratorSettingsSelectors = {
	getSocialImageGeneratorSettings: () => {
		available: boolean;
		enabled: boolean;
		defaults: () => {
			template: string;
		};
	};
	isSocialImageGeneratorEnabled: () => boolean;
	isUpdatingSocialImageGeneratorSettings: () => boolean;
	getSocialImageGeneratorDefaultTemplate: () => string;
};

type SocialNotesSettingsSelectors = {
	isSocialNotesEnabled: () => boolean;
	isSocialNotesSettingsUpdating: () => boolean;
};

/**
 * Types of the Social Store selectors.
 *
 * @module projects/plugins/social/src/js/store/selectors/index.js
 */
export type SocialStoreSelectors = JetpackSettingsSelectors &
	ConnectionDataSelectors &
	SiteDataSelectors &
	SocialImageGeneratorSettingsSelectors &
	SocialNotesSettingsSelectors;
