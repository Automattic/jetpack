/**
 * REST fetchers for Protect's Scan v2 surface.
 *
 * All fetchers target local `/jetpack/v4/site/scan/*` endpoints that
 * proxy to WPCOM using the site's Jetpack connection. `siteId` is
 * resolved server-side, so it is not part of any path or argument here.
 *
 * When `isProtectMockMode()` is true (via the `?jpprotect-mock=1` URL
 * param) the fetchers short-circuit to fixtures from `./mock` so the
 * Scan v2 surface can be designed and QAed without a Scan plan on the
 * site. Mutations in mock mode short-circuit to a resolved promise — no
 * real requests fire.
 *
 * Mirrors `projects/packages/scan/src/js/data/fetchers.ts` deliberately:
 * Protect calls the same REST bridges, so keeping the conventions
 * (return shapes, mock short-circuits, query-string assembly) in
 * lockstep means later phases can port hooks 1:1 without translation.
 */

import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { isProtectMockMode } from './mock';
import {
	mockFixThreatsResponse,
	mockFixThreatsStatusResponse,
	mockSiteScan,
	mockSiteScanCounts,
	mockSiteScanHistory,
} from './mock/fixtures';
import type {
	FixThreatsResponse,
	FixThreatsStatusResponse,
	SiteScanCountsResponse,
	SiteScanHistoryResponse,
	SiteScanResponse,
} from './types';

const REST_PREFIX = '/jetpack/v4/site/scan';

/**
 * Fetch the active scan state and current threats.
 *
 * @return Active-scan response.
 */
export async function fetchSiteScan(): Promise< SiteScanResponse > {
	if ( isProtectMockMode() ) {
		return mockSiteScan;
	}
	return apiFetch< SiteScanResponse >( { path: REST_PREFIX } );
}

/**
 * Fetch the historic scan results (fixed and ignored threats).
 *
 * @return Scan-history response.
 */
export async function fetchSiteScanHistory(): Promise< SiteScanHistoryResponse > {
	if ( isProtectMockMode() ) {
		return mockSiteScanHistory;
	}
	return apiFetch< SiteScanHistoryResponse >( { path: `${ REST_PREFIX }/history` } );
}

/**
 * Fetch threat counts (current/fixed/ignored) used by header summaries.
 *
 * @return Counts response.
 */
export async function fetchSiteScanCounts(): Promise< SiteScanCountsResponse > {
	if ( isProtectMockMode() ) {
		return mockSiteScanCounts;
	}
	return apiFetch< SiteScanCountsResponse >( { path: `${ REST_PREFIX }/counts` } );
}

/**
 * Trigger a fresh scan via `POST /jetpack/v4/site/scan/enqueue`. Resolves
 * to the WPCOM acknowledgement (typically `{ success: true }`); the
 * `siteScanQuery` cache picks up the new state on its next refetch.
 *
 * @return WPCOM acknowledgement payload.
 */
export async function enqueueScan(): Promise< unknown > {
	if ( isProtectMockMode() ) {
		return Promise.resolve( { success: true } );
	}
	return apiFetch( {
		path: `${ REST_PREFIX }/enqueue`,
		method: 'POST',
	} );
}

/**
 * Mark a single threat as ignored.
 *
 * @param threatId - The threat id to ignore.
 * @return WPCOM acknowledgement payload.
 */
export async function ignoreThreat( threatId: string | number ): Promise< unknown > {
	if ( isProtectMockMode() ) {
		return Promise.resolve( { ok: true } );
	}
	return apiFetch( {
		path: `${ REST_PREFIX }/threat/${ encodeURIComponent( String( threatId ) ) }/ignore`,
		method: 'POST',
	} );
}

/**
 * Reverse an `ignoreThreat()` call.
 *
 * @param threatId - The threat id to un-ignore.
 * @return WPCOM acknowledgement payload.
 */
export async function unignoreThreat( threatId: string | number ): Promise< unknown > {
	if ( isProtectMockMode() ) {
		return Promise.resolve( { ok: true } );
	}
	return apiFetch( {
		path: `${ REST_PREFIX }/threat/${ encodeURIComponent( String( threatId ) ) }/unignore`,
		method: 'POST',
	} );
}

/**
 * Kick off the auto-fixer for one or more threats.
 *
 * @param threatIds - The threat ids to fix.
 * @return Per-threat fixer status (initial `in_progress` for each id).
 */
export async function fixThreats(
	threatIds: ReadonlyArray< string | number >
): Promise< FixThreatsResponse > {
	if ( isProtectMockMode() ) {
		return mockFixThreatsResponse;
	}
	return apiFetch< FixThreatsResponse >( {
		path: `${ REST_PREFIX }/threats/fix`,
		method: 'POST',
		data: { threat_ids: threatIds.map( id => String( id ) ) },
	} );
}

/**
 * Poll the auto-fixer for the current per-threat status.
 *
 * @param threatIds - The threat ids to query.
 * @return Per-threat fixer status.
 */
export async function fetchFixThreatsStatus(
	threatIds: ReadonlyArray< string | number >
): Promise< FixThreatsStatusResponse > {
	if ( isProtectMockMode() ) {
		return mockFixThreatsStatusResponse;
	}
	return apiFetch< FixThreatsStatusResponse >( {
		path: addQueryArgs( `${ REST_PREFIX }/threats/fix-status`, {
			threat_ids: threatIds.map( id => String( id ) ),
		} ),
	} );
}
