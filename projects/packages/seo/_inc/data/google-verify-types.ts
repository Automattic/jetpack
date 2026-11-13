export interface GoogleVerifyBootstrap {
	/** WordPress.com keyring OAuth URL that opens the auto-verify popup. */
	connect_url: string;
	/** Whether the current user has a Jetpack user connection. */
	is_connected: boolean;
	/** Whether the host supplies an automatic verification transport. */
	can_auto_verify?: boolean;
	/** Host-local REST path; older hosts use the existing Jetpack route. */
	api_path?: string;
}

/** Shared response from the host's Google verification endpoints. */
export interface GoogleVerifyStatus {
	verified: boolean;
	is_owner: boolean;
	google_search_console_url?: string;
	/** Save this to verification_services_codes.google before requesting verification. */
	token?: string;
}
