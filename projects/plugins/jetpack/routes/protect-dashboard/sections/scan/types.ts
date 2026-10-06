import type { DashboardContext } from '../types';
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

/** Undefined when PHP registered no Scan section. */
export type ScanContext = DashboardContext< ScanState | undefined >;
