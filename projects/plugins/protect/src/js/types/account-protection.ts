export type AccountProtectionStatus = {
	/** Whether the "account-protection" module is enabled. */
	isEnabled: boolean;

	/** Whether the "account-protection" module is supported. */
	isSupported: boolean;

	/** Whether the environment has an unsupported Jetpack version. */
	hasUnsupportedJetpackVersion: boolean;

	/** The account protection config. */
	config: AccountProtectionConfig;
};

export type AccountProtectionConfig = {
	/** Whether the password detection feature is enabled. */
	passwordDetectionEnabled: boolean;

	/** Whether the strong passwords feature is enabled. */
	strongPasswordsEnabled: boolean;
};
