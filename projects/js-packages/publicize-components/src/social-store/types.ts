export type ConnectionStatus = 'ok' | 'broken' | 'must_reauth';

export type Connection = {
	connection_id: string;
	display_name: string;
	enabled: boolean;
	external_handle: string;
	external_id: string;
	profile_link: string;
	profile_picture: string;
	service_label: string;
	service_name: string;
	shared: boolean;
	status: ConnectionStatus;
	wpcom_user_id: number;

	/* DEPRECATED FIELDS  */
	/**
	 * @deprecated
	 */
	done?: boolean;
	/**
	 * @deprecated Use `status` instead.
	 */
	error_code?: string;
	/**
	 * @deprecated Use `display_name` instead.
	 */
	external_display?: string;
	/**
	 * @deprecated Use `external_handle` instead.
	 */
	external_name?: string;
	/**
	 * @deprecated Use `connection_id` instead.
	 */
	id?: string;
	/**
	 * @deprecated Use `status` instead.
	 */
	is_healthy?: boolean;
	/**
	 * @deprecated Use `service_label` instead.
	 */
	label?: string;
	/**
	 * @deprecated Use `status` instead.
	 */
	test_success?: boolean;
	/**
	 * @deprecated
	 */
	toggleable?: boolean;
	/**
	 * @deprecated Use `external_handle` instead.
	 */
	username?: string;
};

export type ConnectionData = {
	connections: Connection[];
	deletingConnections?: Array< number | string >;
	updatingConnections?: Array< number | string >;
	reconnectingAccount?: Connection;
	keyringResult?: KeyringResult;
	abortControllers?: Record< string, Array< AbortController > >;
	isConnectionsModalOpen?: boolean;
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
	show_linkedin_warning?: boolean;
}

export type SocialImageGeneratorConfig = {
	enabled: boolean;
	template?: string;
};

export type UtmSettingsConfig = {
	enabled: boolean;
};

export type SocialNotesConfig = {
	append_link: boolean;
	link_format: 'full_url' | 'shortlink' | 'permashortcitation';
};

export type SocialNotesSettings = {
	enabled: boolean;
	config: SocialNotesConfig;
};

export type SocialModuleSettings = {
	publicize: boolean;
};

export type SocialSettingsFields = {
	jetpack_social_image_generator_settings: SocialImageGeneratorConfig;
	jetpack_social_utm_settings: UtmSettingsConfig;
	[ 'jetpack-social-note' ]: boolean;
	jetpack_social_notes_config: SocialNotesConfig;
	[ 'jetpack-social_show_pricing_page' ]: boolean;
};

export type ScheduledShare = {
	id: number;
	blog_id: number;
	connection_id: number;
	message: string;
	post_id: number;
	timestamp: number;
	wpcom_user_id: number;
};
