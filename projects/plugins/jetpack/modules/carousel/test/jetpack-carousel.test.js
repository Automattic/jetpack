/**
 * Tests for which Tiled Gallery image clicks the carousel intercepts.
 */

const MEDIA = 'https://example.com/wp-content/uploads/2026/11/photo.jpg';
const ATTACHMENT = 'https://example.com/photo/';

window.jetpackCarouselStrings = { single_image_gallery: 0 };
window.CSS = { supports: () => true };
window.jetpackSwiperLibraryPath = { url: 'swiper.js' };

require( '../jetpack-carousel' );

describe( 'Carousel and Tiled Gallery links', () => {
	// Mirrors GalleryImageSave output plus the attributes jetpack-carousel.php adds.
	const addTiledGallery = href => {
		const img =
			`<img data-id="5" data-link="${ ATTACHMENT }" data-url="${ MEDIA }" ` +
			`data-attachment-id="5" data-orig-file="${ MEDIA }" data-permalink="${ ATTACHMENT }" ` +
			'src="https://i0.wp.com/example.com/wp-content/uploads/2026/11/photo.jpg?w=600" />';
		document.body.innerHTML =
			'<div class="wp-block-jetpack-tiled-gallery" data-carousel-extra=\'{"blog_id":1}\'>' +
			'<div class="tiled-gallery__gallery"><div class="tiled-gallery__row"><div class="tiled-gallery__col">' +
			'<figure class="tiled-gallery__item">' +
			( href ? `<a href="${ href }">${ img }</a>` : img ) +
			'</figure></div></div></div></div>';
		return document.body.querySelector( 'img' );
	};

	// Reports whether the carousel cancelled the click, then cancels it so jsdom does not navigate.
	const click = node => {
		let carouselPrevented;
		const record = e => {
			carouselPrevented = e.defaultPrevented;
			e.preventDefault();
		};
		window.addEventListener( 'click', record );
		const event = new MouseEvent( 'click', { bubbles: true, cancelable: true } );
		node.dispatchEvent( event );
		window.removeEventListener( 'click', record );
		// The carousel stops propagation when it opens, so `record` never runs then.
		return carouselPrevented ?? event.defaultPrevented;
	};

	it( 'follows a custom link instead of opening the carousel', () => {
		expect( click( addTiledGallery( 'https://example.com/projects/one/' ) ) ).toBe( false );
	} );

	it.each( [
		[ 'media file', MEDIA ],
		[ 'attachment page', ATTACHMENT ],
		[ 'no link', null ],
	] )( 'opens the carousel for a %s image', ( _, href ) => {
		expect( click( addTiledGallery( href ) ) ).toBe( true );
	} );

	it( 'does not intercept clicks when the carousel data is missing', () => {
		const img = addTiledGallery( MEDIA );
		img.closest( '.wp-block-jetpack-tiled-gallery' ).removeAttribute( 'data-carousel-extra' );
		expect( click( img ) ).toBe( false );
	} );
} );
