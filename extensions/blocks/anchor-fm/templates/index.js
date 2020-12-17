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

/*
 * Template parts
 */
function buildPlayerSection( {
	spotifyShowUrl,
	spotifyImageUrl,
	episodeTrack = {},
} ) {
	return [
		// Podcast player section.
		[ 'core/columns', {
			align: 'wide',
		}, [
			[ 'core/column', { width: '30%' }, [
				[ 'core/image', {
					url: episodeTrack?.image ? episodeTrack.image : null,
				} ],
			] ],
			[ 'core/column', { width: '70%' }, [
				[ 'jetpack/podcast-player', {
					customPrimaryColor: getIconColor(),
					hexPrimaryColor: getIconColor(),
					url: episodeTrack.link,
				} ],
			] ],
		] ],

		spotifyTemplate( { spotifyShowUrl, spotifyImageUrl } ),

		// Summary section.
		[ 'core/group', {}, [
			[ 'core/heading', {
				content: 'Summary',
				placeholder: __( 'Podcast episode title', 'jetpack' ),
			} ],
			[ 'core/paragraph', {
				placeholder: __( 'Podcast episode summary', 'jetpack' ),
				content: episodeTrack.description,
			} ],
		] ],
	];
}

export function basicTemplate( params ) {
	return createBlocksFromInnerBlocksTemplate( buildPlayerSection( params ) );
}

export function spotifyBadgeTemplate( params ) {
	return createBlocksFromInnerBlocksTemplate( [ spotifyTemplate( params ) ] );
}
