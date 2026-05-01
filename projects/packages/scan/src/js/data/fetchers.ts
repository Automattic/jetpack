/* eslint-disable jsdoc/require-description, jsdoc/require-returns */

import apiFetch from '@wordpress/api-fetch';
import { isMockMode, mockSiteScan, mockSiteScanCounts, mockSiteScanHistory } from './mock';
import type { SiteScanCountsResponse, SiteScanHistoryResponse, SiteScanResponse } from './types';

// All fetchers target local `/jetpack/v4/site/scan/*` endpoints that
// proxy to WPCOM using the site's Jetpack connection. `siteId` is
// resolved server-side, so it is not part of any path or argument here.
//
// When `isMockMode()` is true (via the `?jps-mock=1` URL param) the
// fetchers short-circuit to fixtures from `./mock` so the overview can
// be designed and QAed without a Scan plan on the site.
//
// Phase 0 wires only the read paths (and only against fixtures). Phase 1+
// fills in the WPCOM-bridged implementations and the mutation set
// (`enqueue`, `fixThreat`, `ignoreThreat`, `unignoreThreat`,
// `fixThreats`, `fixThreatsStatus`).

/**
 *
 */
export async function fetchSiteScan(): Promise< SiteScanResponse > {
	if ( isMockMode() ) {
		return mockSiteScan;
	}
	return apiFetch< SiteScanResponse >( { path: '/jetpack/v4/site/scan' } );
}

/**
 *
 */
export async function fetchSiteScanHistory(): Promise< SiteScanHistoryResponse > {
	if ( isMockMode() ) {
		return mockSiteScanHistory;
	}
	return apiFetch< SiteScanHistoryResponse >( {
		path: '/jetpack/v4/site/scan/history',
	} );
}

/**
 *
 */
export async function fetchSiteScanCounts(): Promise< SiteScanCountsResponse > {
	if ( isMockMode() ) {
		return mockSiteScanCounts;
	}
	return apiFetch< SiteScanCountsResponse >( {
		path: '/jetpack/v4/site/scan/counts',
	} );
}
