/**
 * Describes an integration (plugin or service) available for Jetpack Forms.
 * @property type        The type of integration: 'plugin' or 'service'.
 * @property slug        The unique slug for the integration.
 * @property id          The unique identifier for the integration.
 * @property pluginFile  The plugin file path, if applicable.
 * @property isInstalled Whether the integration is installed.
 * @property isActive    Whether the integration is active.
 * @property isConnected Whether the integration is connected.
 * @property version     The version of the integration, if available.
 * @property settingsUrl The URL to the integration's settings page, if available.
 * @property details     Additional details about the integration.
 */
export interface Integration {
	type: 'plugin' | 'service';
	slug: string;
	id: string;
	pluginFile?: string | null;
	isInstalled: boolean;
	isActive: boolean;
	isConnected: boolean;
	version?: string | null;
	settingsUrl?: string | null;
	details: Record< string, unknown >;
}

/**
 * Props for integration cards in the Jetpack Forms dashboard and integrations modal.
 * @property isExpanded    Whether the card is expanded.
 * @property onToggle      Function to toggle the card's expanded state.
 * @property data          The integration data for the card.
 * @property refreshStatus Function to refresh the integration status.
 */
export interface IntegrationCardProps {
	isExpanded: boolean;
	onToggle: () => void;
	data?: Integration;
	refreshStatus: () => void;
}

/**
 * Default URLs for Jetpack Forms blocks, such as responses and spam responses.
 * @property formsResponsesUrl     The URL for form responses.
 * @property formsResponsesSpamUrl The URL for spam form responses.
 */
export interface JPFormsBlocksDefaults {
	formsResponsesUrl?: string;
	formsResponsesSpamUrl?: string;
}

/**
 * Represents a reusable form pattern for the Jetpack Forms dashboard.
 * @property image       The URL of the pattern's preview image.
 * @property title       The display name of the pattern.
 * @property recommended Whether this pattern is recommended for most users.
 * @property code        The unique code identifier for the pattern.
 * @property description A short description of the pattern's purpose.
 */
export type Pattern = {
	image: string;
	title: string;
	recommended?: boolean;
	code: string;
	description: string;
};

/**
 * Extends the Window interface to include Jetpack Forms block defaults.
 * @property jpFormsBlocks Optional Jetpack Forms block defaults on the window object.
 */
export interface JPFormsBlocksWindow extends Window {
	jpFormsBlocks?: {
		defaults?: JPFormsBlocksDefaults;
	};
}
