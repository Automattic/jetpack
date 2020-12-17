/**
 * WordPress dependencies
 */
import { createBlocksFromInnerBlocksTemplate, } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getIconColor } from '../../../shared/block-icons';

// Templates.

function spotifyTemplate( { spotifyShowUrl, spotifyImageUrl } ) {
	return [ 'core/image', {
		url: spotifyImageUrl,
		linkDestination: 'none',
		href: spotifyShowUrl,
		align: 'center',
		width: 165,
		height: 40,
		className: 'is-spotify-podcast-badge',
	} ];
}

function podcastSection( { episodeTrack } ) {
	const { image, link } = episodeTrack;

	return [ 'core/columns', {
		align: 'wide',
	}, [
		[ 'core/column', { width: '30%' }, [
			[ 'core/image', {
				url: image ? image : null,
			} ],
		] ],
		[ 'core/column', { width: '70%' }, [
			[ 'jetpack/podcast-player', {
				customPrimaryColor: getIconColor(),
				hexPrimaryColor: getIconColor(),
				url: link,
			} ],
		] ],
	] ];
}

function podcastSummarySection( { episodeTrack } ) {
	return [ 'core/group', {}, [
		[ 'core/heading', {
			content: 'Summary',
			placeholder: __( 'Podcast episode title', 'jetpack' ),
		} ],
		[ 'core/paragraph', {
			placeholder: __( 'Podcast episode summary', 'jetpack' ),
			content: episodeTrack.description,
		} ],
	] ];
}

/*
 * Template parts
 */
function buildPlayerSection( {
	spotifyShowUrl,
	spotifyImageUrl,
	episodeTrack = {},
} ) {
	const tpl = [ podcastSection( { episodeTrack } ) ];

	if ( spotifyShowUrl && spotifyImageUrl ) {
		tpl.push( spotifyTemplate( { spotifyShowUrl, spotifyImageUrl } ) );
	}

	tpl.push( podcastSummarySection( { episodeTrack } ) );

	return tpl;
}

export function basicTemplate( params ) {
	return createBlocksFromInnerBlocksTemplate( buildPlayerSection( params ) );
}

export function spotifyBadgeTemplate( params ) {
	if ( ! params.spotifyImageUrl || ! params.spotifyShowUrl ) {
		return;
	}

	return createBlocksFromInnerBlocksTemplate( [ spotifyTemplate( params ) ] );
}
