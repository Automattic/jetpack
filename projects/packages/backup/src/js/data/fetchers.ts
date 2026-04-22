/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type {
	ActivityLogResponse,
	BackupEntry,
	SiteRewindPoliciesResponse,
	SiteRewindSizeResponse,
} from './types';

// All fetchers target local `/jetpack/v4/…` endpoints that proxy to
// WPCOM using the site's Jetpack connection. `siteId` is resolved
// server-side, so it is not part of any path or argument here.

/**
 *
 */
export async function fetchBackups(): Promise< BackupEntry[] > {
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
	return apiFetch< SiteRewindPoliciesResponse >( { path: '/jetpack/v4/site/backup/policies' } );
}

/**
 *
 */
export async function fetchBackupSize(): Promise< SiteRewindSizeResponse > {
	return apiFetch< SiteRewindSizeResponse >( { path: '/jetpack/v4/site/backup/size' } );
}

/**
 *
 */
export async function enqueueBackup(): Promise< void > {
	await apiFetch( {
		path: '/jetpack/v4/site/backup/enqueue',
		method: 'POST',
	} );
}
