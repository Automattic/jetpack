import type { DashboardContext } from '../types';
import type { Threat } from '@automattic/jetpack-scan';

/** A threat as the dashboard's PHP shapes it, with the plugin's own name and directory icon. */
export type ScanThreat = Omit< Threat, 'extension' > & {
	source?: string | null;
	context?: { line: number; code: string }[];
	vulnerabilities?: { id?: string; title?: string; source?: string }[];
	/** The table and row a database threat was found in. */
	database?: {
		table: string;
		pkColumn?: string | null;
		pkValue?: string | number | null;
		details?: Record< string, unknown >;
	} | null;
	extension?: Threat[ 'extension' ] & {
		icon?: string | null;
		/** Whether the installed plugin or theme is in use; `parent` is the active theme's parent. */
		state?: 'active' | 'inactive' | 'parent' | null;
		/** Admin links for the current user, and whether the dashboard can delete it, each only when it applies. */
		actions?: { update?: string; deactivate?: string; delete?: boolean; details?: string };
	};
};

export type ScanState = {
	hasPlan: boolean;
	/** False when the host doesn't let the site ignore threats. */
	canIgnore?: boolean;
	/** Where to set Scan's server credentials with a plan, or to buy Scan without one; empty where the host needs none. */
	url: string;
	/** Whether Scan has server credentials to auto-fix with; null when unknown. Only with a plan. */
	hasCredentials?: boolean | null;
	/** Which upsell copy this site sees, without Scan. */
	upsellVariant?: number;
	/** Whether a filter chose `upsellVariant`, so it's shown without rotating. */
	upsellVariantForced?: boolean;
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
