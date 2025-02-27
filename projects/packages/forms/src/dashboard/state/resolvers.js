import apiFetch from '@wordpress/api-fetch';

export const getFilters =
	() =>
	async ( { dispatch } ) => {
		const results = await apiFetch( {
			path: 'wp/v2/feedback/filters',
		} );
		dispatch.receiveFilters( results );
	};

// TODO: invalidate properly..
// getFilters.shouldInvalidate = ( action, kind, name ) => {

// };
