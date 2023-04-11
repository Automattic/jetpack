import { pasteHandler } from '@wordpress/blocks';
import { _x, __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import createBlocksFromTemplate from '../../../shared/create-block-from-inner-blocks-template';

// Templates.

function spotifyTemplate( { spotifyShowUrl, spotifyImageUrl } ) {
	return [
		[
			'core/image',
			{
				url: spotifyImageUrl,
				linkDestination: 'none',
				href: spotifyShowUrl,
				align: 'center',
				width: 165,
				height: 40,
				className: 'is-spotify-podcast-badge',
			},
		],
	];
}

function podcastSection( { episodeTrack, feedUrl } ) {
	const { guid } = episodeTrack;

	return [
		[
			'jetpack/podcast-player',
			{
				customPrimaryColor: getIconColor(),
				hexPrimaryColor: getIconColor(),
				url: feedUrl,
				selectedEpisodes: guid ? [ { guid } ] : [],
				showCoverArt: false,
				showEpisodeTitle: false,
				showEpisodeDescription: false,
			},
		],
	];
}

function podcastSummarySection( { episodeTrack } ) {
	const sectionBlocks = [
		[
			'core/heading',
			{
				level: 3,
				content: _x( 'Summary', 'noun: summary of a podcast episode', 'jetpack' ),
				placeholder: __( 'Podcast episode title', 'jetpack' ),
			},
		],
	];

	const summaryBlocks = pasteHandler( { HTML: episodeTrack.description_html, mode: 'BLOCKS' } );

	if ( summaryBlocks.length ) {
		sectionBlocks.push( ...summaryBlocks );
	} else {
		sectionBlocks.push( [
			'core/paragraph',
			{
				placeholder: __( 'Podcast episode summary', 'jetpack' ),
			},
		] );
	}

	return sectionBlocks;
}

function podcastConversationSection() {
	return [
		[
			'core/heading',
			{
				level: 3,
				content: __( 'Transcription', 'jetpack' ),
				placeholder: __( 'Podcast episode transcription', 'jetpack' ),
			},
		],
		[
			'core/paragraph',
			{
				placeholder: __( 'Podcast episode dialogue', 'jetpack' ),
			},
		],
		[
			'core/paragraph',
			{
				placeholder: __( 'Podcast episode dialogue', 'jetpack' ),
			},
		],
		[
			'core/paragraph',
			{
				placeholder: __( 'Podcast episode dialogue', 'jetpack' ),
			},
		],
	];
}

/*
 * Template parts
 */
function episodeBasicTemplate( { spotifyShowUrl, spotifyImageUrl, episodeTrack = {}, feedUrl } ) {
	const tpl = [ ...podcastSection( { episodeTrack, feedUrl } ) ];

	if ( spotifyShowUrl && spotifyImageUrl ) {
		tpl.push( ...spotifyTemplate( { spotifyShowUrl, spotifyImageUrl } ) );
	}

	tpl.push( ...podcastSummarySection( { episodeTrack } ) );
	tpl.push( ...podcastConversationSection() );

	return tpl;
}

export function basicTemplate( params ) {
	return createBlocksFromTemplate( episodeBasicTemplate( params ) );
}

export function spotifyBadgeTemplate( params ) {
	if ( ! params.spotifyImageUrl || ! params.spotifyShowUrl ) {
		return;
	}

	return createBlocksFromTemplate( [ ...spotifyTemplate( params ) ] );
}
