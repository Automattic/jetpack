/**
 * External dependencies
 */
import { forEach } from 'lodash';
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import './style.scss';
import player from './player';

if ( typeof window !== 'undefined' ) {
	domReady( function() {
		const storyBlocks = document.getElementsByClassName( 'wp-block-jetpack-story' );
		forEach( storyBlocks, storyBlock => {
			if ( storyBlock.getAttribute( 'data-jetpack-block-initialized' ) === 'true' ) {
				return;
			}

			const settingsFromTemplate = storyBlock.getAttribute( 'data-settings' );
			let settings;
			if ( settingsFromTemplate ) {
				try {
					settings = JSON.parse( settingsFromTemplate );
				} catch ( e ) {
					// ignore parsing errors
				}
			}

			player( storyBlock, settings );
		} );
	} );
}
