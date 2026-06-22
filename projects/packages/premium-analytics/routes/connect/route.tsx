/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { redirect } from '@wordpress/route';

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
