/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { FULL_SYNC_PATH } from '../constants';

/**
 * Trigger a Jetpack full sync.
 *
 * @return The full-sync trigger response.
 */
export function triggerFullSync(): Promise< unknown > {
	return apiFetch( { path: FULL_SYNC_PATH, method: 'POST' } );
}
