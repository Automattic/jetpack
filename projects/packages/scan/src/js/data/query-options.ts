import { queryOptions } from '@tanstack/react-query';
import { fetchSiteScan, fetchSiteScanCounts, fetchSiteScanHistory } from './fetchers';

// TanStack Query factory functions. Names mirror the Calypso source so
// future phases can port hooks 1:1.

/**
 * Active scan query — returns the current scan state and the active
 * (un-ignored, un-fixed) threats.
 *
 * @return queryOptions
 */
export const siteScanQuery = () =>
	queryOptions( {
		queryKey: [ 'jetpack', 'site', 'scan' ] as const,
		queryFn: () => fetchSiteScan(),
	} );

/**
 * Scan-history query — list of past scans and their threats.
 *
 * @return queryOptions
 */
export const siteScanHistoryQuery = () =>
	queryOptions( {
		queryKey: [ 'jetpack', 'site', 'scan', 'history' ] as const,
		queryFn: () => fetchSiteScanHistory(),
	} );

/**
 * Threat-counts query — drives the tab counts in the overview header.
 *
 * @return queryOptions
 */
export const siteScanCountsQuery = () =>
	queryOptions( {
		queryKey: [ 'jetpack', 'site', 'scan', 'counts' ] as const,
		queryFn: () => fetchSiteScanCounts(),
	} );
