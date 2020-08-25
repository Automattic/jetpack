/**
 * External dependencies
 */
import { throttle } from 'lodash';
import apiFetch from '@wordpress/api-fetch';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { setConnectionTestResults, setTweets } from './actions';

/**
 * Effect handler which will refresh the connection test results.
 *
 * @param {Object} action Action which had initiated the effect handler.
 * @param {Object} store  Store instance.
 *
 * @return {Object} Refresh connection test results action.
 */
export async function refreshConnectionTestResults( action, store ) {
	const { dispatch } = store;

	try {
		const results = await apiFetch( { path: '/wpcom/v2/publicize/connection-test-results' } );
		return dispatch( setConnectionTestResults( results ) );
	} catch ( error ) {
		// Refreshing connections failed
	}
}

async function __refreshTweets( action, store ) {
	const { dispatch } = store;

	try {
		const results = await apiFetch( {
			path: '/wpcom/v2/tweetstorm/parse',
			data: {
				blocks: action.content.map( block => ( {
					attributes: block.attributes,
					block: serialize( block ),
					clientId: block.clientId,
				} ) ),
			},
			method: 'POST',
		} );
		return dispatch( setTweets( results ) );
	} catch ( error ) {
		// Refreshing tweets failed
	}
}

/**
 * Effect handler which will refreshing the state of the tweets..
 *
 * @param {object} action - Action which had initiated the effect handler.
 * @param {object} store - Store instance.
 *
 * @returns {object} Refresh tweets results action.
 */
export const refreshTweets = throttle( __refreshTweets, 2000, { leading: true, trailing: true } );

export default {
	REFRESH_CONNECTION_TEST_RESULTS: refreshConnectionTestResults,
	REFRESH_TWEETS: refreshTweets,
};
