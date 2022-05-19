/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../store';

export const fetchEndpoint = ( { endpoint = '', method = 'GET', data = null } = {} ) => {
	const store = select( STORE_ID );
	const apiRootUrl = store.getAPIRootUrl();

	return apiFetch( {
		path: `${ apiRootUrl }${ endpoint }`,
		method,
		...( data ? { data } : {} ),
	} );
};
