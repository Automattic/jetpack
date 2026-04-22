/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { isMockMode, mockActivityLogResponse, mockBackups, mockPolicies, mockSize } from './mock';
import type {
	ActivityLogResponse,
	BackupEntry,
	SiteRewindPoliciesResponse,
	SiteRewindSizeResponse,
} from './types';

// All fetchers target local `/jetpack/v4/…` endpoints that proxy to
// WPCOM using the site's Jetpack connection. `siteId` is resolved
// server-side, so it is not part of any path or argument here.
//
// When `isMockMode()` is true (via the `?jpb-mock=1` URL param) the
// fetchers short-circuit to fixtures from `./mock` so the Overview can
// be designed and QAed without a real backup plan on the site.

/**
 *
 */
export async function fetchBackups(): Promise< BackupEntry[] > {
	if ( isMockMode() ) {
		return mockBackups;
	}
	return apiFetch< BackupEntry[] >( { path: '/jetpack/v4/backups' } );
}

/**
 *
 * @param root0
 * @param root0.number
 * @param root0.aggregate
 * @param root0.after
 * @param root0.before
 */
export async function fetchActivityLog( {
	number = 1000,
	aggregate = false,
	after,
	before,
}: {
	number?: number;
	aggregate?: boolean;
	after?: string;
	before?: string;
} = {} ): Promise< ActivityLogResponse > {
	if ( isMockMode() ) {
		return mockActivityLogResponse;
	}
	const path = addQueryArgs( '/jetpack/v4/site/backup/activity-log', {
		number,
		aggregate,
		after,
		before,
	} );
	return apiFetch< ActivityLogResponse >( { path } );
}

/**
 *
 */
export async function fetchBackupPolicies(): Promise< SiteRewindPoliciesResponse > {
	if ( isMockMode() ) {
		return mockPolicies;
	}
	return apiFetch< SiteRewindPoliciesResponse >( { path: '/jetpack/v4/site/backup/policies' } );
}

/**
 *
 */
export async function fetchBackupSize(): Promise< SiteRewindSizeResponse > {
	if ( isMockMode() ) {
		return mockSize;
	}
	return apiFetch< SiteRewindSizeResponse >( { path: '/jetpack/v4/site/backup/size' } );
}

/**
 *
 */
export async function enqueueBackup(): Promise< void > {
	if ( isMockMode() ) {
		return;
	}
	await apiFetch( {
		path: '/jetpack/v4/site/backup/enqueue',
		method: 'POST',
	} );
}
