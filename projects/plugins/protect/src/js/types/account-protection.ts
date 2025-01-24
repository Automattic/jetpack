export type AccountProtectionStatus = {
	/** Whether the "account-protection" module is enabled. */
	isEnabled: boolean;

	/** The current Account Protetion settings. */
	settings: AccountProtectionSettings;
};

export type AccountProtectionSettings = {
	/** Whether the user has enabled strict mode. */
	jetpackAccountProtectionStrictMode: boolean;
};
