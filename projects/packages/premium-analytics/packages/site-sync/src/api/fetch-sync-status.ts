/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { SYNC_STATUS_PATH } from '../constants';
import type { SyncStatusApiResponse } from '../types';

/**
 * Fetch the current sync status from Jetpack core.
 *
 * @return The current sync status.
 */
export function fetchSyncStatus(): Promise< SyncStatusApiResponse > {
	return apiFetch( { path: SYNC_STATUS_PATH } );
}
