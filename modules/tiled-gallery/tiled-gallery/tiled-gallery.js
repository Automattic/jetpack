( function($) {

var TiledGallery = function() {
	this.resizeTimeout = null;

	this.gallery = $( '.tiled-gallery' );
	this.item    = this.gallery.find( '.tiled-gallery-item' );
	this.caption = this.gallery.find( '.tiled-gallery-caption' );

	this.Captions();
	var self = this;

	$( window ).on( 'resize', function () {
		clearTimeout( self.resizeTimeout );

		self.resizeTimeout = setTimeout( function () { self.resize(); }, 150 );
	} );

	this.resize();
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

TiledGallery.prototype.resize = function() {
	var resizeableElements = '.tiled-gallery-item img, .gallery-group, .gallery-row';

	this.gallery.each( function () {
		var thisGallery = $( this );

		if ( ! thisGallery.data( 'sizes-set' ) ) {
			// Maintain a record of the original widths and heights of these elements
			// for proper scaling.
			thisGallery.data( 'sizes-set', true );

			thisGallery.find( resizeableElements ).each( function () {
				var thisGalleryElement = $( this );

				// Don't change margins, but remember what they were so they can be
				// accounted for in size calculations.  When the screen width gets
				// small enough, ignoring the margins can cause images to overflow
				// into new rows.
				var extraWidth = ( parseInt( thisGalleryElement.css( 'marginLeft' ), 10 ) || 0 ) + ( parseInt( thisGalleryElement.css( 'marginRight' ), 10 ) || 0 );
				var extraHeight = ( parseInt( thisGalleryElement.css( 'marginTop' ), 10 ) || 0 ) + ( parseInt( thisGalleryElement.css( 'marginBottom' ), 10 ) || 0 )

				thisGalleryElement
					.data( 'original-width', thisGalleryElement.outerWidth( true ) )
					.data( 'original-height', thisGalleryElement.outerHeight( true ) )
					.data( 'extra-width', extraWidth )
					.data( 'extra-height', extraHeight );
			} );
		}

		// Resize everything in the gallery based on the ratio of the current content width
		// to the original content width;
		var originalWidth = thisGallery.data( 'original-width' );
		var currentWidth = thisGallery.parent().width();
		var resizeRatio = Math.min( 1, currentWidth / originalWidth );

		thisGallery.find( resizeableElements ).each( function () {
			var thisGalleryElement = $( this );

			thisGalleryElement
				.width( Math.floor( resizeRatio * thisGalleryElement.data( 'original-width' ) ) - thisGalleryElement.data( 'extra-width' ) )
				.height( Math.floor( resizeRatio * thisGalleryElement.data( 'original-height' ) ) - thisGalleryElement.data( 'extra-height' ) );
		} );
	} );
};

/**
 * Ready, set...
 */
$( document ).ready( function() {

	// Instance!
	var TiledGalleryInstance = new TiledGallery;

});

})(jQuery);