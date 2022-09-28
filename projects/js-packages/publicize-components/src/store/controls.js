import apiFetch from '@wordpress/api-fetch';

/**
 * Trigger an API Fetch request.
 *
 * @param {Object} action - Action Object.
 * @param {Object} action.path - Action path.
 * @returns {Promise} Fetch request promise.
 */
const fetchFromApi = ( { path } ) => {
	return apiFetch( { path } );
};

export default {
	FETCH_FROM_API: fetchFromApi,
};
