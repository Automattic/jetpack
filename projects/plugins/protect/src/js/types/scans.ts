import { Threat } from './threats';

export type ExtensionStatus = {
	/** The name of the extension. */
	name: string;

	/** The slug of the extension. */
	slug: string;

	/** The version of the extension. */
	version: string;

	/** The threats found in the extension. */
	threats: Threat[];

	/** The type of extension. */
	type: 'plugins' | 'themes';

	/** Whether the extension was checked in the latest scan. */
	checked: boolean;
};

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

	/** The number of plugin threats found in the latest status. */
	numPluginsThreats: number;

	/** The number of theme threats found in the latest status. */
	numThemesThreats: number;

	/** The total number of threats found in the latest status. */
	numThreats: number;

	/** Whether there was an error in the scan results. */
	error: boolean | null;

	/** The error code. */
	errorCode: string | null;

	/** The error message. */
	errorMessage: string | null;

	/** WordPress Core Status */
	core: {
		checked: boolean;
		name: string;
		slug: string;
		threats: Threat[];
		type: 'core';
		version: string;
	} | null;

	/** Plugins Status */
	plugins: ExtensionStatus[];

	/** Themes Status */
	themes: ExtensionStatus[];

	/** File Threats */
	files: Threat[];

	/** Database Threats */
	database: Threat[];
};
