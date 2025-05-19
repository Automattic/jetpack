// Shared types for dashboard integrations

export interface Integration {
	type: 'plugin' | 'service';
	slug: string;
	id: string;
	pluginFile?: string | null;
	isInstalled: boolean;
	isActive: boolean;
	isConnected: boolean;
	version?: string | null;
	settingsUrl?: string | null;
	details: Record< string, unknown >;
}
