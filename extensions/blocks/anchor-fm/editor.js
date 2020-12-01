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
	/*
	 * Insert link badge if needed.
	 */
	const episode = window.Jetpack_AnchorFm_Episode;
	if ( typeof episode === 'object' ) {
		window.onload = () => {
			dispatch( 'core/block-editor' ).insertBlocks(
				[
					createBlock( 'core/image', {
						url: 'https://cldup.com/Dv6JZWyRpq-1200x1200.png',
						linkDestination: 'none',
						href: episode.link,
						align: 'center',
						width: 165,
						height: 40,
					} ),
				],
				0,
				undefined,
				false
			);
		};
	}
}
