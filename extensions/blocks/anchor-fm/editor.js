/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { name } from '.';
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import { waitForEditor } from '../../shared/wait-for-editor';

async function insertSpotifyBadge() {
	const { spotifyShowUrl } = window.Jetpack_AnchorFm;
	if ( ! spotifyShowUrl ) {
		return;
	}

	await waitForEditor();

	dispatch( 'core/block-editor' ).insertBlock(
		createBlock( 'core/image', {
			url: 'https://cldup.com/Dv6JZWyRpq-1200x1200.png',
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
