// Google site-verification state.
//
// The bootstrap (keyring connect URL + whether the current user is connected) is
// injected onto `window.JetpackScriptData.seo.google_verify` by
// `Initializer::get_google_verify_data()`. The live verified status is fetched
// client-side from `/jetpack/v4/verify-site/google` (a wpcom round-trip).

export interface GoogleVerifyBootstrap {
	/** WordPress.com keyring OAuth URL that opens the auto-verify popup. */
	connect_url: string;
	/** Whether the current user is connected to WordPress.com (keyring available). */
	is_connected: boolean;
}

/** Shape returned by GET/POST `/jetpack/v4/verify-site/google`. */
export interface GoogleVerifyStatus {
	verified: boolean;
	is_owner: boolean;
	google_search_console_url: string;
	/**
	 * The verification token Google expects to find on the site. It must be saved to
	 * `verification_services_codes.google` (so the `google-site-verification` meta tag
	 * is emitted) BEFORE asking Google to verify, or verification fails with
	 * "the necessary verification token could not be found on your site".
	 */
	token?: string;
}
