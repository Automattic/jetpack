import type { Threat } from '@automattic/jetpack-scan';

export type { Threat };

/**
 * Site-data hydration shape rendered into `JPSCAN_INITIAL_STATE` by
 * `class-initial-state.php`. Mirror any field changes there in this
 * type so consumers stay typed.
 */
export interface JetpackScanInitialState {
	API: {
		WP_API_root: string;
		WP_API_nonce: string;
	};
	jetpackStatus: {
		calypsoSlug: string;
	};
	siteData: {
		id: number | string;
		title: string;
		adminUrl: string;
		slug: string;
		gmtOffset: number;
		timezoneString: string;
		locale: string;
	};
	assets: {
		buildUrl: string;
	};
}

/**
 * Active-scan response shape. Mirrors the WPCOM `wpcom/v2 /sites/:siteId/scan`
 * surface that the `jetpack/v4/site/scan` REST bridge proxies to. Kept
 * intentionally narrow for Phase 0; later phases extend this with the
 * full Calypso shape.
 */
export interface SiteScanResponse {
	state: 'idle' | 'enqueued' | 'running' | 'success' | 'error' | 'unavailable';
	threats: Threat[];
	hasNeverRun?: boolean;
	mostRecent?: {
		timestamp: string;
		isInitial: boolean;
	};
	current?: {
		isInitial: boolean;
		progress: number;
	};
}

/**
 * Scan-history response shape. Each entry is a past scan run with its
 * threat list. Phase 0 ships an empty default; Phase 2 wires the bridge.
 */
export interface SiteScanHistoryResponse {
	threats: Threat[];
}

/**
 * Scan threat-counts response shape. Drives the tab counts in the
 * overview header.
 */
export interface SiteScanCountsResponse {
	current: number;
	fixed: number;
	ignored: number;
}

/**
 * Auto-fixer status reported per threat by `/threats/fix-status`.
 */
export type ThreatFixStatus = 'in_progress' | 'fixed' | 'not_fixed' | 'not_found' | string;

/**
 * Response shape for `POST /threats/fix` and `GET /threats/fix-status`.
 */
export interface FixThreatsResponse {
	ok: boolean;
	threats: Record< string, { status: ThreatFixStatus; error?: string } >;
}

export type FixThreatsStatusResponse = FixThreatsResponse;
