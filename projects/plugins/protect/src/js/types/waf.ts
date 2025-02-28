export type WafStatus = {
	/** The current WAF configuration. */
	config: WafConfig;

	/** The current user's IP address. */
	currentIp: string;

	/** Whether to show the "upgrade" badge in the firewall UI. */
	displayUpgradeBadge: boolean;

	/** Global statistics. */
	globalStats: {
		totalVulnerabilities: string;
	};

	/** Whether the "waf" module is enabled. */
	isEnabled: boolean;

	/** Stats. */
	stats: boolean;

	/** Whether the current user has viewed the upgrade message in the firewall UI. */
	upgradeIsSeen: boolean;

	/** Whether the WAF can run in the current environment. */
	wafSupported: boolean;
};

export type WafConfig = {
	/** True if any version of automatic rules is currently installed on the site */
	automaticRulesAvailable: boolean;

	/** File path to the bootstrap.php file, i.e. "/var/www/html/wp-content/jetpack-waf/bootstrap.php" */
	bootstrapPath: string;

	/** Whether brute force protection is enabled. */
	bruteForceProtection: boolean;

	/** Whether automatic rules are enabled. */
	jetpackWafAutomaticRules: boolean;

	/** The contents of the IP allow list. */
	jetpackWafIpAllowList: string;

	/** Whether the IP allow list is enabled. */
	jetpackWafIpAllowListEnabled: boolean;

	/** The contents of the IP block list. */
	jetpackWafIpBlockList: boolean;

	/** Whether the IP block list is enabled. */
	jetpackWafIpBlockListEnabled: boolean;

	/** Whether the user has consented to sharing basic data with Jetpack. */
	jetpackWafShareData: string;

	/** Whether the user has consented to sharing debug data with Jetpack. */
	jetpackWafShareDebugData: boolean;

	/** True if the firewall ran in standalone mode for the current request. */
	standaloneMode: boolean;

	/** @deprecated Whether all IP lists are enabled. */
	jetpackWafIpList: boolean;
};
