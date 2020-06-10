/**
 * External dependencies
 */
import { forEach } from 'lodash';

const MOBILE_ASPECT_RATIO = 720 / 1280;
const SANITY_MAX_HEIGHT = 512; // 40% of 1280
const PAUSE_CLASS = 'wp-block-jetpack-story_autoplay-paused';

function swiperInit( swiper ) {
	swiperResize( swiper );
	swiperApplyAria( swiper );
	swiper.el
		.querySelector( '.wp-block-jetpack-story_button-pause' )
		.addEventListener( 'click', function() {
			// Handle destroyed Swiper instances
			if ( ! swiper.el ) {
				return;
			}
			if ( swiper.el.classList.contains( PAUSE_CLASS ) ) {
				swiper.el.classList.remove( PAUSE_CLASS );
				swiper.autoplay.start();
				this.setAttribute( 'aria-label', 'Pause Story' );
			} else {
				swiper.el.classList.add( PAUSE_CLASS );
				swiper.autoplay.stop();
				this.setAttribute( 'aria-label', 'Play Story' );
			}
		} );
}

function swiperResize( swiper ) {
	if ( ! swiper || ! swiper.el ) {
		return;
	}
	const img = swiper.el.querySelector( '.swiper-slide[data-swiper-slide-index="0"] img' );
	if ( ! img ) {
		return;
	}
	const aspectRatio = img.clientWidth / img.clientHeight;
	const sanityAspectRatio = Math.max( Math.min( aspectRatio, 1 ), MOBILE_ASPECT_RATIO );
	const swiperHeight = Math.min( swiper.width / sanityAspectRatio, SANITY_MAX_HEIGHT );
	const wrapperHeight = `${ Math.floor( swiperHeight ) }px`;

	swiper.el.classList.add( 'wp-swiper-initialized' );
	swiper.wrapperEl.style.height = wrapperHeight;
}

function swiperApplyAria( swiper ) {
	forEach( swiper.slides, ( slide, index ) => {
		slide.setAttribute( 'aria-hidden', index === swiper.activeIndex ? 'false' : 'true' );
		if ( index === swiper.activeIndex ) {
			slide.setAttribute( 'tabindex', '-1' );
		} else {
			slide.removeAttribute( 'tabindex' );
		}
	} );
}

function swiperPaginationRender( swiper ) {
	forEach( swiper.pagination.bullets, bullet => {
		bullet.addEventListener( 'click', () => {
			const currentSlide = swiper.slides[ swiper.realIndex ];
			setTimeout( () => {
				currentSlide.focus();
			}, 500 );
		} );
	} );
}

export { swiperApplyAria, swiperInit, swiperPaginationRender, swiperResize };
