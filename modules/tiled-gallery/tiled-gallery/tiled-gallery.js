( function($) {

	function TiledGalleryCollection() {
		this.galleries = [];
		this.findAndSetupNewGalleries();
	}

	TiledGalleryCollection.prototype.findAndSetupNewGalleries = function() {
		var self = this;
		$( '.tiled-gallery.tiled-gallery-unresized' ).each( function() {
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

		// Resize when initialized to fit the gallery to window dimensions
		this.resize();

		// Displays the gallery and prevents it from being initialized again
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
			var left = ( attribute == 'border' ) ? 'borderLeftWidth' : attribute + 'Left';
			var right = ( attribute == 'border' ) ? 'borderRightWidth' : attribute + 'Right';
			return ( parseInt( el.css( left ), 10 ) || 0 ) +  ( parseInt( el.css( right ), 10 ) || 0 );
		} else if ( mode === 'vertical' ) {
			var top = ( attribute == 'border' ) ? 'borderTopWidth' : attribute + 'Top';
			var bottom = ( attribute == 'border' ) ? 'borderBottomWidth' : attribute + 'Bottom';
			return ( parseInt( el.css( top ), 10 ) || 0 ) + ( parseInt( el.css( bottom ), 10 ) || 0 );
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

			// Take all outer dimensions into account when resizing so that images
			// scale with constant empty space between them
			var outerWidth = thisGalleryElement.data( 'original-width' ) + paddingWidth + borderWidth + marginWidth;
			var outerHeight = thisGalleryElement.data( 'original-height' ) + paddingHeight + borderHeight + marginHeight;
			
			// decide if square images or with different width and height
			if(thisGalleryElement.is('img') && thisGalleryElement.data( 'original-width' ) == thisGalleryElement.data( 'original-height' )){
				var imgWidth = thisGalleryElement.data( 'original-width' );
				var imgHeight = thisGalleryElement.data( 'original-height' );
				var orginalSize = thisGalleryElement.data('orig-size').split(',');
				var overflowsize = (orginalSize[0] - orginalSize[1]) > 0 ? "width" : "height";				

				// Override css for images with different height and width
				if(overflowsize == 'width'){
					var offsetLeft = ((orginalSize[0] / (orginalSize[1] / imgHeight )) - imgWidth) / 2;
					var dimensions = Math.floor( resizeRatio * outerHeight ) - marginHeight;
					thisGalleryElement
						.attr('style', 'width: auto; height:' + dimensions + 'px; max-width: none !important; margin: 0 0 0 -' + offsetLeft + 'px !important;')
						.closest('div').css({overflow: 'hidden', width: dimensions + 'px', height: dimensions + 'px'});
				}else if(overflowsize == 'height'){
					var offsetTop = ((orginalSize[1] / (orginalSize[0] / imgWidth )) - imgHeight) / 2;
					var dimensions = Math.floor( resizeRatio * outerWidth ) - marginWidth;				
					thisGalleryElement
						.attr('style', 'height: auto; margin:-' + offsetTop + 'px 0 0 0 !important;')
						.closest('div').css({overflow: 'hidden', width: dimensions + 'px', height: dimensions + 'px'})
				}
			}else{
				// Subtract margins so that images don't overflow on small browser windows
				thisGalleryElement
					.width( Math.floor( resizeRatio * outerWidth ) - marginWidth )
					.height( Math.floor( resizeRatio * outerHeight ) - marginHeight );			
			}
		} );
	};

	/**
	 * Resizing logic
	 */

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

	function attachResizeInAnimationFrames( tiledGalleries ) {
		var resizing = false;
		var resizeTimeout = null;

		function handleFrame() {
			tiledGalleries.resizeAll();
			if ( resizing ) requestAnimationFrame( handleFrame );
		}

		$( window ).resize( function() {
			clearTimeout( resizeTimeout );

			if ( ! resizing ) requestAnimationFrame( handleFrame );
			resizing = true;
			resizeTimeout = setTimeout( function() {
				resizing = false;
			}, 15 );
		} );
	}

	function attachPlainResize( tiledGalleries ) {
		$( window ).resize( function() {
			tiledGalleries.resizeAll();
		} );
	}

	/**
	 * Ready, set...
	 */

	$( document ).ready( function() {
		var tiledGalleries = new TiledGalleryCollection();

		$( 'body' ).on( 'post-load', function() {
			tiledGalleries.findAndSetupNewGalleries();
		} );
		$( document ).on( 'page-rendered.wpcom-newdash', function() {
			tiledGalleries.findAndSetupNewGalleries();
		} );

		// Chrome is a unique snow flake and will start lagging on occasion
		// It helps if we only resize on animation frames
		//
		// For other browsers it seems like there is no lag even if we resize every
		// time there is an event
		if ( window.chrome && requestAnimationFrame ) {
			attachResizeInAnimationFrames( tiledGalleries );
		} else {
			attachPlainResize( tiledGalleries );
		}
	});

})(jQuery);
