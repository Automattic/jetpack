export const SET_SEARCH_STATS = 'SET_SEARCH_STATS';

/**
 * Action to set site stats (e.g. record usage)
 *
 * @param {*} options - stats.
 * @returns {object} - an action object.
 */
export function setSearchStats( options ) {
	return {
		type: 'SET_SEARCH_STATS',
		options,
	};
}

export default { setSearchStats };
