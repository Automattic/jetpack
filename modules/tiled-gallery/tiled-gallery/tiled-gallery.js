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
	this.galleries.forEach( function(gallery) {
		gallery.resize();
	} );
};

function TiledGallery( galleryElem ) {
	this.gallery = galleryElem;

	this.addCaptionEvents();

	// Set original size information to elements if they haven't been set
	this.maybeSetSizeAttributes();

	// Resize when initialized so that window dimensions don't affect the
	// initial gallery dimensions
	this.resize();
};

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

/*
 * Set original size information to gallery elements to enable dynamic resizing
 * unless they have already been set.
 */

TiledGallery.prototype.maybeSetSizeAttributes = function() {
	var self = this;

	if ( ! this.gallery.data( 'sizes-set' ) ) {
		// This gallery has it's attributes set. No need to set again if a new instance
		// is made of an element that already has the attributes
		this.gallery.data( 'sizes-set', true );

		this.gallery.find( this.resizeableElementsSelector ).each( function () {
			var thisGalleryElement = $( this );

			// Don't change margins, but remember what they were so they can be
			// accounted for in size calculations.  When the screen width gets
			// small enough, ignoring the margins can cause images to overflow
			// into new rows.
			var extraWidth = ( parseInt( thisGalleryElement.css( 'marginLeft' ), 10 ) || 0 ) + ( parseInt( thisGalleryElement.css( 'marginRight' ), 10 ) || 0 );
			var extraHeight = ( parseInt( thisGalleryElement.css( 'marginTop' ), 10 ) || 0 ) + ( parseInt( thisGalleryElement.css( 'marginBottom' ), 10 ) || 0 );

			// In some situations, tiled galleries in Firefox have shown scrollbars on the images because
			// the .outerWidth() call on the image returns a value larger than the container. Restrict
				// widths used in the resizing functions to the maximum width of the container.
			var parentElement = $( thisGalleryElement.parents( self.resizeableElementsSelector ).get( 0 ) );

			if ( parentElement && parentElement.data( 'original-width' ) ) {
				thisGalleryElement
					.data( 'original-width', Math.min( parentElement.data( 'original-width' ), thisGalleryElement.outerWidth( true ) ) )
					.data( 'original-height', Math.min( parentElement.data( 'original-height' ), thisGalleryElement.outerHeight( true ) ) );
			}
			else {
				thisGalleryElement
					.data( 'original-width', thisGalleryElement.outerWidth( true ) )
					.data( 'original-height', thisGalleryElement.outerHeight( true ) );
			}

			thisGalleryElement
				.data( 'extra-width', extraWidth )
				.data( 'extra-height', extraHeight );
		} );
	}
};

TiledGallery.prototype.resize = function() {
	// Resize everything in the gallery based on the ratio of the current content width
	// to the original content width;
	var originalWidth = this.gallery.data( 'original-width' );
	var currentWidth = this.gallery.parent().width();
	var resizeRatio = Math.min( 1, currentWidth / originalWidth );

	this.gallery.find( this.resizeableElementsSelector ).each( function () {
		var thisGalleryElement = $( this );

		thisGalleryElement
			.width( Math.floor( resizeRatio * thisGalleryElement.data( 'original-width' ) ) - thisGalleryElement.data( 'extra-width' ) )
			.height( Math.floor( resizeRatio * thisGalleryElement.data( 'original-height' ) ) - thisGalleryElement.data( 'extra-height' ) );
	} );

	this.gallery.removeClass( 'tiled-gallery-unresized' );
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
