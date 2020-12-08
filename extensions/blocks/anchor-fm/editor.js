/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { name } from '.';
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import { waitForEditor } from '../../shared/wait-for-editor';

async function insertSpotifyBadge() {
	const { Jetpack_AnchorFm = {} } = window;
	const { image, spotifyShowUrl } = Jetpack_AnchorFm;
	if ( ! spotifyShowUrl ) {
		return;
	}

	const { track = {} } = Jetpack_AnchorFm;

	await waitForEditor();

	const { insertBlock } = dispatch( 'core/block-editor' );
	const { editPost } = dispatch( 'core/editor' );
	const { isEditedPostNew } = select( 'core/editor' );

	insertBlock(
		createBlock( 'core/image', {
			url: image,
			linkDestination: 'none',
			href: spotifyShowUrl,
			align: 'center',
			width: 165,
			height: 40,
			className: 'is-spotify-podcast-badge',
		} ),
		0,
		undefined,
		false
	);

	// Set the post title when the post is new,
	// and it can be picked up from the podcast track.
	if ( isEditedPostNew() && track.title ) {
		editPost( { title: track.title } );
	}
}

function initAnchor() {
	const isExtensionAvailable = getJetpackExtensionAvailability( name )?.available;
	if ( ! isExtensionAvailable ) {
		return;
	}

	const data = window.Jetpack_AnchorFm;
	if ( typeof data !== 'object' ) {
		return;
	}

	switch ( data.action ) {
		case 'insert-spotify-badge':
			insertSpotifyBadge();
			break;
	}
}

initAnchor();
