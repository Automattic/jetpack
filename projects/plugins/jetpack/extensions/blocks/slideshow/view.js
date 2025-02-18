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
import applyPaddingForStackBlock from './utils';

if ( typeof window !== 'undefined' ) {
	domReady( function () {
		applyPaddingForStackBlock();

		const slideshowBlocks = document.getElementsByClassName( 'wp-block-jetpack-slideshow' );

		// Helper function to update the pointer-events and visibility of the custom links
		function updateFadeLinks( swiper ) {
			swiper.slides.forEach( ( slide, index ) => {
				const isActive = index === swiper.activeIndex;
				const link = slide.querySelector( 'a[data-is-custom-link="true"]' );
				if ( link ) {
					link.style.pointerEvents = isActive ? 'auto' : 'none';
					link.style.visibility = isActive ? 'visible' : 'hidden';
				}
			} );
		}

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
					touchStartPreventDefault: true,
					resistance: true,
					resistanceRatio: 0.85,
					on: {
						init: function ( swiper ) {
							if ( effect === 'fade' ) {
								updateFadeLinks( swiper );
							}
						},
						slideChange: function ( swiper ) {
							if ( effect === 'fade' ) {
								updateFadeLinks( swiper );
							}
						},
						touchStart: function ( swiper ) {
							swiper.allowClick = true;
							const links = swiper.el.querySelectorAll( 'a[data-is-custom-link="true"]' );
							links.forEach( link => {
								link.style.pointerEvents = 'auto';
							} );
						},
						touchMove: function ( swiper, event ) {
							swiper.allowClick = false;

							const linkElement = event.target.closest( 'a[data-is-custom-link="true"]' );
							if ( linkElement ) {
								linkElement.style.pointerEvents = 'none';
							}
						},
						touchEnd: function ( swiper ) {
							// Reset pointer-events on all links
							const links = swiper.el.querySelectorAll( 'a[data-is-custom-link="true"]' );
							links.forEach( link => {
								link.style.pointerEvents = 'auto';
							} );
						},
						slideChangeTransitionEnd: function ( swiper ) {
							// Additional reset on slide change
							const links = swiper.el.querySelectorAll( 'a[data-is-custom-link="true"]' );
							links.forEach( link => {
								link.style.pointerEvents = 'auto';
							} );
						},
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
