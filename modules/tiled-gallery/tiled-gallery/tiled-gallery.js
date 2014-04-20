( function($) {

function TiledGalleryCollection() {
	this.findAndSetupGalleries();
}

TiledGalleryCollection.prototype.findAndSetupGalleries = function() {
	this.galleries = [];
	var self = this;
	$( '.tiled-gallery' ).each( function() {
		self.galleries.push( new TiledGallery( $( this ) ) );
	} );
};

TiledGalleryCollection.prototype.resizeAll = function() {
	$.each(this.galleries, function(i, gallery) {
		gallery.resize();
	} );
};

function TiledGallery( galleryElem ) {
	this.gallery = galleryElem;

	this.addCaptionEvents();

	// Resize when initialized so that window dimensions don't affect the
	// initial gallery dimensions
	this.resize();

	// Show the tiled gallery if it wasn't shown before
	this.gallery.removeClass( 'tiled-gallery-unresized' );
}

/**
 * Selector for all resizeable elements inside a Tiled Gallery
 */

TiledGallery.prototype.resizeableElementsSelector = '.gallery-row, .gallery-group, .tiled-gallery-item img';

/**
 * Story
 */

TiledGallery.prototype.addCaptionEvents = function() {
	// Hide captions
	this.gallery.find( '.tiled-gallery-caption' ).hide();

	// Add hover effects to bring the caption up and down for each item
	this.gallery.find( '.tiled-gallery-item' ).hover(
		function() { $( this ).find( '.tiled-gallery-caption' ).slideDown( 'fast' ); },
		function() { $( this ).find( '.tiled-gallery-caption' ).slideUp( 'fast' ); }
	);
};

TiledGallery.prototype.getExtraDimension = function( el, attribute, mode ) {
	if ( mode === 'horizontal' ) {
		return ( parseInt( el.css( attribute + 'Left' ), 10 ) || 0 ) +  ( parseInt( el.css( attribute + 'Right' ), 10 ) || 0 );
	} else if ( mode === 'vertical' ){
		return ( parseInt( el.css( attribute + 'Top' ), 10 ) || 0 ) + ( parseInt( el.css( attribute + 'Bottom' ), 10 ) || 0 );
	} else {
		return 0;
	}
};

TiledGallery.prototype.resize = function() {
	// Resize everything in the gallery based on the ratio of the current content width
	// to the original content width;
	var originalWidth = this.gallery.data( 'original-width' );
	var currentWidth = this.gallery.parent().width();
	var resizeRatio = Math.min( 1, currentWidth / originalWidth );

	var self = this;
	this.gallery.find( this.resizeableElementsSelector ).each( function () {
		var thisGalleryElement = $( this );

		var marginWidth = self.getExtraDimension( thisGalleryElement, 'margin', 'horizontal' );
		var marginHeight = self.getExtraDimension( thisGalleryElement, 'margin', 'vertical' );

		var paddingWidth = self.getExtraDimension( thisGalleryElement, 'padding', 'horizontal' );
		var paddingHeight = self.getExtraDimension( thisGalleryElement, 'padding', 'vertical' );

		var borderWidth = self.getExtraDimension( thisGalleryElement, 'border', 'horizontal' );
		var borderHeight = self.getExtraDimension( thisGalleryElement, 'border', 'vertical' );

		var outerWidth = thisGalleryElement.data( 'original-width' ) + paddingWidth + borderWidth + marginWidth;
		var outerHeight = thisGalleryElement.data( 'original-height' ) + paddingHeight + borderHeight + marginHeight;
		thisGalleryElement
			.width( Math.floor( resizeRatio * outerWidth ) - marginWidth)
			.height( Math.floor( resizeRatio * outerHeight ) - marginHeight );
	} );
};

/**
 * Ready, set...
 */

$( document ).ready( function() {
	var tiledGalleries = new TiledGalleryCollection();

	$( 'body' ).on( 'post-load', function() {
		tiledGalleries.findAndSetupGalleries();
	} );
	$( document ).on( 'page-rendered.wpcom-newdash', function() {
		tiledGalleries.findAndSetupGalleries();
	} );

	// Resize all galleries when the window is resized
	var resizeTimeout = null;
	$( window ).on( 'resize', function() {
		clearTimeout( resizeTimeout );

		// Events are fired whenever the window changes, so let's just wait
		// until the resizing is finished and do the resizing of galleries only
		// once
		resizeTimeout = setTimeout( function() {
			tiledGalleries.resizeAll();
		}, 150 );
	} );
});

})(jQuery);
