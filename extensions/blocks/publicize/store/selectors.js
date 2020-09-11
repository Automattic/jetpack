/**
 * External dependencies
 */
import { get } from 'lodash';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

// Links and media attached to tweets take up 24 characters each.
const ATTACHMENT_MESSAGE_PADDING = 24;

// The maximum length is 280 characters, but there'll always be a URL attached (plus a space).
const MAXIMUM_MESSAGE_LENGTH = 280 - ATTACHMENT_MESSAGE_PADDING - 1;

const DEFAULT_TWEETSTORM_MESSAGE = '\n\n' + __( 'A thread ⬇️', 'jetpack' );

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
		name: twitterAccount?.profile_display_name || __( 'Account Name', 'jetpack' ),
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

	const thread = [
		getFirstTweet( state ),
		...state.tweets.map( tweet => ( {
			...tweetTemplate,
			text: tweet.text,
			media: tweet.media,
			tweet: tweet.tweet,
			urls: tweet.urls,
			card: getTwitterCardForURLs( state, tweet.urls ),
		} ) ),
	];

	// Only add the last tweet if there's actual content in the thread.
	if ( thread.length > 1 ) {
		thread.push( getLastTweet( state ) );
	}

	return thread;
}

/**
 * Constructs the first tweet to use in the thread.
 *
 * @param {object} state - State object.
 *
 * @returns {object} The tweet.
 */
export function getFirstTweet( state ) {
	// This isn't defined properly in the test environment, so we have to skip this function.
	if ( ! select( 'core' ) ) {
		return;
	}

	const tweetTemplate = getTweetTemplate( state );

	const { getMedia } = select( 'core' );
	const { getEditedPostAttribute } = select( 'core/editor' );

	const featuredImageId = getEditedPostAttribute( 'featured_media' );
	const url = getEditedPostAttribute( 'link' );

	const media = featuredImageId && getMedia( featuredImageId );
	const image = media?.media_details?.sizes?.large?.source_url || media?.source_url;

	return {
		...tweetTemplate,
		text: getShareMessage() + ` ${ url }`,
		urls: [ url ],
		card: {
			title: getEditedPostAttribute( 'title' ),
			description:
				getEditedPostAttribute( 'meta' )?.advanced_seo_description ||
				getEditedPostAttribute( 'excerpt' ) ||
				getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
				__( 'Visit the post for more.', 'jetpack' ),
			url,
			image,
			type: image ? 'summary_large_image' : 'summary',
		},
	};
}

/**
 * Constructs the last tweet to use in the thread.
 *
 * @param {object} state - State object.
 *
 * @returns {object} The tweet.
 */
export function getLastTweet( state ) {
	// This isn't defined properly in the test environment, so we have to skip this function.
	if ( ! select( 'core/editor' ) ) {
		return;
	}

	const { getEditedPostAttribute } = select( 'core/editor' );
	const url = getEditedPostAttribute( 'link' );

	return {
		...getFirstTweet( state ),
		// The URL is deliberately not included in the translatable string, as it must always
		// be the last thing in the tweet text.
		text: __( "I've also published this thread on my site:", 'jetpack' ) + ` ${ url }`,
	};
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

/**
 * Gets the message that will be used hen sharing this post.
 *
 * @returns {string} The share message.
 */
export function getShareMessage() {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const meta = getEditedPostAttribute( 'meta' );
	const postTitle = getEditedPostAttribute( 'title' );
	const message = get( meta, [ 'jetpack_publicize_message' ], '' );

	const isTweetstorm = meta.jetpack_is_tweetstorm;

	if ( message ) {
		return message.substr( 0, getShareMessageMaxLength() );
	}

	if ( postTitle ) {
		return (
			postTitle.substr( 0, getShareMessageMaxLength() ) +
			( isTweetstorm ? DEFAULT_TWEETSTORM_MESSAGE : '' )
		);
	}

	return '';
}

/**
 * Get the maximum length that a share message can be.
 *
 * @returns {number} The maximum length of a share message.
 */
export function getShareMessageMaxLength() {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const isTweetstorm = getEditedPostAttribute( 'meta' ).jetpack_is_tweetstorm;

	if ( ! isTweetstorm ) {
		return MAXIMUM_MESSAGE_LENGTH;
	}

	return MAXIMUM_MESSAGE_LENGTH - DEFAULT_TWEETSTORM_MESSAGE.length;
}
