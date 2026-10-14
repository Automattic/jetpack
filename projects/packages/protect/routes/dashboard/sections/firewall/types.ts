import type { ProtectSettings } from '../../data/use-protect-settings';
import type { DashboardContext } from '../types';

export type BlockedRequest = {
	id: number;
	/** ISO 8601, UTC. */
	timestamp: string;
	ruleId: number;
	reason: string;
	/** From the firewall's request log, when it's kept and has the block. */
	uri?: string;
	userAgent?: string;
};

export type FirewallState = {
	available: boolean;
	active: boolean;
	/** All-time blocked requests, or null when the WAF package isn't loaded. */
	blockedCount: number | null;
	/** The last 10, newest first. */
	recentBlocks: BlockedRequest[];
	hasScan: boolean;
	currentIp: string;
	/** The IP lists and their on/off state as of page load, keyed like Jetpack settings. */
	ipRules: ProtectSettings;
};

/** What `/firewall/blocks` returns, and the card keeps up to date after a test. */
export type FirewallBlocks = Pick< FirewallState, 'blockedCount' | 'recentBlocks' >;

/** What `/firewall/test` returns: the one-time URL the firewall blocks. */
export type FirewallTestResponse = { url: string };

/** Undefined when PHP registered no Firewall section. */
export type FirewallContext = DashboardContext< FirewallState | undefined >;
