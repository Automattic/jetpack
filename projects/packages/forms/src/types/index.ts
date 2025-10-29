import type { ILanguage } from '../contact-form/libs/date-picker/interfaces';
import type { ReactNode } from 'react';

/**
 * Static metadata for an integration (without status fields).
 * This is a lightweight subset returned by the /integrations-metadata endpoint.
 */
export interface IntegrationMetadata {
	/** The unique identifier for the integration. */
	id: string;
	/** The unique slug for the integration. */
	slug: string;
	/** The type of integration: 'plugin' or 'service'. */
	type: 'plugin' | 'service';
	/** Default title for displaying the integration (server-provided, filterable). */
	title?: string;
	/** Default subtitle/description for the integration (server-provided, filterable). */
	subtitle?: string;
	/** A URL to learn about the integration, if available. */
	marketingUrl?: string | null;
	/** Whether this integration should be enabled by default for new forms. */
	enabledByDefault?: boolean;
}

/**
 * Describes an integration (plugin or service) available for Jetpack Forms.
 * This extends IntegrationMetadata with status fields.
 */
export interface Integration extends IntegrationMetadata {
	/** The plugin file path, if applicable. */
	pluginFile?: string | null;
	/** Whether the integration is installed. */
	isInstalled: boolean;
	/** Whether the integration is active. */
	isActive: boolean;
	/** Whether the integration is connected. */
	isConnected: boolean;
	/** Whether the integration needs connection. */
	needsConnection: boolean;
	/** The version of the integration, if available. */
	version?: string | null;
	/** The URL to the integration's settings page, if available. */
	settingsUrl?: string | null;
	/** Additional details about the integration. */
	details: Record< string, unknown >;
	/** Whether this is partial data (metadata only) or full status data. */
	__isPartial?: boolean;
}

/**
 * Props for integration cards in the Jetpack Forms dashboard and integrations modal.
 */
export interface SingleIntegrationCardProps {
	/** Whether the card is expanded. */
	isExpanded: boolean;
	/** Function to toggle the card's expanded state. */
	onToggle: () => void;
	/** The integration data for the card. */
	data?: Integration;
	/** Function to refresh the integration status. */
	refreshStatus: () => void;
	borderBottom?: boolean;
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
 * Represents a form response.
 */
export interface FormResponse {
	/** The unique identifier for the response. */
	id: number;
	/** The status of the response. */
	status: 'publish' | 'spam' | 'trash';
	/** The date and time the response was created. */
	date: string;
	/** The date and time the response was created in GMT. */
	date_gmt: string;
	/** The name of the response author. */
	author_name: string;
	/** The email of the response author. */
	author_email: string;
	/** The URL of the response author. */
	author_url: string;
	/** The avatar of the response author. */
	author_avatar: string;
	/** The IP address of the response author. */
	ip: string;
	/** The country code of the response author. */
	country_code: string;
	/** The browser and platform used to submit the form. */
	browser?: string;
	/** The title of the form that the response was submitted to. */
	entry_title: string;
	/** The permalink of the form that the response was submitted to. */
	entry_permalink: string;
	/** Whether the response has a file attached. */
	has_file: boolean;
	/** Whether the response is unread. */
	is_unread: boolean;
	/** The fields of the response. */
	fields: Record< string, unknown >;
}

/**
 * Default URLs for Jetpack Forms blocks, such as responses and spam responses.
 */
export interface JPFormsBlocksDefaults {
	/** The URL for form responses. */
	formsResponsesUrl?: string;
	/** The URL for spam form responses. */
	formsResponsesSpamUrl?: string;
	/** Whether MailPoet integration is enabled. */
	isMailPoetEnabled?: boolean;
	/** The default subject for the form. */
	subject?: string;
	/** The default recipient email address for the form. */
	to?: string;
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
		MSStream?: unknown;
		ajaxurl?: string;
		jpDatePicker?: {
			lang: ILanguage;
			offset: string;
		};
		jetpackForms?: {
			generateStyleVariables: ( formNode: HTMLElement ) => Record< string, string >;
		};
	}
}

/**
 * Represents the data passed to IntegrationCard and IntegrationCardHeader components.
 * This type extends Integration and includes additional UI and state fields used by cards.
 */
export type IntegrationCardData = Partial< Integration > & {
	/** Whether to show the header toggle. */
	showHeaderToggle?: boolean;
	/** The value of the header toggle (on/off). */
	headerToggleValue?: boolean;
	/** Whether the header toggle is enabled. */
	isHeaderToggleEnabled?: boolean;
	/** Handler for header toggle changes. */
	onHeaderToggleChange?: ( value: boolean ) => void;
	/** Tooltip to show when the toggle is disabled. */
	toggleDisabledTooltip?: string;
	/** Badge or element to show in the header for setup state. */
	setupBadge?: ReactNode;
	/** Function to refresh the integration status. */
	refreshStatus?: () => void;
	/** Event name for tracking analytics. */
	trackEventName?: string;
	/** Message to show when the integration is not installed. */
	notInstalledMessage?: ReactNode;
	/** Message to show when the integration is not activated. */
	notActivatedMessage?: ReactNode;
	/** Whether the card is in a loading state. */
	isLoading?: boolean;
};

/**
 * Represents a Gutenberg block
 */
export type Block = {
	attributes?: {
		[ key: string ]: unknown;
	};
	clientId?: string;
	innerBlocks?: Block[];
	isValid?: boolean;
	name?: string;
	originalContent?: string;
};

/**
 * Dispatch actions for the block editor store.
 */
export type BlockEditorStoreDispatch = {
	insertBlock: ( block: Block, index: number, parentClientId: string ) => void;
	removeBlock: ( clientId: string, isInnerBlock?: boolean ) => void;
};

/**
 * Select actions for the block editor store.
 */
export type BlockEditorStoreSelect = {
	getBlock: ( clientId: string ) => Block;
	getBlocks: ( clientId: string ) => Block[];
	hasSelectedInnerBlock: ( clientId: string, isInnerBlock: boolean ) => boolean;
	getBlockRootClientId: ( clientId: string ) => string;
	getSelectedBlock: () => Block;
	getBlockIndex: ( clientId: string ) => number;
	getBlockParentsByBlockName: ( clientId: string, blockName: string ) => string[];
};

/**
 * Forms script data exposed via JetpackScriptData.forms
 */
export interface FormsConfigData {
	/** Whether MailPoet integration is enabled across contexts. */
	isMailPoetEnabled?: boolean;
	/** Whether Hostinger Reach integration is enabled across contexts. */
	isHostingerReachEnabled?: boolean;
	/** Whether integrations UI is enabled (feature-flagged). */
	isIntegrationsEnabled?: boolean;
	/** Whether the current user can install plugins (install_plugins). */
	canInstallPlugins?: boolean;
	/** Whether the current user can activate plugins (activate_plugins). */
	canActivatePlugins?: boolean;
	/** Whether there are any feedback (form response) posts on the site. */
	hasFeedback?: boolean;
	/** The URL of the Forms responses list in wp-admin. */
	formsResponsesUrl?: string;
	/** Current site blog ID. */
	blogId?: number;
	/** Support URL for Google Drive connect guidance. */
	gdriveConnectSupportURL?: string;
	/** Base URL to static/assets for the Forms package. */
	pluginAssetsURL?: string;
	/** The site suffix/fragment for building admin links. */
	siteURL?: string;
	/** The dashboard URL with migration acknowledgement parameter. */
	dashboardURL?: string;
	/** Nonce for exporting feedback responses (dashboard-only). */
	exportNonce?: string;
	/** Nonce for creating a new form (dashboard-only). */
	newFormNonce?: string;
	/** Number of days before WordPress permanently deletes trash. See https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#empty-trash */
	emptyTrashDays?: number;
}
