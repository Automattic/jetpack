/**
 * External dependencies
 */
import { select } from '@wordpress/data';

/**
 * Returns an action object used in signalling that
 * we're setting the Publicize connection test results.
 *
 * @param {Array} results - Connection test results.
 *
 * @returns {object} Action object.
 */
export function setConnectionTestResults( results ) {
	return {
		type: 'SET_CONNECTION_TEST_RESULTS',
		results,
	};
}

/**
 * Returns an action object used in signalling that
 * we're refreshing the Publicize connection test results.
 *
 * @returns {object} Action object.
 */
export function refreshConnectionTestResults() {
	return {
		type: 'REFRESH_CONNECTION_TEST_RESULTS',
	};
}

/**
 * Returns an action object used in signalling that
 * we're initiating a fetch request to the REST API.
 *
 * @param {string} path - API endpoint path.
 *
 * @returns {object} Action object.
 */
export function fetchFromAPI( path ) {
	return {
		type: 'FETCH_FROM_API',
		path,
	};
}

/**
 * Returns an action object used in signalling that we're refreshing
 * the tweets that have been parsed out of the content.
 *
 * @returns {object} Action object.
 */
export function refreshTweets() {
	return {
		type: 'REFRESH_TWEETS',
	};
}

/**
 * Returns an action object used in signalling that tweets have been refreshed,
 * and the state will be updated.
 *
 * @param {Array} tweets - The array of tweet objects returned by the parser.
 * @returns {object} Action object.
 */
export function setTweets( tweets ) {
	return {
		type: 'SET_TWEETS',
		tweets,
	};
}

/**
 * Returns an action object used in signalling that we're fetching Twitter Cards.
 *
 * @param {Array} urls - An array of URLs to fetch.
 * @returns {object} Action object.
 */
export function getTwitterCards( urls ) {
	const { twitterCardIsCached } = select( 'jetpack/publicize' );

	return {
		type: 'GET_TWITTER_CARDS',
		urls: urls.filter( url => ! twitterCardIsCached( url ) ),
	};
}

/**
 * Returns an action object used in signalling that Twitter Cards have been fetched
 * and the state will be updated.
 *
 * @param {Array} cards - The array of card object returned by the server.
 * @returns {object} Action object.
 */
export function setTwitterCards( cards ) {
	return {
		type: 'SET_TWITTER_CARDS',
		cards,
	};
}
