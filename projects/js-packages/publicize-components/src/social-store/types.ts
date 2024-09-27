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

// TODO we should have a consistent structure across all the pages - editor, dashboard, admin page etc.
export type SocialStoreState = {
	connectionData: ConnectionData;
	// on post editor
	hasPaidPlan?: boolean;
	// on Jetack Social admin page
	jetpackSettings?: JetpackSettings;
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

declare global {
	interface Window {
		jetpackSocialInitialState?: SocialStoreState & {
			is_publicize_enabled: boolean;
		};
	}
}
