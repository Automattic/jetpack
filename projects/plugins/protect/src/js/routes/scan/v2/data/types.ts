/**
 * Re-exports the canonical Threat shape from `@automattic/jetpack-scan`
 * plus Protect-specific response wrappers. The Threat shape is the
 * upstream type rendered by ThreatsDataViews, so we never define our
 * own.
 *
 * The Protect-side response shapes mirror
 * `projects/packages/scan/src/js/data/types.ts` so the same WPCOM
 * proxy responses parse cleanly here.
 */
import type { Threat } from '@automattic/jetpack-scan';

export type { Threat, ThreatStatus } from '@automattic/jetpack-scan';

/**
 * Active-scan response shape. Mirrors the WPCOM `wpcom/v2 /sites/:siteId/scan`
 * surface that the `jetpack/v4/site/scan` REST bridge proxies to.
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
 * Scan-history response shape. Mirrors upstream — each entry is a past
 * scan run with its threat list.
 */
export interface SiteScanHistoryResponse {
	threats: Threat[];
}

/**
 * Scan threat-counts response shape. Drives any UI surface that needs
 * a quick tally of the current/fixed/ignored counts.
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
