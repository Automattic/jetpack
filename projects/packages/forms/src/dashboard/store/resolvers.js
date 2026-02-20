import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { INVALIDATE_FILTERS, INVALIDATE_COUNTS } from './action-types.js';

export const getFilters =
	() =>
	async ( { dispatch } ) => {
		const results = await apiFetch( {
			path: '/wp/v2/feedback/filters',
		} );
		dispatch.receiveFilters( results );
	};

getFilters.shouldInvalidate = action => action.type === INVALIDATE_FILTERS;

/**
 * Resolver for fetching counts based on current query parameters.
 *
 * @param {object} queryParams - Query parameters for filtering counts.
 * @return {void}
 */
export const getCounts =
	( queryParams = {} ) =>
	async ( { dispatch } ) => {
		const params = {};
		if ( queryParams?.search ) {
			params.search = queryParams.search;
		}
		if ( queryParams?.parent ) {
			params.parent = queryParams.parent;
		}
		if ( queryParams?.before ) {
			params.before = queryParams.before;
		}
		if ( queryParams?.after ) {
			params.after = queryParams.after;
		}
		if ( queryParams?.is_unread !== undefined ) {
			params.is_unread = queryParams.is_unread;
		}

		const path = addQueryArgs( '/wp/v2/feedback/counts', params );
		const response = await apiFetch( { path } );
		dispatch.setCounts( response, queryParams );
	};

getCounts.shouldInvalidate = action => action.type === INVALIDATE_COUNTS;
