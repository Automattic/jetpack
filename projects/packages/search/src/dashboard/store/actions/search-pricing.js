export const SET_SEARCH_PRICING = 'SET_SEARCH_PRICING';

/**
 * Action to set site stats (e.g. record usage)
 *
 * @param {*} options - stats.
 * @returns {object} - an action object.
 */
export function setSearchPricing( options ) {
	return {
		type: 'SET_SEARCH_PRICING',
		options,
	};
}

export default { setSearchPricing };
