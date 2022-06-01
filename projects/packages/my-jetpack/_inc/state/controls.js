import apiFetch from '@wordpress/api-fetch';
import { FETCH_PURCHASES } from './actions';
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

export default {
	[ FETCH_PURCHASES ]: requestPurchases,
};
