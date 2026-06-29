/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { isMockMode, mockSiteScan, mockSiteScanCounts, mockSiteScanHistory } from './mock';
import type {
	FixThreatsResponse,
	FixThreatsStatusResponse,
	SiteScanCountsResponse,
	SiteScanHistoryResponse,
	SiteScanResponse,
} from './types';

// All fetchers target local `/jetpack/v4/site/scan/*` endpoints that
// proxy to WPCOM using the site's Jetpack connection. `siteId` is
// resolved server-side, so it is not part of any path or argument here.
//
// When `isMockMode()` is true (via the `?jps-mock=1` URL param) the
// fetchers short-circuit to fixtures from `./mock` so the overview can
// be designed and QAed without a Scan plan on the site. Mutations in
// mock mode short-circuit to a resolved promise — no real requests fire.

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

/**
 * Trigger a fresh scan via `POST /jetpack/v4/site/scan/enqueue`. Resolves
 * to the WPCOM acknowledgement (typically `{ success: true }`); the
 * `siteScanQuery` cache picks up the new state on its next refetch.
 */
export async function enqueueScan(): Promise< unknown > {
	if ( isMockMode() ) {
		return Promise.resolve( { success: true } );
	}
	return apiFetch( {
		path: '/jetpack/v4/site/scan/enqueue',
		method: 'POST',
	} );
}

/**
 *
 * @param threatId
 */
export async function ignoreThreat( threatId: string | number ): Promise< unknown > {
	if ( isMockMode() ) {
		return Promise.resolve( { ok: true } );
	}
	return apiFetch( {
		path: `/jetpack/v4/site/scan/threat/${ encodeURIComponent( String( threatId ) ) }/ignore`,
		method: 'POST',
	} );
}

/**
 *
 * @param threatId
 */
export async function unignoreThreat( threatId: string | number ): Promise< unknown > {
	if ( isMockMode() ) {
		return Promise.resolve( { ok: true } );
	}
	return apiFetch( {
		path: `/jetpack/v4/site/scan/threat/${ encodeURIComponent( String( threatId ) ) }/unignore`,
		method: 'POST',
	} );
}

/**
 *
 * @param threatIds
 */
export async function fixThreats(
	threatIds: ReadonlyArray< string | number >
): Promise< FixThreatsResponse > {
	if ( isMockMode() ) {
		return Promise.resolve( {
			ok: true,
			threats: Object.fromEntries(
				threatIds.map( id => [ String( id ), { status: 'in_progress' } ] )
			),
		} );
	}
	return apiFetch< FixThreatsResponse >( {
		path: '/jetpack/v4/site/scan/threats/fix',
		method: 'POST',
		data: { threat_ids: threatIds.map( id => String( id ) ) },
	} );
}

/**
 *
 * @param threatIds
 */
export async function fetchFixThreatsStatus(
	threatIds: ReadonlyArray< string | number >
): Promise< FixThreatsStatusResponse > {
	if ( isMockMode() ) {
		return Promise.resolve( {
			ok: true,
			threats: Object.fromEntries( threatIds.map( id => [ String( id ), { status: 'fixed' } ] ) ),
		} );
	}
	return apiFetch< FixThreatsStatusResponse >( {
		path: addQueryArgs( '/jetpack/v4/site/scan/threats/fix-status', {
			threat_ids: threatIds.map( id => String( id ) ),
		} ),
	} );
}
