/** The Monitor section's state from PHP. */
export type MonitorState = {
	available: boolean;
	active: boolean;
	uptimeDays: number;
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
