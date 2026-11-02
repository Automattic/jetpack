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

/**
 * The plan a site must buy to unlock Social's paid features. Only sent for Simple sites
 * that don't already have them.
 */
export type SocialUpgrade = {
	plan_slug: string;
	/** Null when the slug isn't in the product list. */
	plan_name: string | null;
};

/**
 * A plugin that brings replies from a network back to the site, offered to users who can turn it on.
 */
export type CompanionPlugin = {
	slug: 'atmosphere' | 'activitypub';
	/** Core's REST plugin ID, e.g. `atmosphere/atmosphere`. */
	plugin: string;
	service: ConnectionService[ 'id' ];
	/**
	 * `install` and `activate` go through core's plugins API, `enable` turns ActivityPub on for a
	 * WordPress.com Simple site, and `marketplace` sends the user to install it from WordPress.com.
	 */
	action: 'install' | 'activate' | 'enable' | 'marketplace';
	/** The WordPress.com plugin page, for the `marketplace` action. */
	install_url: string;
	settings_url: string;
};

export interface SocialScriptData {
	api_paths: ApiPaths;
	assets_url: string;
	companion_plugins?: Array< CompanionPlugin >;
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
	upgrade?: SocialUpgrade;
	urls: SocialUrls;
}
