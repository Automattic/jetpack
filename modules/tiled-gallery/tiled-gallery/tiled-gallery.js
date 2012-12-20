( function($) {

var TiledGallery = function() {

	this.gallery = $( '.tiled-gallery' );
	this.item    = this.gallery.find( '.tiled-gallery-item' );
	this.caption = this.gallery.find( '.tiled-gallery-caption' );

	this.Captions();
};


/**
 * Story
 */
TiledGallery.prototype.Captions = function() {
	/* Hide captions */
	this.caption.hide();

	this.item.on( 'hover', function() {
		$( this ).find( '.tiled-gallery-caption' ).slideToggle( 'fast' );
	});
};


/**
 * Ready, set...
 */
$( document ).ready( function() {

	// Instance!
	var TiledGalleryInstance = new TiledGallery;

});

})(jQuery);