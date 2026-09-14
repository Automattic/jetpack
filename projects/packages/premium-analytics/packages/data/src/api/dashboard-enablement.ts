/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const ENABLED_SETTING = 'jetpack_premium_analytics_enabled';

type DashboardSettings = Partial< Record< typeof ENABLED_SETTING, boolean > >;

/**
 * Switch the dashboard off for the site through core's settings route, the same option
 * the classic Stats invitation switches on. It takes effect on the next request, so the
 * caller navigates away once it resolves.
 *
 * The route answers 200 with whatever it stored and drops a key it does not know, so
 * resolution rides on the echo rather than on the status.
 *
 * @return The updated settings.
 */
export async function disableDashboard(): Promise< DashboardSettings > {
	const settings = await apiFetch< DashboardSettings >( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: { [ ENABLED_SETTING ]: false },
	} );

	if ( settings?.[ ENABLED_SETTING ] !== false ) {
		throw new Error( `The settings route did not switch ${ ENABLED_SETTING } off.` );
	}

	return settings;
}
