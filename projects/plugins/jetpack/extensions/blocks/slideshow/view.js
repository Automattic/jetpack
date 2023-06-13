import domReady from '@wordpress/dom-ready';
import ResizeObserver from 'resize-observer-polyfill';
import createSwiper from './create-swiper';
import { paginationCustomRender } from './pagination';
import {
	swiperApplyAria,
	swiperInit,
	swiperPaginationRender,
	swiperResize,
} from './swiper-callbacks';

if ( typeof window !== 'undefined' ) {
	domReady( function () {
		const slideshowBlocks = document.getElementsByClassName( 'wp-block-jetpack-slideshow' );

		Array.from( slideshowBlocks ).forEach( slideshowBlock => {
			if ( slideshowBlock.getAttribute( 'data-jetpack-block-initialized' ) === 'true' ) {
				return;
			}

			const { autoplay, delay, effect } = slideshowBlock.dataset;
			const prefersReducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
			const shouldAutoplay = autoplay && ! prefersReducedMotion;
			const slideshowContainer = slideshowBlock.getElementsByClassName( 'swiper-container' )[ 0 ];
			let pendingRequestAnimationFrame = null;
			createSwiper(
				slideshowContainer,
				{
					autoplay: shouldAutoplay
						? {
								delay: delay * 1000,
								disableOnInteraction: false,
						  }
						: false,
					effect,
					init: true,
					initialSlide: 0,
					loop: true,
					keyboard: {
						enabled: true,
						onlyInViewport: true,
					},
					pagination: {
						el: '.swiper-pagination',
						clickable: true,
						type: 'custom',
						renderCustom: paginationCustomRender,
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
					slideshowBlock
						.querySelector( '.wp-block-jetpack-slideshow_container' )
						.classList.add( 'wp-swiper-initialized' );
				} );

			slideshowBlock.setAttribute( 'data-jetpack-block-initialized', 'true' );
		} );
	} );
}
