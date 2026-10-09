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
	/** The last 10, newest first. */
	recentBlocks: BlockedRequest[];
	hasScan: boolean;
	currentIp: string;
};

/** Undefined when PHP registered no Firewall section. */
export type FirewallContext = DashboardContext< FirewallState | undefined >;
