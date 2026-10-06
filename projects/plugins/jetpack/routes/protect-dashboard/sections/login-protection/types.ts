export type ModuleState = {
	available: boolean;
	active: boolean;
};

type SsoOptions = { matchByEmail: boolean; twoStep: boolean };

export type LoginProtectionState = {
	bruteForce: ModuleState;
	accountProtection: ModuleState;
	sso: ModuleState;
	/** All-time blocked login attempts, formatted for the site's locale. */
	blockedCount: string;
	/** Whether WordPress.com login can be turned on: it needs a connected owner and no offline mode. */
	ssoUsable: boolean;
	/** Settings a filter or constant forces, so they can't be changed here. */
	ssoLocks: SsoOptions;
	/** The values SSO actually applies, after filters and constants. */
	ssoEffective: SsoOptions;
	currentIp: string;
};
