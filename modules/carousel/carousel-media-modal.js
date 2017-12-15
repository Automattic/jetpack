/* global wp */
( function( $, wp ) {
	var media = wp.media;

	// Wrap the render() function to prepend notice.
	// If there's some other code extending the Gallery render, let's use that...
	// Otherwise, just extend the basic Settings render
	var oldRender = media.view.Settings.Gallery.prototype.render ?
		media.view.Settings.Gallery.prototype.render :
		media.view.Settings.prototype.render;
	media.view.Settings.Gallery = media.view.Settings.Gallery.extend( {
		render: function() {
			var $el = this.$el;

			// This brings in all the default settings not related to carousel.
			oldRender.apply( this, arguments );

			// Prepend a nice little message about how Carousel works.
			$el.prepend( media.template( 'jetpack-carousel-media-notice' ) );

			return this;
		}
	} );

}( jQuery, wp ) );
