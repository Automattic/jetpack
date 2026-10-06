/** The Monitor section's state from PHP. */
export type MonitorState = {
	available: boolean;
	active: boolean;
};

export type UptimeDay = {
	date: string;
	status: 'up' | 'down' | 'monitor_inactive';
	downtimeInMinutes: number;
};
