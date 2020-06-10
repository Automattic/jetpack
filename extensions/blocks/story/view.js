/**
 * External dependencies
 */
import { forEach } from 'lodash';
import domReady from '@wordpress/dom-ready';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * Internal dependencies
 */
import createSwiper from './create-swiper';
import {
	swiperApplyAria,
	swiperInit,
	swiperPaginationRender,
	swiperResize,
} from './swiper-callbacks';

if ( typeof window !== 'undefined' ) {
	domReady( function() {
		const storyBlocks = document.getElementsByClassName( 'wp-block-jetpack-story' );
		forEach( storyBlocks, storyBlock => {
			if ( storyBlock.getAttribute( 'data-jetpack-block-initialized' ) === 'true' ) {
				return;
			}

			const storyContainer = storyBlock.getElementsByClassName( 'swiper-container' )[ 0 ];
			let pendingRequestAnimationFrame = null;
			createSwiper(
				storyContainer,
				{
					init: true,
					initialSlide: 0,
					loop: true,
					keyboard: {
						enabled: true,
						onlyInViewport: true,
					},
				},
				{
					init: swiperInit,
					imagesReady: swiperResize,
					paginationRender: swiperPaginationRender,
					transitionEnd: swiperApplyAria,
				}
			)
				.then( swiper => {
					new ResizeObserver( () => {
						if ( pendingRequestAnimationFrame ) {
							cancelAnimationFrame( pendingRequestAnimationFrame );
							pendingRequestAnimationFrame = null;
						}
						pendingRequestAnimationFrame = requestAnimationFrame( () => {
							swiperResize( swiper );
							swiper.update();
						} );
					} ).observe( swiper.el );
				} )
				.catch( () => {
					storyBlock
						.querySelector( '.wp-block-jetpack-story_container' )
						.classList.add( 'wp-swiper-initialized' );
				} );

			storyBlock.setAttribute( 'data-jetpack-block-initialized', 'true' );
		} );
	} );
}
