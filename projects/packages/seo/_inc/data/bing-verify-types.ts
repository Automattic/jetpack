// PROTOTYPE (JPPROD-116): throwaway Bing copy of `google-verify-types`.

export interface BingVerifyBootstrap {
	/** WordPress.com keyring OAuth URL that opens the Bing connect popup. */
	connect_url: string;
	/** Whether the current user has a Jetpack user connection. */
	is_connected: boolean;
	/** Whether the host supplies an automatic verification transport. */
	can_auto_verify?: boolean;
	/** Host-local REST path; defaults to the Jetpack verify-site route. */
	api_path?: string;
}

/** Response from the host's Bing verification endpoints. */
export interface BingVerifyStatus {
	verified: boolean;
	is_owner: boolean;
	webmaster_tools_url?: string;
	/** The `msvalidate.01` code to save to verification_services_codes.bing before verifying. */
	token?: string;
}
