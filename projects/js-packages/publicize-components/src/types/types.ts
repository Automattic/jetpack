import { SocialImageGeneratorConfig } from '../social-store/types';

export interface SocialUrls {
	connectionsManagementPage: string;
}

export type SharesData = {
	to_be_publicized_count: number;
	publicized_count: number;
	shared_posts_count: number;
};

export interface FeatureFlags {
	useAdminUiV1: boolean;
	useEditorPreview: boolean;
	useShareStatus: boolean;
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

export type SocialSettings = {
	socialImageGenerator: SocialImageGeneratorConfig;
};

export interface SocialScriptData {
	api_paths: ApiPaths;
	is_publicize_enabled: boolean;
	feature_flags: FeatureFlags;
	supported_services: Array< ConnectionService >;
	shares_data: SharesData;
	urls: SocialUrls;
	settings: SocialSettings;
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
};

type ConnectionDataSelectors = {
	getConnections: () => Array< object >;
	hasConnections: () => boolean;
};

type SiteDataSelectors = {
	getSiteData: () => Array< object >;
	getSiteTitle: () => string;
};

/**
 * Types of the Social Store selectors.
 *
 * @module projects/js-packages/publicize-components/src/social-store/index.js
 */
export type SocialStoreSelectors = JetpackSettingsSelectors &
	ConnectionDataSelectors &
	SiteDataSelectors;
