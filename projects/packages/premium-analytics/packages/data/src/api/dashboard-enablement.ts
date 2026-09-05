/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Switch the dashboard off for the site through core's settings route, the same option
 * the classic Stats invitation switches on. It takes effect on the next request, so the
 * caller navigates away once it resolves.
 *
 * @return The updated settings.
 */
export function disableDashboard(): Promise< unknown > {
	return apiFetch( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: { jetpack_premium_analytics_enabled: false },
	} );
}
