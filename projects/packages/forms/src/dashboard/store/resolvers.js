import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { INVALIDATE_FILTERS, INVALIDATE_COUNTS } from './action-types';

export const getFilters =
	() =>
	async ( { dispatch } ) => {
		const results = await apiFetch( {
			path: 'wp/v2/feedback/filters',
		} );
		dispatch.receiveFilters( results );
	};

getFilters.shouldInvalidate = action => action.type === INVALIDATE_FILTERS;

export const getCounts =
	query =>
	async ( { dispatch } ) => {
		const params = {};
		if ( query?.search ) {
			params.search = query.search;
		}
		if ( query?.parent ) {
			params.parent = query.parent;
		}
		if ( query?.before ) {
			params.before = query.before;
		}
		if ( query?.after ) {
			params.after = query.after;
		}
		const path = addQueryArgs( '/wp/v2/feedback/counts', params );
		const results = await apiFetch( {
			path,
		} );
		dispatch.receiveCounts( results );
	};

getCounts.shouldInvalidate = action => action.type === INVALIDATE_COUNTS;
