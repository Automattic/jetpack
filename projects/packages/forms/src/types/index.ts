/**
 * Describes an integration (plugin or service) available for Jetpack Forms.
 */
export interface Integration {
	/** The type of integration: 'plugin' or 'service'. */
	type: 'plugin' | 'service';
	/** The unique slug for the integration. */
	slug: string;
	/** The unique identifier for the integration. */
	id: string;
	/** The plugin file path, if applicable. */
	pluginFile?: string | null;
	/** Whether the integration is installed. */
	isInstalled: boolean;
	/** Whether the integration is active. */
	isActive: boolean;
	/** Whether the integration is connected. */
	isConnected: boolean;
	/** The version of the integration, if available. */
	version?: string | null;
	/** The URL to the integration's settings page, if available. */
	settingsUrl?: string | null;
	/** Additional details about the integration. */
	details: Record< string, unknown >;
}

/**
 * Props for integration cards in the Jetpack Forms dashboard and integrations modal.
 */
export interface IntegrationCardProps {
	/** Whether the card is expanded. */
	isExpanded: boolean;
	/** Function to toggle the card's expanded state. */
	onToggle: () => void;
	/** The integration data for the card. */
	data?: Integration;
	/** Function to refresh the integration status. */
	refreshStatus: () => void;
}

/**
 * Represents a reusable form pattern for the Jetpack Forms dashboard.
 */
export type Pattern = {
	/** The URL of the pattern's preview image. */
	image: string;
	/** The display name of the pattern. */
	title: string;
	/** Whether this pattern is recommended for most users. */
	recommended?: boolean;
	/** The unique code identifier for the pattern. */
	code: string;
	/** A short description of the pattern's purpose. */
	description: string;
};

/**
 * Default URLs for Jetpack Forms blocks, such as responses and spam responses.
 */
export interface JPFormsBlocksDefaults {
	/** The URL for form responses. */
	formsResponsesUrl?: string;
	/** The URL for spam form responses. */
	formsResponsesSpamUrl?: string;
}

/**
 * Augments the global Window interface to include Jetpack Forms block defaults.
 */
declare global {
	interface Window {
		/** Optional Jetpack Forms block defaults on the window object. */
		jpFormsBlocks?: {
			defaults?: JPFormsBlocksDefaults;
		};
		jetpackAnalytics?: {
			tracks?: {
				recordEvent: ( event: string, props?: Record< string, unknown > ) => void;
			};
		};
	}
}
