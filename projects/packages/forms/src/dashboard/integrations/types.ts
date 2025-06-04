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

export interface IntegrationCardProps {
	isExpanded: boolean;
	onToggle: () => void;
	data?: Integration;
	refreshStatus: () => void;
}

export interface JPFormsBlocksDefaults {
	formsResponsesUrl?: string;
	formsResponsesSpamUrl?: string;
}

export interface JPFormsBlocksWindow extends Window {
	jpFormsBlocks?: {
		defaults?: JPFormsBlocksDefaults;
	};
}
