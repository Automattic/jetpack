/**
 * Returns the failed Publicize connections.
 *
 * @param {object} state - State object.
 *
 * @returns {Array} List of connections.
 */
export function getFailedConnections( state ) {
	return state.connections.filter( connection => false === connection.test_success );
}

/**
 * Returns a list of Publicize connection service names that require reauthentication from users.
 * iFor example, when LinkedIn switched its API from v1 to v2.
 *
 * @param {object} state - State object.
 *
 * @returns {Array} List of service names that need reauthentication.
 */
export function getMustReauthConnections( state ) {
	return state.connections
		.filter( connection => 'must_reauth' === connection.test_success )
		.map( connection => connection.service_name );
}

/**
 * Given a the state object, this will use the `tweets` property to generate an array of tweets.
 *
 * @param {object} state - State object.
 *
 * @returns {Array} Array of tweets.
 */
export function getTweetStorm( state ) {
	const twitterAccount = state.connections?.find(
		connection => 'twitter' === connection.service_name
	);

	const tweetTemplate = {
		date: Date.now(),
		name: 'Account Name',
		profileImage:
			twitterAccount?.profile_picture ||
			'https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png',
		screenName: twitterAccount?.display_name || '',
	};

	return state.tweets.map( tweet => ( {
		...tweetTemplate,
		text: tweet.text,
		media: tweet.media,
		tweet: tweet.tweet,
	} ) );
}

export function getCurrentTweet( state ) {
	return state.tweets.reduce( ( currentTweet, tweet ) => {
		if ( currentTweet ) {
			return currentTweet;
		}

		if ( tweet.current ) {
			return tweet;
		}

		return false;
	}, false );
}

export function getTweetsForBlock( state, clientId ) {
	return state.tweets.filter( tweet => {
		if ( tweet.blocks.find( block => block.clientId === clientId ) ) {
			return true;
		}

		return false;
	} );
}
