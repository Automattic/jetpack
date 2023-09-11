import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { PODCAST_FEED, EMBED_BLOCK } from './constants';

export const fetchTrackQuantity = async () => {
	const trackQuantity = await apiFetch( {
		path: '/wpcom/v2/podcast-player/track-quantity',
	} );
	return trackQuantity;
};

export const fetchPodcastFeed = async ( { url, guids = [], fetchEpisodeOptions = false } ) => {
	// First try calling our endpoint for Podcast parsing.
	let feedData, feedError;
	try {
		feedData = await apiFetch( {
			path: addQueryArgs( '/wpcom/v2/podcast-player', {
				url,
				guids,
				[ 'episode-options' ]: fetchEpisodeOptions,
			} ),
		} );
	} catch ( err ) {
		// We are not rethrowing the error just yet so we can try the embed too.
		feedError = err;
	}

	// Return podcast feed data if we have any.
	if ( feedData ) {
		return {
			type: PODCAST_FEED,
			data: feedData,
		};
	}

	// Try if we have another block that can embed this URL.
	let externalEmbed;
	try {
		externalEmbed = await apiFetch( {
			path: addQueryArgs( '/oembed/1.0/proxy', { url } ),
		} );
	} catch ( err ) {
		// We don't care about this error.
	}

	// We can use an embed block for this URL, unless API returned the fallback code.
	const oEmbedLinkCheck = '<a href="' + url + '">' + url + '</a>';
	if ( externalEmbed && externalEmbed.html !== oEmbedLinkCheck ) {
		return {
			type: EMBED_BLOCK,
		};
	}

	// Nothing worked, show error.
	throw feedError;
};
