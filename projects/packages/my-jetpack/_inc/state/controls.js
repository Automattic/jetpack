/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { REST_API_SITE_PURCHASES_ENDPOINT } from './constants';

const FETCH_PURCHASES = () => {
	return new Promise( ( resolve, reject ) => {
		apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ).then( resolve ).catch( reject );
	} );
};

export default {
	FETCH_PURCHASES,
};
