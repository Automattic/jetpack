/**
 * External dependencies
 */
import { redirect } from '@wordpress/route';
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Route guard for /connect.
 * If the site is already connected, redirect to the dashboard.
 */
export const route = {
	beforeLoad: () => {
		const connectionStatus = getScriptData()?.connection?.connectionStatus;

		if ( connectionStatus?.isRegistered ) {
			throw redirect( { to: '/' } );
		}
	},
};
