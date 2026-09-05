/**
 * WordPress dependencies
 */
import { getAdminUrl } from '@automattic/jetpack-script-data';

/**
 * Leaves the dashboard for classic Stats, where the invitation back lives.
 *
 * Its own module so the confirmation flow can be tested: jsdom implements no navigation.
 */
export function returnToClassicStats(): void {
	window.location.assign( getAdminUrl( 'admin.php?page=stats' ) );
}
