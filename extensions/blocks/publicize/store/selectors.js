/**
 * Returns the failed Publicize connections.
 *
 * @param {Object} state State object.
 *
 * @return {Array} List of connections.
 */
export function getFailedConnections( state ) {
	return state.connections.filter( connection => false === connection.test_success );
}

/**
 * Returns a list of Publicize connection service names that require reauthentication from users.
 * iFor example, when LinkedIn switched its API from v1 to v2.
 *
 * @param {Object} state State object.
 *
 * @return {Array} List of service names that need reauthentication.
 */
export function getMustReauthConnections( state ) {
	return state.connections
		.filter( connection => 'must_reauth' === connection.test_success )
		.map( connection => connection.service_name );
}

export function getTweetStorm( state ) {
	const twitterAccount = state.connections.find(
		connection => 'twitter' === connection.service_name
	);

	const tweets = [];
	const tweet = {
		date: Date.now(),
		name: 'Account Name',
		profileImage: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png',
		screenName: twitterAccount?.display_name || '',
	};

	state.tweets.forEach( tweetBlob => {
		// If there are no boundaries, this entire blob belongs in one tweet.
		if ( 0 === tweetBlob.boundaries.length ) {
			tweets.push( {
				...tweet,
				text: tweetBlob.content,
				media: tweetBlob.media,
			} );
			return;
		}

		// Split the blob up into individual tweets, seperated by each boundary.
		tweetBlob.boundaries.forEach( ( boundary, index ) => {
			const start = index > 0 ? tweetBlob.boundaries[ index - 1 ].character : 0;

			tweets.push( {
				...tweet,
				text: tweetBlob.content.slice( start, boundary.character ),
			} );
		} );

		// Add the text from the last boundary to the end of the blob as a new tweet,
		// along with any media.
		tweets.push( {
			...tweet,
			text: tweetBlob.content.slice(
				tweetBlob.boundaries[ tweetBlob.boundaries.length - 1 ].character
			),
			media: tweetBlob.media,
		} );
	} );

	return tweets;
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

export function getTweetForBlock( state, clientId ) {
	return state.tweets.reduce( ( foundTweet, tweet ) => {
		if ( foundTweet ) {
			return foundTweet;
		}

		if ( tweet.blocks.find( block => block.clientId === clientId ) ) {
			return tweet;
		}

		return false;
	}, false );
}
