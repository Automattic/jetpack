/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const REST_API_SITE_PURCHASES_ENDPOINT = 'my-jetpack/v1/site/purchases';

const FETCH_PURCHASES = () => {
	return new Promise( ( resolve, reject ) => {
		apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ).then( resolve ).catch( reject );
	} );
};

export default {
	FETCH_PURCHASES,
};
