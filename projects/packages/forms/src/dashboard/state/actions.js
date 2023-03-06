/**
 * Internal dependencies
 */
import {
	ASYNC_ROUTINE_DISPATCH,
	FINISH_RESOLUTION,
	RESPONSES_FETCH,
	RESPONSES_FETCH_FAIL,
	RESPONSES_FETCH_RECEIVE,
} from './action-types';

/**
 * One dispatch async to rule them all
 *
 * @param {Function} apply - The function to apply the dispatch
 * @param {Array} args     - Arguments to be passed onto the function
 * @returns {object}       - The action object
 */
export const dispatchAsync = ( apply, args = [] ) => ( {
	type: ASYNC_ROUTINE_DISPATCH,
	apply,
	args,
} );

/**
 * Action creator allows for custom resolution on resolvers from core store.
 * See: https://github.com/WordPress/gutenberg/blob/trunk/packages/data/src/redux-store/metadata/actions.js
 * See: https://unfoldingneurons.com/2020/wordpress-data-store-properties-resolvers
 *
 * @param {string} selectorName - The selector to set as finished
 * @param {Array} args          - Arguments to be passed to the selector
 * @returns {object}            - The action object
 */
export const finishResolution = ( selectorName, args ) => ( {
	type: FINISH_RESOLUTION,
	selectorName,
	args,
} );

export const fetchResponses = () => {
	return {
		type: RESPONSES_FETCH,
	};
};

export const receiveResponsesFetch = payload => {
	return {
		type: RESPONSES_FETCH_RECEIVE,
		responses: payload.responses,
		total: payload.total,
	};
};

export const failResponsesFetch = error => {
	return {
		type: RESPONSES_FETCH_FAIL,
		error,
	};
};
