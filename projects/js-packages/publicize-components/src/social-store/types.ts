export type ConnectionStatus = 'ok' | 'broken';

export type Connection = {
	id: string;
	service_name: string;
	display_name: string;
	external_display?: string;
	external_id: string;
	external_name?: string;
	username: string;
	enabled: boolean;
	done: boolean;
	toggleable: boolean;
	connection_id: string;
	is_healthy?: boolean;
	error_code?: string;
	can_disconnect: boolean;
	profile_picture: string;
	profile_link: string;
	shared: boolean;
	status: ConnectionStatus;
};

export type ConnectionData = {
	connections: Connection[];
	deletingConnections?: Array< number | string >;
	updatingConnections?: Array< number | string >;
	reconnectingAccount?: Connection;
	keyringResult?: KeyringResult;
};

export type JetpackSettings = {
	showNudge?: boolean;
};

export type ShareStatusItem = Pick< Connection, 'profile_link' | 'profile_picture' > & {
	connection_id: number;
	status: 'success' | 'failure';
	message: string;
	timestamp: number;
	service: string;
	external_name: string;
	external_id: string;
};

export type PostShareStatus = {
	shares: Array< ShareStatusItem >;
	done?: boolean;
	/**
	 * Whether an API request is in flight.
	 */
	loading?: boolean;

	/**
	 * Whether the polling is in progress, which includes
	 * - the API request wait time
	 * - the polling interval/delay
	 */
	polling?: boolean;
};

export type ShareStatus = {
	isModalOpen?: boolean;
	[ PostId: number ]: PostShareStatus;
};

export type SocialStoreState = {
	connectionData: ConnectionData;
	shareStatus?: ShareStatus;
};

export interface KeyringAdditionalUser {
	external_ID: string;
	external_name: string;
	external_profile_picture: string;
}

export interface KeyringResult extends KeyringAdditionalUser {
	ID: number;
	additional_external_users: Array< KeyringAdditionalUser >;
	external_display: string;
	label: string;
	service: string;
	status: ConnectionStatus;
}

export type SocialImageGeneratorConfig = {
	enabled: boolean;
	template?: string;
};

export type SocialPluginSettings = {
	publicize_active: boolean;
	show_pricing_page: boolean;
	social_notes_enabled: boolean;
	social_notes_config: {
		append_link: boolean;
		link_format: 'full_url' | 'shortlink' | 'permashortcitation';
	};
};

export type SocialSettingsFields = {
	jetpack_social_image_generator_settings: SocialImageGeneratorConfig;
};

declare global {
	interface Window {
		jetpackSocialInitialState?: SocialStoreState & {
			is_publicize_enabled: boolean;
		};
	}
}
