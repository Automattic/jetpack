declare const process: {
	env: {
		CI: string;
		CONSOLE_LOG_LEVEL: string;
		TEST_SITE?: string;
		JETPACK_SKIP_CONNECT?: string;
		SHOW_SECRETS?: string;
		STORAGE_STATE_DIR_PATH?: string;
		STORAGE_STATE_PATH?: string;
		WP_BASE_URL?: string;
		WP_USERNAME?: string;
		WP_PASSWORD?: string;
	};
};
