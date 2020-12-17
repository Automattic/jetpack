/**
 * WordPress dependencies
 */
import { createBlocksFromInnerBlocksTemplate, } from '@wordpress/blocks';

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

export function spotifyBadgeTemplate ( params ) {
	return createBlocksFromInnerBlocksTemplate( [ spotifyTemplate( params ) ] );
}
