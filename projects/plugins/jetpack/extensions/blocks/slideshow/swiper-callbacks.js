import { escapeHTML } from '@wordpress/escape-html';

const SIXTEEN_BY_NINE = 16 / 9;
const MAX_HEIGHT_PERCENT_OF_WINDOW_HEIGHT = 0.8;
const SANITY_MAX_HEIGHT = 600;
const PAUSE_CLASS = 'wp-block-jetpack-slideshow_autoplay-paused';

function swiperInit( swiper ) {
	// Enable loop mode after init if we have enough slides
	// See also: https://stackoverflow.com/a/78680695
	if ( swiper.slides.length > 1 ) {
		swiper.loopDestroy();
		swiper.params.loop = true;
		swiper.loopCreate();
		swiper.update();
	}

	swiperResize( swiper );
	swiperApplyAria( swiper );

	swiper.el
		.querySelector( '.wp-block-jetpack-slideshow_button-pause' )
		.addEventListener( 'click', function () {
			// Handle destroyed Swiper instances
			if ( ! swiper.el ) {
				return;
			}
			if ( swiper.el.classList.contains( PAUSE_CLASS ) ) {
				swiper.el.classList.remove( PAUSE_CLASS );
				swiper.autoplay.start();
				this.setAttribute( 'aria-label', 'Pause Slideshow' );
			} else {
				swiper.el.classList.add( PAUSE_CLASS );
				swiper.autoplay.stop();
				this.setAttribute( 'aria-label', 'Play Slideshow' );
			}
		} );
}

function swiperResize( swiper ) {
	if ( ! swiper || ! swiper.el ) {
		return;
	}
	const img = swiper.params.loop
		? swiper.el.querySelector( '.swiper-slide[data-swiper-slide-index="0"] img' )
		: swiper.el.querySelector( '.swiper-slide img' );
	if ( ! img ) {
		return;
	}

	let aspectRatio;

	// If the image element has `naturalWidth` and `naturalHeight` defined, we prefer using
	// those numbers, because they're guaranteed to be up to date and correct, since they're
	// taken from the actual image that the browser loaded.
	//
	// However, in some cases these numbers will be missing, due to e.g. lazy image loading.
	// In those situations, we first fall back to the recorded aspect ratio in the <img>
	// element, then the `width` and `height` attributes in the same element.
	if ( img.naturalWidth > 0 && img.naturalHeight > 0 ) {
		aspectRatio = img.naturalWidth / img.naturalHeight;
	} else if ( img.dataset.aspectRatio ) {
		const matches = img.dataset.aspectRatio.match( /(\d+) \/ (\d+)/ );
		if ( matches && matches[ 1 ] && matches[ 2 ] ) {
			aspectRatio = parseInt( matches[ 1 ], 10 ) / parseInt( matches[ 2 ], 10 );
		}
	} else if ( img.getAttribute( 'width' ) && img.getAttribute( 'height' ) ) {
		aspectRatio =
			parseInt( img.getAttribute( 'width' ), 10 ) / parseInt( img.getAttribute( 'height' ), 10 );
	}

	// If we don't have a valid aspect ratio at this point, we set it to a sane default.
	if ( ! aspectRatio ) {
		aspectRatio = SIXTEEN_BY_NINE;

		// Then, if the image is still loading, we schedule a new resize for once it loads.
		// This might cause a layout shift, but it improves the chances that we display the
		// slideshow at the correct aspect ratio, based on the image's natural dimensions.
		if ( ! img.complete ) {
			img.addEventListener( 'load', () => swiperResize( swiper ), { once: true } );
		}
	}

	// After we have an aspect ratio, we run a final check to make sure it's within an
	// acceptable range of values, and clamp it if necessary.
	const sanityAspectRatio = Math.max( Math.min( aspectRatio, SIXTEEN_BY_NINE ), 1 );

	// Finally, we also clamp the height to a sane maximum.
	const sanityHeight =
		typeof window !== 'undefined'
			? window.innerHeight * MAX_HEIGHT_PERCENT_OF_WINDOW_HEIGHT
			: SANITY_MAX_HEIGHT;
	const swiperHeight = Math.min( swiper.width / sanityAspectRatio, sanityHeight );
	const wrapperHeight = `${ Math.floor( swiperHeight ) }px`;
	const buttonTop = `${ Math.floor( swiperHeight / 2 ) }px`;

	swiper.el.classList.add( 'wp-swiper-initialized' );
	swiper.wrapperEl.style.height = wrapperHeight;
	swiper.el.querySelector( '.wp-block-jetpack-slideshow_button-prev' ).style.top = buttonTop;
	swiper.el.querySelector( '.wp-block-jetpack-slideshow_button-next' ).style.top = buttonTop;
}

function announceCurrentSlide( swiper ) {
	const currentSlide = swiper.slides[ swiper.activeIndex ];
	if ( ! currentSlide ) {
		return;
	}
	const figcaption = currentSlide.getElementsByTagName( 'FIGCAPTION' )[ 0 ];
	const img = currentSlide.getElementsByTagName( 'IMG' )[ 0 ];
	if ( swiper.a11y.liveRegion ) {
		swiper.a11y.liveRegion[ 0 ].innerHTML = figcaption
			? figcaption.innerHTML
			: escapeHTML( img.alt );
	}
}

function swiperApplyAria( swiper ) {
	( swiper.slides || [] ).forEach( ( slide, index ) => {
		slide.setAttribute( 'aria-hidden', index === swiper.activeIndex ? 'false' : 'true' );
		if ( index === swiper.activeIndex ) {
			slide.setAttribute( 'tabindex', '-1' );
		} else {
			slide.removeAttribute( 'tabindex' );
		}
	} );
	announceCurrentSlide( swiper );
}

function swiperPaginationRender( swiper ) {
	( swiper.pagination.bullets || [] ).forEach( bullet => {
		bullet.addEventListener( 'click', () => {
			const currentSlide = swiper.slides[ swiper.realIndex ];
			setTimeout( () => {
				currentSlide.focus();
			}, 500 );
		} );
	} );
}

export { swiperApplyAria, swiperInit, swiperPaginationRender, swiperResize };
