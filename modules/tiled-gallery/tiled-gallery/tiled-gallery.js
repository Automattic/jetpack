( function($) {

var TiledGallery = function() {
	this.resizeTimeout = null;

	this.populate();

	var self = this;

	$( window ).on( 'resize', function () {
		clearTimeout( self.resizeTimeout );

		self.resizeTimeout = setTimeout( function () { self.resize(); }, 150 );
	} );

    // Make any new galleries loaded by Infinite Scroll flexible
    $( 'body' ).on( 'post-load', function () {
		self.populate();

		// After each image load, run resize in case all images in the gallery are loaded.
		self.gallery.find( 'img' ).off( 'load.tiled-gallery' ).on( 'load.tiled-gallery', function () {
			self.resize();
		} );

		// Run resize now in case all images loaded from cache.
		self.resize();
    } );

	this.resize();
};

TiledGallery.prototype.populate = function() {
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

TiledGallery.prototype.resize = function() {
	var resizeableElements = '.tiled-gallery-item img, .gallery-group, .gallery-row';

	this.gallery.each( function ( galleryIndex, galleryElement ) {
		var thisGallery = $( galleryElement );

		// All images must be loaded before proceeding.
		var imagesLoaded = true;

		thisGallery.find( 'img' ).each( function () {
			if ( ! this.complete ) {
				imagesLoaded = false;
				return false;
			}
		} );

		if ( ! imagesLoaded ) {
			var loadCallback = arguments.callee;

			// Once all of the images have loaded,
			// re-call this containing function.
			$( window ).load( function () {
				loadCallback( null, thisGallery );
			} );

			return;
		}

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