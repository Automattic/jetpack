/**
 * External dependencies
 */
import { flatMap } from 'lodash';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

const computeTweetBlocks = ( blocks = [] ) => {
	return flatMap( blocks, ( block = {} ) => {
		if ( block.name === 'core/paragraph' ) {
			return block;
		}
		return computeTweetBlocks( block.innerBlocks );
	} );
};

const getTweets = select => {
	const topBlocks = select( 'core/editor' ).getBlocks();
	const selectedBlocks = select( 'core/block-editor' ).getSelectedBlockClientIds();
	const tweetBlocks = computeTweetBlocks( topBlocks );

	const tweets = [];

	tweetBlocks.forEach( block => {
		const current = selectedBlocks.length === 1 && selectedBlocks[ 0 ] === block.clientId;
		const strippedContent = stripHTML( block.attributes.content );
		const boundaries = [];

		if ( strippedContent.length > 280 ) {
			const sentences = strippedContent.split( /([.!?]) / );
			let tweetedSentences = '';
			for ( let i = 0; i < sentences.length; i += 2 ) {
				const currentSentence = sentences[ i ] + sentences[ i + 1 ];
				if ( ( ( tweetedSentences.length + 1 ) % 280 ) + currentSentence.length > 280 ) {
					boundaries.push( {
						start: tweetedSentences.length - 1,
						end: tweetedSentences.length,
					} );
				}

				tweetedSentences += ` ${ currentSentence }`;
			}

			tweets.push( {
				blocks: [ block ],
				boundaries,
				current,
			} );
			return;
		}

		if ( tweets.length < 1 ) {
			tweets.push( {
				blocks: [ block ],
				boundaries,
				current,
			} );
			return;
		}

		const lastTweet = tweets[ tweets.length - 1 ];
		const lastTweetLength = lastTweet.blocks.reduce( ( length, allocatedBlock ) => {
			return length + stripHTML( allocatedBlock.attributes.content ).length;
		}, 0 );

		if ( lastTweetLength + strippedContent.length > 280 ) {
			tweets.push( {
				blocks: [ block ],
				boundaries,
				current,
			} );
			return;
		}

		if ( ! lastTweet.current && current ) {
			lastTweet.current = current;
		}

		lastTweet.blocks.push( block );
	} );

	return tweets;
};

export const getCurrentTweet = select => {
	const tweets = getTweets( select );
	return tweets.reduce( ( currentTweet, tweet ) => {
		if ( currentTweet ) {
			return currentTweet;
		}

		if ( tweet.current ) {
			return tweet;
		}

		return false;
	}, false );
};

export const getTweetForBlock = ( select, clientId ) => {
	const tweets = getTweets( select );
	return tweets.reduce( ( foundTweet, tweet ) => {
		if ( foundTweet ) {
			return foundTweet;
		}

		if ( tweet.blocks.find( block => block.clientId === clientId ) ) {
			return tweet;
		}

		return false;
	}, false );
};
