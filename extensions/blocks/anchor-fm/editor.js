/**
 * Internal dependencies
 */
import { name } from '.';
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import { dispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/*
 * Register the main "anchor-fm" extension.
 */
const isExtensionAvailable = getJetpackExtensionAvailability( name )?.available;
if ( isExtensionAvailable ) {
	// Load data from the backend.
	const data = window.Jetpack_AnchorFm;
	if ( typeof data === 'object' ) {
		// Insert the link badge if needed.
		const { track, podcast_id, episode_id } = data;
		if ( typeof track === 'object' && podcast_id && episode_id ) {
			window.onload = () => {
				// Insert badge.
				dispatch( 'core/block-editor' ).insertBlocks(
					[
						createBlock( 'core/image', {
							url: 'https://cldup.com/Dv6JZWyRpq-1200x1200.png',
							linkDestination: 'none',
							href: track.link,
							align: 'center',
							width: 165,
							height: 40,
							className: 'is-spotify-podcast-badge',
						} ),
					],
					0,
					undefined,
					false
				);
				// Store the connection in post_meta.
				dispatch( 'core/editor' ).editPost( {
					meta: {
						anchor_podcast: podcast_id,
						anchor_episode: episode_id,
					},
				} );
			};
		}
	}
}
