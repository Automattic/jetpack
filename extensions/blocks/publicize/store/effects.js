/**
 * External dependencies
 */
import { flatMap, throttle } from 'lodash';
import apiFetch from '@wordpress/api-fetch';
import { serialize } from '@wordpress/blocks';
import { select, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SUPPORTED_BLOCKS } from '../twitter';

/**
 * Effect handler which will refresh the connection test results.
 *
 * @returns {object} Refresh connection test results action.
 */
export async function refreshConnectionTestResults() {
	try {
		const results = await apiFetch( { path: '/wpcom/v2/publicize/connection-test-results' } );
		return dispatch( 'jetpack/publicize' ).setConnectionTestResults( results );
	} catch ( error ) {
		// Refreshing connections failed
	}
}

/**
 * Given an array of blocks, this will return an array of just the blocks (including child blocks of
 * those blocks passed) that we support transforming into tweet content.
 *
 * @param {Array} blocks - The array of blocks to check.
 * @returns {Array} The blocks that can be turned into tweets.
 */
export const computeTweetBlocks = ( blocks = [] ) => {
	return flatMap( blocks, ( block = {} ) => {
		if ( SUPPORTED_BLOCKS[ block.name ] ) {
			return block;
		}

		return computeTweetBlocks( block.innerBlocks );
	} );
};

/**
 * Handle sending the tweet refresh request.
 *
 * @returns {object} Refresh tweets results action.
 */
async function __refreshTweets() {
	const topBlocks = select( 'core/editor' ).getBlocks();

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

		// Start generating any missing Twitter cards.
		const urls = flatMap( results, block => block.urls );
		dispatch( 'jetpack/publicize' ).getTwitterCards( urls );

		return dispatch( 'jetpack/publicize' ).setTweets( results );
	} catch ( error ) {
		// Refreshing tweets failed
	}
}

/**
 * Effect handler which will refreshing the state of the tweets. Tweet refreshes are throttled
 * to once ever 2 seconds.
 *
 * @param {object} action - Action which had initiated the effect handler.
 *
 * @returns {object} Refresh tweets results action.
 */
export const refreshTweets = throttle( __refreshTweets, 2000, { leading: true, trailing: true } );

export async function getTwitterCards( action ) {
	if ( 0 === action.urls.length ) {
		return dispatch( 'jetpack/publicize' ).setTwitterCards( [] );
	}

	try {
		const results = await apiFetch( {
			path: '/wpcom/v2/tweetstorm/generate-cards',
			data: {
				urls: action.urls,
			},
			method: 'POST',
		} );
		return dispatch( 'jetpack/publicize' ).setTwitterCards( results );
	} catch ( error ) {
		// Refreshing tweets failed
	}
}

export default {
	REFRESH_CONNECTION_TEST_RESULTS: refreshConnectionTestResults,
	REFRESH_TWEETS: refreshTweets,
	GET_TWITTER_CARDS: getTwitterCards,
};
