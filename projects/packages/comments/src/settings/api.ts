import apiFetch from '@wordpress/api-fetch';
import type { Settings } from './types';

/**
 * Save settings through Jetpack's settings route, which turns modules on and off by slug too.
 *
 * @param updates - Settings to change.
 * @return The route's response.
 */
export function saveSettings( updates: Partial< Settings > ) {
	return apiFetch( { path: '/jetpack/v4/settings', method: 'POST', data: updates } );
}

/**
 * Read every setting Jetpack's settings route knows, module states included.
 *
 * @return Settings by key.
 */
export function fetchSettings() {
	return apiFetch< Partial< Settings > >( { path: '/jetpack/v4/settings' } );
}
