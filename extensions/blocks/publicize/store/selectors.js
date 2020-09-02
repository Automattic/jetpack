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
 * Returns a template for tweet data, based on the first Twitter account found.
 *
 * @param {object} state - State object.
 *
 * @returns {object} The Twitter account data.
 */
export function getTweetTemplate( state ) {
	const twitterAccount = state.connections?.find(
		connection => 'twitter' === connection.service_name
	);

	return {
		date: Date.now(),
		name: 'Account Name',
		profileImage:
			twitterAccount?.profile_picture ||
			'https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png',
		screenName: twitterAccount?.display_name || '',
	};
}

/**
 * Generates an array of tweets, including Twitter account data.
 *
 * @param {object} state - State object.
 *
 * @returns {Array} Array of tweets.
 */
export function getTweetStorm( state ) {
	const tweetTemplate = getTweetTemplate( state );

	return state.tweets.map( tweet => ( {
		...tweetTemplate,
		text: tweet.text,
		media: tweet.media,
		tweet: tweet.tweet,
		urls: tweet.urls,
		card: getTwitterCardForURLs( state, tweet.urls ),
	} ) );
}

/**
 * Returns the tweets that a particular block is part of.
 *
 * @param {object} state - State object.
 * @param {string} clientId - The clientId of the block.
 *
 * @returns {Array} The tweets.
 */
export function getTweetsForBlock( state, clientId ) {
	return state.tweets.filter( tweet => {
		if ( tweet.blocks.find( block => block.clientId === clientId ) ) {
			return true;
		}

		return false;
	} );
}

/**
 * Given a list of URLs, this will find the first available Twitter card.
 *
 * @param {object} state - State object.
 * @param {Array} urls - The URLs to find Twitter Card data for.
 *
 * @returns {object} The first available Twitter Card for the given URLs.
 */
export function getTwitterCardForURLs( state, urls ) {
	if ( ! urls ) {
		return undefined;
	}

	return urls.reduce( ( foundCard, url ) => {
		if ( foundCard ) {
			return foundCard;
		}

		if ( state.twitterCards[ url ] && ! state.twitterCards[ url ].error ) {
			return {
				url,
				...state.twitterCards[ url ],
			};
		}

		return undefined;
	}, undefined );
}

/**
 * Check if we already have a Twitter Card (or error) cached for a given URL already.
 *
 * @param {object} state - State object.
 * @param {string} url - The URL to check.
 *
 * @returns {boolean} Whether or not we have something for the URL.
 */
export function twitterCardIsCached( state, url ) {
	return !! state.twitterCards[ url ];
}
