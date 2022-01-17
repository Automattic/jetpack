/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const REST_API_SITE_PURCHASES_ENDPOINT = 'my-jetpack/v1/site/purchases';

/**
 * React custom hook to get the site purchases data.
 *
 * @returns {object} site purchases data
 */
export default function usePurchases() {
	const [ data, setData ] = useState( [] );

	// @todo: confirm whether we should filter out the purchases.
	useEffect( () => {
		apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } )
			.then( setData )
			.catch( () => setData( [] ) );
	}, [ setData ] );

	return data;
}
