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
			dispatch.setPurchases( await apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ) );
			dispatch.setPurchasesIsFetching( false );
		} catch ( error ) {
			dispatch.setPurchasesIsFetching( false );
			throw error;
		}
	},
};

export default {
	...myJetpackResolvers,
};
