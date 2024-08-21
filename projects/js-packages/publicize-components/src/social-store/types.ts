export type ConnectionStatus = 'ok' | 'broken';

export type Connection = {
	id: string;
	service_name: string;
	display_name: string;
	external_display?: string;
	external_id: string;
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
	reconnectingAccount?: string;
	keyringResult?: KeyringResult;
};

export type JetpackSettings = {
	showNudge?: boolean;
};

// TODO we should have a consistent structure across all the pages - editor, dashboard, admin page etc.
export type SocialStoreState = {
	// on post editor
	hasPaidPlan?: boolean;
	// on Jetack Social admin page
	jetpackSettings?: JetpackSettings;
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

declare global {
	interface Window {
		jetpackSocialInitialState?: SocialStoreState & {
			is_publicize_enabled: boolean;
		};
	}
}
