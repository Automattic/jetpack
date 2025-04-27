import apiFetch from '@wordpress/api-fetch';
import { INVALIDATE_FILTERS } from './action-types';

export const getFilters =
	() =>
	async ( { dispatch } ) => {
		const results = await apiFetch( {
			path: 'wp/v2/feedback/filters',
		} );
		dispatch.receiveFilters( results );
	};

getFilters.shouldInvalidate = action => action.type === INVALIDATE_FILTERS;
