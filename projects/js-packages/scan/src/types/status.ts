import { Threat } from './threats.ts';

export type ScanStatus = {
	/** The current status of the scanner. */
	status: 'unavailable' | 'provisioning' | 'idle' | 'scanning' | 'scheduled';

	/** The IDs of fixable threats. */
	fixableThreatIds: number[];

	/** The current scan progress, only available from the Scan API. */
	currentProgress: number | null;

	/** The data source for the scan status. */
	dataSource: 'protect_report' | 'scan_api';

	/** Whether the site currently has extensions not checked in the latest scan. */
	hasUncheckedItems: boolean;

	/** The time the last scan was checked, in YYYY-MM-DD HH:MM:SS format. */
	lastChecked: string | null;

	/** Whether there was an error in the scan results. */
	error: boolean | null;

	/** The error code. */
	errorCode: string | null;

	/** The error message. */
	errorMessage: string | null;

	/** The detected threats. */
	threats: Threat[];
};
