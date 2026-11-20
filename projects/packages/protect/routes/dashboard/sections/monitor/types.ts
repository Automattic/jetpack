import type { DashboardContext } from '../types';

/** The Monitor section's state from PHP. */
export type MonitorState = {
	available: boolean;
	active: boolean;
	uptimeDays: number;
	/** Whether the current user has a WordPress.com connection. */
	userConnected: boolean;
	/** The email address of the user's WordPress.com account, where their alerts go; null when unknown. */
	alertEmail: string | null;
};

export type UptimeDay = {
	/** A UTC date, as `Y-m-d`. */
	date: string;
	status: 'up' | 'down' | 'monitor_inactive';
	downtimeInMinutes: number;
};

export type Uptime = {
	days: UptimeDay[];
	/** Whether the site is up right now; null when unknown. */
	isUp: boolean | null;
};

/** Undefined when PHP registered no Monitor section. */
export type MonitorContext = DashboardContext< MonitorState | undefined >;
