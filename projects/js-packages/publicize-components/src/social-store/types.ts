export type SharesData = {
	is_share_limit_enabled: boolean;
	to_be_publicized_count: number;
	share_limit: number;
	publicized_count: number;
	show_advanced_plan_upgrade_nudge: boolean;
	shared_posts_count: number;
};

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

export type ConnectionService = {
	ID: string;
	label: string;
	type: 'publicize' | 'other';
	description: string;
	connect_URL: string;
	external_users_only?: boolean;
	multiple_external_user_ID_support?: boolean;
};

export type ConnectionData = {
	connections: Connection[];
	deletingConnections?: Array< number | string >;
	updatingConnections?: Array< number | string >;
	keyringResult?: KeyringResult;
};

export type JetpackSettings = {
	showNudge?: boolean;
};

// TODO we should have a consistent structure across all the pages - editor, dashboard, admin page etc.
export type SocialStoreState = {
	connectionData: ConnectionData;
	sharesData: SharesData;
	// on post editor
	hasPaidPlan?: boolean;
	// on Jetack Social admin page
	jetpackSettings?: JetpackSettings;
	useAdminUiV1?: boolean;
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
