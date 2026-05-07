/**
 * TanStack Query factory functions for Protect's Scan v2 surface.
 *
 * The shared `[ 'protect', 'scan' ]` prefix lets us invalidate every
 * Scan-related cache entry in one call (e.g. after `enqueueScan()` or
 * a successful fix) without enumerating each query key.
 *
 * Naming mirrors `projects/packages/scan/src/js/data/query-options.ts`
 * so future phases can port hooks 1:1 from `packages/scan` without
 * translation.
 */

import { queryOptions } from '@tanstack/react-query';
import { fetchSiteScan, fetchSiteScanCounts, fetchSiteScanHistory } from './fetchers';

export const SCAN_QUERY_PREFIX = [ 'protect', 'scan' ] as const;

/**
 * Active scan query — returns the current scan state and the active
 * (un-ignored, un-fixed) threats.
 *
 * @return queryOptions
 */
export const siteScanQuery = () =>
	queryOptions( {
		queryKey: [ ...SCAN_QUERY_PREFIX, 'site' ] as const,
		queryFn: () => fetchSiteScan(),
	} );

/**
 * Scan-history query — list of past scans and their threats.
 *
 * @return queryOptions
 */
export const siteScanHistoryQuery = () =>
	queryOptions( {
		queryKey: [ ...SCAN_QUERY_PREFIX, 'history' ] as const,
		queryFn: () => fetchSiteScanHistory(),
	} );

/**
 * Threat-counts query — drives any UI surface that needs a tally of
 * the current/fixed/ignored threat counts.
 *
 * @return queryOptions
 */
export const siteScanCountsQuery = () =>
	queryOptions( {
		queryKey: [ ...SCAN_QUERY_PREFIX, 'counts' ] as const,
		queryFn: () => fetchSiteScanCounts(),
	} );
