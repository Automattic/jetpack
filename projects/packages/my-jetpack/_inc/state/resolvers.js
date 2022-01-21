/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { REST_API_SITE_PURCHASES_ENDPOINT } from './constants';

const myJetpackResolvers = {
	getPurchases: () => async ( { dispatch } ) => {
		dispatch.setPurchasesIsFetching( true );

		try {
			dispatch.setPurchasesIsFetching( false );
			dispatch.setPurchases( await apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ) );
		} catch ( error ) {
			dispatch.setPurchasesIsFetching( false );
			throw error;
		}
	},
};

export default {
	...myJetpackResolvers,
};
