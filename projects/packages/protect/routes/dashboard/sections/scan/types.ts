import type { DashboardContext } from '../types';
import type { Threat } from '@automattic/jetpack-scan';

/** A threat as the dashboard's PHP shapes it, with the plugin's own name and directory icon. */
export type ScanThreat = Omit< Threat, 'extension' > & {
	source?: string | null;
	context?: { line: number; code: string }[];
	vulnerabilities?: { id?: string; title?: string; source?: string }[];
	extension?: Threat[ 'extension' ] & {
		icon?: string | null;
		/** Admin links for the current user, each only when it applies. */
		actions?: { update?: string; deactivate?: string; delete?: string; details?: string };
	};
};

export type ScanState = {
	hasPlan: boolean;
	url: string;
	error: boolean;
	scanning?: boolean;
	lastChecked?: string | null;
	/** How far a running scan has got, as a percentage, when Scan reports it. */
	progress?: number | null;
	pluginsChecked?: number;
	themesChecked?: number;
	threats?: ScanThreat[];
	/** Threats the site ignored, once fetched from Scan history. */
	ignored?: ScanThreat[];
};

/** Undefined when PHP registered no Scan section. */
export type ScanContext = DashboardContext< ScanState | undefined >;
