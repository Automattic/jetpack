/**
 * Returns an action object used in signalling that
 * we're setting the Publicize connection test results.
 *
 * @param {Array} results Connection test results.
 *
 * @return {Object} Action object.
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
 * @return {Object} Action object.
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
 * @param {String} path API endpoint path.
 *
 * @return {Object} Action object.
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
 * Returns an action object used in signalling that twets have been refreshed,
 * and the state will be updated.
 *
 * @param {Array} tweets - The array of tweet objects returned by the parser.
 *
 * @returns {object} Action object.
 */
export function setTweets( tweets ) {
	return {
		type: 'SET_TWEETS',
		tweets,
	};
}
