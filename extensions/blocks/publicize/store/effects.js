/**
 * External dependencies
 */
import { flatMap, throttle } from 'lodash';
import apiFetch from '@wordpress/api-fetch';
import { serialize } from '@wordpress/blocks';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SUPPORTED_BLOCKS } from '../twitter';
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

/**
 * Handle sending the tweet refresh request.
 *
 * @param {object} action - Action which had initiated the effect handler.
 * @param {object} store - Store instance.
 *
 * @returns {object} Refresh tweets results action.
 */
async function __refreshTweets( action, store ) {
	const { dispatch } = store;

	const topBlocks = select( 'core/editor' ).getBlocks();

	const computeTweetBlocks = ( blocks = [] ) => {
		return flatMap( blocks, ( block = {} ) => {
			if ( SUPPORTED_BLOCKS[ block.name ] ) {
				return block;
			}

			return computeTweetBlocks( block.innerBlocks );
		} );
	};

	const tweetBlocks = computeTweetBlocks( topBlocks );

	try {
		const results = await apiFetch( {
			path: '/wpcom/v2/tweetstorm/parse',
			data: {
				blocks: tweetBlocks.map( block => ( {
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
 * Effect handler which will refreshing the state of the tweets. Tweet refreshes are throttled
 * to once ever 2 seconds.
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
