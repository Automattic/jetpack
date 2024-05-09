export type SharesData = {
	is_share_limit_enabled: boolean;
	to_be_publicized_count: number;
	share_limit: number;
	publicized_count: number;
	show_advanced_plan_upgrade_nudge: boolean;
	shared_posts_count: number;
};

export type ConnectionStatus = 'ok' | 'must_reauth' | 'invalid' | 'broken' | 'refresh-failed';

export type Connection = {
	id: string;
	service_name: string;
	display_name: string;
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
	status: ConnectionStatus;
};

export type ConnectionData = {
	connections: Connection[];
	deletingConnections?: Array< number | string >;
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

declare global {
	interface Window {
		jetpackSocialInitialState?: SocialStoreState & {
			is_publicize_enabled: boolean;
		};
	}
}
