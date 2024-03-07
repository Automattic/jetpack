/**
 * External dependencies
 */
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { getStatsHighlightsEndpoint } from './constants';

const myJetpackResolvers = {
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
