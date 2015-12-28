/**
 * global wp, jQuery
 * Tests for /modules/shortcodes/js/slideshow-shortcode.js
 */

var jetpackSlideshowSettings = {
	'spinner': '../../modules/shortcodes/img/slideshow-loader.gif'
};

jQuery( function( $ ) {
	module( 'slideshow-shortcode' );

	var container = $( '<div class="jetpack-slideshow" data-trans="fade" data-autostart="true">' ),
		slideshow = undefined;
	$( 'body' ).append( container );

	test( 'Jetpack slideshow is a jQuery object', function( assert ) {

		slideshow = new JetpackSlideshow( container, container.data( 'trans' ), container.data( 'autostart' ) );

		assert.expect( 1 );

		assert.ok( slideshow.element instanceof jQuery, 'is jQuery object' );
	});

	test( 'Loading image is added and removed', function( assert ) {

		assert.expect( 2 );

		slideshow = new JetpackSlideshow( container, container.data( 'trans' ), container.data( 'autostart' ) );

		slideshow.showLoadingImage( true );
		assert.ok( slideshow.element.find( 'img' ).length > 0, 'image added' );

		slideshow.showLoadingImage( false );
		assert.ok( slideshow.loadingImage_ === null, 'image removed' );

	} );

});
