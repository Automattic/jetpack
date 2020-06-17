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
import { playerApplyAria, playerInit, playerResize } from './player-callbacks';

if ( typeof window !== 'undefined' ) {
	domReady( function() {
		const storyBlocks = document.getElementsByClassName( 'wp-block-jetpack-story' );
		forEach( storyBlocks, storyBlock => {
			if ( storyBlock.getAttribute( 'data-jetpack-block-initialized' ) === 'true' ) {
				return;
			}

			player( storyBlock, null, {
				init: playerInit,
				imagesReady: playerResize,
				transitionEnd: playerApplyAria,
			} );
		} );
	} );
}
