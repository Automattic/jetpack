export type ModuleState = {
	available: boolean;
	active: boolean;
};

export type LoginProtectionState = {
	bruteForce: ModuleState;
	accountProtection: ModuleState;
	sso: ModuleState;
	/** All-time blocked login attempts, or null while brute force protection is off. */
	blockedCount: number | null;
	/** Settings a filter or constant forces, so they can't be changed here. */
	ssoLocks: { matchByEmail: boolean; twoStep: boolean };
	currentIp: string;
};
