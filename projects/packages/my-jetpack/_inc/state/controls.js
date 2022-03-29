/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createRegistryControl } from '@wordpress/data';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import { FETCH_PURCHASES, REFRESH_CONNECTED_PLUGINS } from './actions';
import { REST_API_SITE_PURCHASES_ENDPOINT } from './constants';

/**
 * Effect handler which will sync the purchases with the server.
 *
 * @returns {Promise} - Promise which resolves when the purchases are fetched.
 */
function requestPurchases() {
	return new Promise( ( resolve, reject ) => {
		apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ).then( resolve ).catch( reject );
	} );
}

const refreshConnectedPluginsControl = createRegistryControl( registry => action => {
	registry.dispatch( CONNECTION_STORE_ID ).refreshConnectedPlugins();
	return action;
} );

export default {
	[ FETCH_PURCHASES ]: requestPurchases,
	[ REFRESH_CONNECTED_PLUGINS ]: refreshConnectedPluginsControl,
};
