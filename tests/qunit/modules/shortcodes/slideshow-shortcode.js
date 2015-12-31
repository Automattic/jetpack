/**
 * global wp, jQuery
 * Tests for /modules/shortcodes/js/slideshow-shortcode.js
 */

var jetpackSlideshowSettings = {
	'spinner': '../../modules/shortcodes/img/slideshow-loader.gif'
};

jQuery( function( $ ) {
	module( 'slideshow-shortcode', function( hooks ) {

		hooks.beforeEach ( function() {
			this.container = $( '<div class="jetpack-slideshow" data-trans="fade" data-autostart="true">' );
			$( 'body' ).append( this.container );

			this.slideshow = new JetpackSlideshow(
				this.container,
				this.container.data( 'trans' ),
				this.container.data( 'autostart' )
			);
		} );

		hooks.afterEach ( function() {
			this.container.remove();
		} );

		test( 'Jetpack slideshow is a jQuery object', function( assert ) {

			assert.expect( 1 );

			assert.ok( this.slideshow.element instanceof jQuery, 'is jQuery object' );
		});

		test( 'Loading image is added and removed', function( assert ) {

			assert.expect( 2 );

			this.slideshow.showLoadingImage( true );
			assert.ok( this.slideshow.element.find( 'img' ).length > 0, 'image added' );

			this.slideshow.showLoadingImage( false );
			assert.ok( this.slideshow.loadingImage_ === null, 'image removed' );

		} );

	});
});
