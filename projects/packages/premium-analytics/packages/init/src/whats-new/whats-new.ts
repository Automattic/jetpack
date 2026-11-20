/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Show the What's new surface with the dashboard's announcements, while its feature flag is on.
 *
 * Imported on demand and never awaited, so the surface stays out of the dashboard's first
 * render. A load that fails leaves the dashboard without it.
 */
export function showWhatsNew(): void {
	if ( ! getScriptData()?.premium_analytics?.whats_new_enabled ) {
		return;
	}

	import( '@automattic/jetpack-announcements' )
		.then( ( { mountWhatsNew } ) => mountWhatsNew( { channels: [ 'premium-analytics' ] } ) )
		.catch( () => undefined );
}
