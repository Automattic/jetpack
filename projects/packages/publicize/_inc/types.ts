import {
	SocialImageGeneratorConfig,
	UtmSettingsConfig,
	SocialStoreState,
	SocialNotesSettings,
} from './social-store/types';

export interface SocialUrls {
	connectionsManagementPage: string;
}

export type ConnectionService = {
	id:
		| 'bluesky'
		| 'facebook'
		| 'instagram-business'
		| 'linkedin'
		| 'mastodon'
		| 'nextdoor'
		| 'threads'
		| 'tumblr';
	label: string;
	description: string;
	url: string;
	supports: {
		additional_users: boolean;
		additional_users_only: boolean;
	};
	status: 'ok' | 'unsupported';
};

export interface ApiPaths {
	resharePost: string;
	socialToggleBase: 'settings' | 'social/settings';
}

export type SocialSettings = {
	socialImageGenerator: SocialImageGeneratorConfig;
	utmSettings: UtmSettingsConfig;
	socialNotes: SocialNotesSettings;
	showPricingPage: boolean;
	messageTemplate: string;
};

export type PluginInfo = Record< 'social' | 'jetpack', { version: string | null } >;

export interface SocialScriptData {
	api_paths: ApiPaths;
	assets_url: string;
	nonces?: {
		refresh_plan: string;
	};
	is_publicize_enabled: boolean;
	message_templates: {
		placeholders: Array< { id: string; label: string } >;
	};
	plugin_info: PluginInfo;
	settings: SocialSettings;
	store_initial_state: SocialStoreState;
	supported_services: Array< ConnectionService >;
	urls: SocialUrls;
}
