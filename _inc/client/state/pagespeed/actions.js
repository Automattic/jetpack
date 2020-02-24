/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import {
	JETPACK_GET_PAGESPEED_INSIGHTS,
	JETPACK_GET_PAGESPEED_INSIGHTS_SUCCESS,
	JETPACK_GET_PAGESPEED_INSIGHTS_FAIL,
} from 'state/action-types';
import { translate as __ } from 'i18n-calypso';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';

export const getPagespeedInsights = url => {
	return dispatch => {
		dispatch( {
			type: JETPACK_GET_PAGESPEED_INSIGHTS,
			url: url,
		} );
		dispatch( removeNotice( 'pagespeed-insights-fetch' ) );
		dispatch( removeNotice( 'pagespeed-insights-fetched' ) );
		dispatch( removeNotice( 'pagespeed-insights-error' ) );
		dispatch(
			createNotice( 'is-info', __( 'Fetching pagespeed insights…' ), {
				id: 'pagespeed-insights-fetch',
			} )
		);
		return restApi
			.getPagespeedInsights( url )
			.then( data => {
				dispatch( removeNotice( 'pagespeed-insights-fetch' ) );
				dispatch( {
					type: JETPACK_GET_PAGESPEED_INSIGHTS_SUCCESS,
					response: data,
				} );
				dispatch(
					createNotice( 'is-success', __( 'Fetched pagespeed insights' ), {
						id: 'pagespeed-insights-fetched',
						duration: 2000,
					} )
				);

				return data;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_GET_PAGESPEED_INSIGHTS_FAIL,
					error: error.response,
				} );
				dispatch( removeNotice( 'pagespeed-insights-fetch' ) );
				dispatch(
					createNotice( 'is-error', __( 'Failed to fetch pagespeed insights' ), {
						id: 'pagespeed-insights-error',
					} )
				);
			} );
	};
};
