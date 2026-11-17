import type { ProtectSettings } from '../../data/use-protect-settings';
import type { DashboardContext } from '../types';

export type BlockedRequest = {
	id: number;
	/** ISO 8601, UTC. */
	timestamp: string;
	ruleId: number;
	reason: string;
};

export type FirewallState = {
	available: boolean;
	active: boolean;
	/** All-time blocked requests, or null when the WAF package isn't loaded. */
	blockedCount: number | null;
	/** Blocked requests over the last 30 UTC days, or null when the WAF package isn't loaded. */
	blockedLast30Days: number | null;
	/** The last 10, newest first. */
	recentBlocks: BlockedRequest[];
	/** Whether the firewall has blocked anything besides its own tests. */
	hasBlocked: boolean;
	/** When the firewall was last tested, ISO 8601 in UTC; null if it never was. */
	lastTestAt: string | null;
	hasScan: boolean;
	/** Where to buy Scan, for the automatic rules it adds. */
	upgradeUrl: string;
	currentIp: string;
	/** The IP lists and their on/off state as of page load, keyed like Jetpack settings. */
	ipRules: ProtectSettings;
	/** When the automatic rules were last downloaded, in Unix seconds; null while they're off. */
	rulesUpdatedAt: number | null;
	/** Whether the host runs its own firewall where Jetpack's can't run, as WordPress.com does on WoA. */
	providedByHost: boolean;
};

/** What `/firewall/blocks` returns, and the card keeps up to date after a test. */
export type FirewallBlocks = Pick<
	FirewallState,
	'blockedCount' | 'blockedLast30Days' | 'recentBlocks' | 'hasBlocked' | 'lastTestAt'
>;

/** What `/firewall/test` returns: the one-time URL the firewall blocks. */
export type FirewallTestResponse = { url: string };

/** Undefined when PHP registered no Firewall section. */
export type FirewallContext = DashboardContext< FirewallState | undefined >;
