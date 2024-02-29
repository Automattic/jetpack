/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { getStatsHighlightsEndpoint } from './constants';

const myJetpackResolvers = {
	getAvailableLicenses:
		() =>
		async ( { dispatch } ) => {
			dispatch.setAvailableLicensesIsFetching( true );

			try {
				const { apiRoot, apiNonce } = window?.myJetpackRest || {};
				restApi.setApiRoot( apiRoot );
				restApi.setApiNonce( apiNonce );
				const result = await restApi.getUserLicenses();

				if ( result && result.items ) {
					dispatch.setAvailableLicenses(
						result.items.filter(
							( { attached_at, revoked_at } ) => attached_at === null && revoked_at === null
						)
					);
				} else {
					dispatch.setAvailableLicenses( [] );
				}
			} catch ( error ) {
				dispatch.setAvailableLicenses( [] );
			} finally {
				dispatch.setAvailableLicensesIsFetching( false );
			}
		},

	getStatsCounts: () => async props => {
		const { dispatch, registry } = props;

		dispatch.setStatsCountsIsFetching( true );

		const blogId = registry.select( CONNECTION_STORE_ID ).getBlogId();

		try {
			dispatch.setStatsCounts( await apiFetch( { path: getStatsHighlightsEndpoint( blogId ) } ) );
			dispatch.setStatsCountsIsFetching( false );
		} catch ( error ) {
			dispatch.setStatsCountsIsFetching( false );
		}
	},
};

export default {
	...myJetpackResolvers,
};
