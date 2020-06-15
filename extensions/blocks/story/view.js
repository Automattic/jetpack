/* global _wpmejsSettings, MediaElementPlayer */
/**
 * External dependencies
 */
import { forEach } from 'lodash';
import domReady from '@wordpress/dom-ready';
import ResizeObserver from 'resize-observer-polyfill';

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

			const storyContainer = storyBlock.getElementsByClassName( 'wp-story-container' )[ 0 ];

			player( storyContainer, null, {
				init: playerInit,
				imagesReady: playerResize,
				transitionEnd: playerApplyAria,
			} );

			let pendingRequestAnimationFrame = null;
			new ResizeObserver( () => {
				if ( pendingRequestAnimationFrame ) {
					cancelAnimationFrame( pendingRequestAnimationFrame );
					pendingRequestAnimationFrame = null;
				}
				pendingRequestAnimationFrame = requestAnimationFrame( () => {
					//swiperResize( swiper );
					//swiper.update();
				} );
			} ).observe( storyContainer );
		} );
	} );
}
