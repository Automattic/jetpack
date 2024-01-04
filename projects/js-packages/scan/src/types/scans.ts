import { Threat } from '.';

export const SCAN_STATE_UNAVAILABLE = 'unavailable';
export const SCAN_STATE_PROVISIONING = 'provisioning';
export const SCAN_STATE_IDLE = 'idle';
export const SCAN_STATE_SCANNING = 'scanning';

export type ScanState =
	| typeof SCAN_STATE_UNAVAILABLE
	| typeof SCAN_STATE_PROVISIONING
	| typeof SCAN_STATE_IDLE
	| typeof SCAN_STATE_SCANNING;

export type SiteScan = {
	state: ScanState;
	threats: Array< Threat >;
	hasCloud: boolean;
	credentials: [ Record< string, unknown > ];
	reason?: string;
	mostRecent?: {
		timestamp: string;
		progress: number;
		isInitial: boolean;
		duration: number;
		error: boolean;
	};
	current?: {
		timestamp: string;
		progress: number;
		isInitial: boolean;
	};
};
