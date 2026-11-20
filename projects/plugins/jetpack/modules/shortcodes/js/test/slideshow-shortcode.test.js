require( '../slideshow-shortcode.js' );

/**
 * Build a slideshow container carrying gallery data.
 *
 * slideshow_js() escapes the JSON with JSON_HEX_* rather than entities, but both forms parse to the
 * same string, so entities are enough here.
 *
 * @param {Array} gallery - Slides to encode.
 * @return {string} Markup holding a slideshow container.
 */
function slideshowMarkup( gallery ) {
	const attribute = JSON.stringify( gallery )
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#039;' );

	return `<div class="jetpack-slideshow" data-trans="fade" data-autostart="false" data-gallery="${ attribute }"></div>`;
}

/**
 * Run a gallery through the real initializer and hand back the first slide's caption element.
 *
 * @param {Array} gallery - Slides to render.
 * @return {Element} The caption element of the first slide.
 */
function initSlideshow( gallery ) {
	document.body.innerHTML = slideshowMarkup( gallery );
	document.body.dispatchEvent( new Event( 'post-load' ) );

	return document.querySelector( '.jetpack-slideshow-slide-caption' );
}

const transparentGif = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

describe( 'Slideshow shortcode', () => {
	beforeEach( () => {
		window.jetpackSlideshowSettings = {
			spinner: 'spinner.gif',
			speed: '4000',
			label_prev: 'Previous Slide',
			label_stop: 'Pause Slideshow',
			label_next: 'Next Slide',
		};
	} );

	afterEach( () => {
		document.body.innerHTML = '';
		delete window.jetpackSlideshowSettings;
	} );

	it( 'renders a caption as text', () => {
		const caption = initSlideshow( [ { src: transparentGif, caption: 'A view of the harbour' } ] );

		expect( caption ).toHaveTextContent( /^A view of the harbour$/ );
	} );

	it( 'decodes the entities wptexturize() leaves in a caption', () => {
		const caption = initSlideshow( [
			{ src: transparentGif, caption: 'The harbour&#8217;s best view' },
		] );

		expect( caption ).toHaveTextContent( /^The harbour’s best view$/ );
	} );

	it( 'does not build elements out of markup in a caption', () => {
		const caption = initSlideshow( [
			{
				src: transparentGif,
				caption: 'The harbour <img src="/missing" alt=""> at dawn',
			},
		] );

		expect( caption.querySelector( 'img' ) ).toBeNull();
		expect( caption ).toHaveTextContent( /^The harbour at dawn$/ );
	} );

	it( 'renders entity-encoded markup as the text it spells out', () => {
		const caption = initSlideshow( [
			{ src: transparentGif, caption: 'Shot with &lt;em&gt;a Leica&lt;/em&gt; in frame' },
		] );

		expect( caption.querySelector( 'em' ) ).toBeNull();
		expect( caption ).toHaveTextContent( /^Shot with <em>a Leica<\/em> in frame$/ );
	} );

	it( 'drops the source of elements that never render as caption text', () => {
		const caption = initSlideshow( [
			{
				src: transparentGif,
				caption: 'Sunset <style>.x{color:red}</style><script>var x = 1;</script> over the bay',
			},
		] );

		expect( caption ).toHaveTextContent( /^Sunset over the bay$/ );
	} );

	it( 'keeps words apart across a line break in a caption', () => {
		const caption = initSlideshow( [
			{ src: transparentGif, caption: 'Ada Lovelace<br />London, 1843' },
		] );

		expect( caption ).toHaveTextContent( /^Ada Lovelace London, 1843$/ );
	} );

	it( 'does not build elements out of a caption that closes out of a text container', () => {
		const caption = initSlideshow( [
			{
				src: transparentGif,
				caption: '</textarea><img src="/missing" alt="">',
			},
		] );

		expect( caption.querySelector( 'img' ) ).toBeNull();
	} );

	it( 'renders an empty caption when a slide has none', () => {
		const caption = initSlideshow( [ { src: transparentGif } ] );

		expect( caption ).toBeEmptyDOMElement();
	} );
} );
