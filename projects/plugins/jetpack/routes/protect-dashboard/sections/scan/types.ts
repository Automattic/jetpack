import type { Threat } from '@automattic/jetpack-scan';

export type ScanState = {
	hasPlan: boolean;
	url: string;
	error: boolean;
	scanning?: boolean;
	lastChecked?: string | null;
	pluginsChecked?: number;
	themesChecked?: number;
	threats?: Threat[];
};
