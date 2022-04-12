export const SET_SEARCH_PRICING = 'SET_SEARCH_PRICING';

/**
 * Action to set search pricing
 *
 * @param {*} options - pricing object.
 * @returns {object} - an action object.
 */
export function setSearchPricing( options ) {
	return {
		type: 'SET_SEARCH_PRICING',
		options,
	};
}

export default { setSearchPricing };
