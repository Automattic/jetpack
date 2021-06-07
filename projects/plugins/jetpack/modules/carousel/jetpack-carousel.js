/* global wpcom, jetpackCarouselStrings, DocumentTouch */

jQuery( document ).ready( function ( $ ) {
	'use strict';

	// gallery faded layer and container elements
	var overlay,
		gallery,
		container,
		info,
		transitionBegin,
		caption,
		resizeTimeout,
		commentInterval,
		lastSelectedSlide,
		screenPadding,
		originalOverflow = $( 'body' ).css( 'overflow' ),
		originalHOverflow = $( 'html' ).css( 'overflow' ),
		proportion = 85,
		lastKnownLocationHash = '',
		scrollPos,
		isUserTyping = false;

	var noop = function () {};

	var stat =
		typeof wpcom !== 'undefined' && wpcom.carousel && wpcom.carousel.stat
			? wpcom.carousel.stat
			: noop;

	var pageview =
		typeof wpcom !== 'undefined' && wpcom.carousel && wpcom.carousel.pageview
			? wpcom.carousel.pageview
			: noop;

	function handleKeyboardEvent( e ) {
		if ( ! isUserTyping ) {
			switch ( e.which ) {
				case 38: // up
					e.preventDefault();
					container.scrollTop( container.scrollTop() - 100 );
					break;
				case 40: // down
					e.preventDefault();
					container.scrollTop( container.scrollTop() + 100 );
					break;
				case 39: // right
					e.preventDefault();
					moveToNextSlide();
					break;
				case 37: // left
				case 8: // backspace
					e.preventDefault();
					moveToPreviousSlide();
					break;
				case 27: // escape
					e.preventDefault();
					closeCarousel();
					break;
				default:
					// making lint happy
					break;
			}
		}
	}

	function disableKeyboardNavigation() {
		isUserTyping = true;
	}

	function enableKeyboardNavigation() {
		isUserTyping = false;
	}

	function calculatePadding() {
		var baseScreenPadding = 110;
		screenPadding = baseScreenPadding;

		if ( window.innerWidth <= 760 ) {
			screenPadding = Math.round( ( window.innerWidth / 760 ) * baseScreenPadding );
			var isTouch =
				'ontouchstart' in window || ( window.DocumentTouch && document instanceof DocumentTouch );

			if ( screenPadding < 40 && isTouch ) {
				screenPadding = 0;
			}
		}
	}

	function texturize( text ) {
		text = '' + text; // make sure we get a string. Title "1" came in as int 1, for example, which did not support .replace().
		text = text
			.replace( /'/g, '&#8217;' )
			.replace( /&#039;/g, '&#8217;' )
			.replace( /[\u2019]/g, '&#8217;' );
		text = text
			.replace( /"/g, '&#8221;' )
			.replace( /&#034;/g, '&#8221;' )
			.replace( /&quot;/g, '&#8221;' )
			.replace( /[\u201D]/g, '&#8221;' );
		text = text.replace( /([\w]+)=&#[\d]+;(.+?)&#[\d]+;/g, '$1="$2"' ); // untexturize allowed HTML tags params double-quotes
		return $.trim( text );
	}

	function resizeListener() {
		// Don't animate if user prefers reduced motion.
		var shouldAnimate =
			window.matchMedia && ! window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

		clearTimeout( resizeTimeout );
		resizeTimeout = setTimeout( function () {
			calculatePadding();
			var slides = getSlides( gallery );
			fitSlides( slides );
			updateSlidePositions( shouldAnimate );
			fitMeta( shouldAnimate );
		}, 200 );
	}

	function fitMeta( animated ) {
		var newInfoPos = {
			left: screenPadding + 'px',
			right: screenPadding + 'px',
		};

		if ( animated ) {
			info.animate( newInfoPos );
		} else {
			info.css( newInfoPos );
		}
	}

	function initializeCarousel() {
		if ( ! overlay ) {
			container = $( '.jp-carousel-wrap' );
			overlay = container.find( '.jp-carousel-overlay' );

			gallery = container.find( '.jp-carousel' );
			caption = container.find( '.jp-carousel-caption' );
			info = container.find( '.jp-carousel-info' );

			var nextButton = container.find( '.jp-carousel-next-button' );
			var previousButton = container.find( '.jp-carousel-previous-button' );

			calculatePadding();
			fitMeta( false );

			var textarea = $( '#jp-carousel-comment-form-comment-field' );
			var emailField = $( '#jp-carousel-comment-form-email-field' );
			var authorField = $( '#jp-carousel-comment-form-author-field' );
			var urlField = $( '#jp-carousel-comment-form-url-field' );

			[ textarea, emailField, authorField, urlField ].forEach( function ( field ) {
				field.focus( disableKeyboardNavigation );
				field.blur( enableKeyboardNavigation );
			} );

			container.click( function ( e ) {
				var target = $( e.target );
				var isTargetCloseHint = target
					.parents()
					.add( target )
					.is( container.find( '.jp-carousel-close-hint' ) );
				var isSmallScreen = !! window.matchMedia( '(max-device-width: 760px)' ).matches;

				if ( target.is( gallery ) ) {
					if ( isSmallScreen ) {
						handleCarouselGalleryTouch( e );
					} else {
						closeCarousel();
					}
				} else if ( isTargetCloseHint ) {
					closeCarousel();
				} else if ( target.hasClass( 'jp-carousel-image-download' ) ) {
					stat( 'download_original_click' );
				} else if ( target.hasClass( 'jp-carousel-commentlink' ) ) {
					handleCommentLinkClick( e );
				} else if ( target.hasClass( 'jp-carousel-comment-login' ) ) {
					handleCommentLoginClick( e );
				} else if ( target.parents( '#jp-carousel-comment-form-container' ).length ) {
					handleCommentFormClick( e );
				} else if ( ! target.parents( '.jp-carousel-info' ).length ) {
					if ( isSmallScreen ) {
						handleCarouselGalleryTouch( e );
					} else {
						moveToNextSlide();
					}
				}
			} );

			$( window ).bind( 'keydown', handleKeyboardEvent );

			container.bind( 'jp_carousel.afterOpen', function () {
				enableKeyboardNavigation();
				$( window ).bind( 'resize', resizeListener );
				gallery.opened = true;

				resizeListener();
			} );

			container.bind( 'jp_carousel.beforeClose', function () {
				var scroll = $( window ).scrollTop();

				disableKeyboardNavigation();
				$( window ).unbind( 'resize', resizeListener );
				$( window ).scrollTop( scroll );
				$( '.jp-carousel-previous-button' ).hide();
				$( '.jp-carousel-next-button' ).hide();
				// Set height to original value
				// Fix some themes where closing carousel brings view back to top
				$( 'html' ).css( 'height', '' );
			} );

			container.bind( 'jp_carousel.afterClose', function () {
				if ( window.location.hash && history.back ) {
					history.back();
				}
				lastKnownLocationHash = '';
				gallery.opened = false;
			} );

			container.on( 'transitionend.jp-carousel ', '.jp-carousel-slide', function ( e ) {
				// If the movement transitions take more than twice the allotted time, disable them.
				// There is some wiggle room in the 2x, since some of that time is taken up in
				// JavaScript, setting up the transition and calling the events.
				if ( e.originalEvent.propertyName === 'transform' ) {
					var transitionMultiplier =
						( Date.now() - transitionBegin ) / 1000 / e.originalEvent.elapsedTime;

					container.off( 'transitionend.jp-carousel' );

					if ( transitionMultiplier >= 2 ) {
						$( '.jp-carousel-transitions' ).removeClass( 'jp-carousel-transitions' );
					}
				}
			} );

			addWipeHandler( {
				root: container.get( 0 ),
				wipeLeft: function ( e ) {
					e.preventDefault();
					moveToNextSlide();
				},
				wipeRight: function ( e ) {
					e.preventDefault();
					moveToPreviousSlide();
				},
			} );

			nextButton.add( previousButton ).click( function ( e ) {
				e.preventDefault();
				e.stopPropagation();
				if ( nextButton.is( this ) ) {
					moveToNextSlide();
				} else {
					moveToPreviousSlide();
				}
			} );
		}
	}

	function handleCarouselGalleryTouch( e ) {
		if ( e.pageX <= 70 ) {
			moveToPreviousSlide();
		}
		if ( $( window ).width() - e.pageX <= 70 ) {
			moveToNextSlide();
		}
	}

	function handleCommentLinkClick( e ) {
		e.preventDefault();
		e.stopPropagation();
		disableKeyboardNavigation();
		container.animate( { scrollTop: parseInt( info.position()[ 'top' ], 10 ) }, 'fast' );
		$( '#jp-carousel-comment-form-submit-and-info-wrapper' ).slideDown( 'fast' );
		$( '#jp-carousel-comment-form-comment-field' ).focus();
	}

	function handleCommentLoginClick( e ) {
		var target = $( e.target );
		var wrap = target.parents( 'div.jp-carousel-wrap' );
		var slide = wrap.find( 'div.selected' );
		var attachmentId = slide.data( 'attachment-id' );

		window.location.href = jetpackCarouselStrings.login_url + '%23jp-carousel-' + attachmentId;
	}

	function handleCommentFormClick( e ) {
		var target = $( e.target );
		var wrap = target.parents( 'div.jp-carousel-wrap' );
		var data = wrap.data( 'carousel-extra' ) || {};
		var blogId = data[ 'blog_id' ];
		var slide = wrap.find( 'div.selected' );
		var attachmentId = slide.data( 'attachment-id' );

		var textarea = $( '#jp-carousel-comment-form-comment-field' );
		var emailField = $( '#jp-carousel-comment-form-email-field' );
		var authorField = $( '#jp-carousel-comment-form-author-field' );
		var urlField = $( '#jp-carousel-comment-form-url-field' );

		if ( textarea && textarea.attr( 'id' ) === target.attr( 'id' ) ) {
			// For first page load
			disableKeyboardNavigation();
			$( '#jp-carousel-comment-form-submit-and-info-wrapper' ).slideDown( 'fast' );
		} else if ( target.is( 'input[type="submit"]' ) ) {
			e.preventDefault();
			e.stopPropagation();

			$( '#jp-carousel-comment-form-spinner' ).show();

			var ajaxData = {
				action: 'post_attachment_comment',
				nonce: jetpackCarouselStrings.nonce,
				blog_id: blogId,
				id: attachmentId,
				comment: textarea.val(),
			};

			if ( ! ajaxData[ 'comment' ].length ) {
				handlePostCommentError(
					'jp-carousel-comment-form-comment-field',
					jetpackCarouselStrings.no_comment_text
				);
				return;
			}

			if ( Number( jetpackCarouselStrings.is_logged_in !== 1 ) ) {
				ajaxData[ 'email' ] = emailField.val();
				ajaxData[ 'author' ] = authorField.val();
				ajaxData[ 'url' ] = urlField.val();

				if ( Number( jetpackCarouselStrings.require_name_email === 1 ) ) {
					if ( ! ajaxData[ 'email' ].length || ! ajaxData[ 'email' ].match( '@' ) ) {
						handlePostCommentError(
							'jp-carousel-comment-form-email-field',
							jetpackCarouselStrings.no_comment_email
						);
						return;
					} else if ( ! ajaxData[ 'author' ].length ) {
						handlePostCommentError(
							'jp-carousel-comment-form-author-field',
							jetpackCarouselStrings.no_comment_author
						);
						return;
					}
				}
			}

			$.ajax( {
				type: 'POST',
				url: jetpackCarouselStrings.ajaxurl,
				data: ajaxData,
				dataType: 'json',
				success: function ( response ) {
					if ( response.comment_status === 'approved' ) {
						$( '#jp-carousel-comment-post-results' )
							.slideUp( 'fast' )
							.html(
								'<span class="jp-carousel-comment-post-success">' +
									jetpackCarouselStrings.comment_approved +
									'</span>'
							)
							.slideDown( 'fast' );
					} else if ( response.comment_status === 'unapproved' ) {
						$( '#jp-carousel-comment-post-results' )
							.slideUp( 'fast' )
							.html(
								'<span class="jp-carousel-comment-post-success">' +
									jetpackCarouselStrings.comment_unapproved +
									'</span>'
							)
							.slideDown( 'fast' );
					} else {
						// 'deleted', 'spam', false
						$( '#jp-carousel-comment-post-results' )
							.slideUp( 'fast' )
							.html(
								'<span class="jp-carousel-comment-post-error">' +
									jetpackCarouselStrings.comment_post_error +
									'</span>'
							)
							.slideDown( 'fast' );
					}
					clearCommentTextAreaValue();
					fetchComments( attachmentId, 0, true );
					$( '#jp-carousel-comment-form-button-submit' ).val( jetpackCarouselStrings.post_comment );
					$( '#jp-carousel-comment-form-spinner' ).hide();
				},
				error: function () {
					// TODO: Add error handling and display here
					handlePostCommentError(
						'jp-carousel-comment-form-comment-field',
						jetpackCarouselStrings.comment_post_error
					);
					return;
				},
			} );
		}
	}

	function processSingleImageGallery() {
		// process links that contain img tag with attribute data-attachment-id
		$( 'a img[data-attachment-id]' ).each( function () {
			var cont = $( this ).parent();

			// skip if image was already added to gallery by shortcode
			if ( cont.parent( '.gallery-icon' ).length ) {
				return;
			}

			// skip if the container is not a link
			if ( typeof $( cont ).attr( 'href' ) === 'undefined' ) {
				return;
			}

			var valid = false;

			// if link points to 'Media File' (ignoring GET parameters) and flag is set allow it
			if (
				$( cont ).attr( 'href' ).split( '?' )[ 0 ] ===
					$( this ).attr( 'data-orig-file' ).split( '?' )[ 0 ] &&
				Number( jetpackCarouselStrings.single_image_gallery_media_file === 1 )
			) {
				valid = true;
			}

			// if link points to 'Attachment Page' allow it
			if ( $( cont ).attr( 'href' ) === $( this ).attr( 'data-permalink' ) ) {
				valid = true;
			}

			// links to 'Custom URL' or 'Media File' when flag not set are not valid
			if ( ! valid ) {
				return;
			}

			// make this node a gallery recognizable by event listener above
			$( cont ).addClass( 'single-image-gallery' );
			// blog_id is needed to allow posting comments to correct blog
			$( cont ).data( 'carousel-extra', {
				blog_id: Number( jetpackCarouselStrings.blog_id ),
			} );
		} );
	}

	function testForData( el ) {
		var $el = $( el );
		return ! ( ! $el.length || ! $el.data( 'carousel-extra' ) );
	}

	function isCarouselOpen() {
		return !! (
			typeof gallery !== 'undefined' &&
			typeof gallery.opened !== 'undefined' &&
			gallery.opened
		);
	}

	function openOrSelectSlide( gal, index ) {
		// The `open` method triggers an asynchronous effect, so we will get an
		// error if we try to use `openCarousel` then `selectSlideAtIndex`
		// immediately after it. We can only use `selectSlideAtIndex` if the
		// carousel is already open.
		if ( ! isCarouselOpen() ) {
			// The `open` method selects the correct slide during the
			// initialization.
			openCarousel( gal, { startIndex: index } );
		} else {
			selectSlideAtIndex( index );
		}
	}

	function selectSlideAtIndex( index ) {
		var slides = getSlides( gallery ),
			selected = slides.eq( index );

		if ( selected.length === 0 ) {
			selected = slides.eq( 0 );
		}

		selectSlide( selected, false );
	}

	function moveToNextSlide() {
		moveToPreviousOrNextSlide( getNextSlide );
	}

	function moveToPreviousSlide() {
		moveToPreviousOrNextSlide( getPrevSlide );
	}

	function moveToPreviousOrNextSlide( slideSelectionMethod ) {
		if ( getSlides( gallery ).length <= 1 ) {
			return false;
		}

		var slide = slideSelectionMethod( gallery );

		if ( slide ) {
			container.animate( { scrollTop: 0 }, 'fast' );
			clearCommentTextAreaValue();
			selectSlide( slide );
			stat( [ 'previous', 'view_image' ] );
		}
	}

	function getSelectedSlide( el ) {
		return el.find( '.selected' );
	}

	function getNextSlide( galleryEl ) {
		var slides = getSlides( galleryEl );
		var selected = getSelectedSlide( galleryEl );

		if ( selected.length === 0 || ( slides.length > 2 && selected.is( slides.last() ) ) ) {
			return slides.first();
		}

		return selected.next();
	}

	function getPrevSlide( galleryEl ) {
		var slides = getSlides( galleryEl );
		var selected = getSelectedSlide( galleryEl );

		if ( selected.length === 0 || ( slides.length > 2 && selected.is( slides.first() ) ) ) {
			return slides.last();
		}

		return selected.prev();
	}

	function closeCarousel() {
		// make sure to let the page scroll again
		$( 'body' ).css( 'overflow', originalOverflow );
		$( 'html' ).css( 'overflow', originalHOverflow );
		clearCommentTextAreaValue();

		container.trigger( 'jp_carousel.beforeClose' );

		container.fadeOut( 'fast', function () {
			container.trigger( 'jp_carousel.afterClose' );
			$( window ).scrollTop( scrollPos );
		} );
	}

	function setSlidePosition( slide, x ) {
		transitionBegin = Date.now();

		slide.css( {
			transform: 'translate3d(' + x + 'px,0,0)',
		} );
	}

	function updateSlidePositions( shouldAnimate ) {
		var current = getSelectedSlide( gallery );
		var galleryWidth = gallery.width(),
			currentWidth = current.width(),
			previous = getPrevSlide( gallery ),
			next = getNextSlide( gallery ),
			previousPrevious = previous.prev(),
			nextNext = next.next(),
			left = Math.floor( ( galleryWidth - currentWidth ) * 0.5 );

		setSlidePosition( current, left );
		current.show();

		// minimum width
		fitInfo( shouldAnimate );

		// prep the slides
		var direction = lastSelectedSlide.is( current.prevAll() ) ? 1 : -1;

		// Since we preload the `previousPrevious` and `nextNext` slides, we need
		// to make sure they technically visible in the DOM, but invisible to the
		// user. To hide them from the user, we position them outside the edges
		// of the window.
		//
		// This section of code only applies when there are more than three
		// slides. Otherwise, the `previousPrevious` and `nextNext` slides will
		// overlap with the `previous` and `next` slides which must be visible
		// regardless.
		if ( direction === 1 ) {
			if ( ! nextNext.is( previous ) ) {
				setSlidePosition( nextNext, galleryWidth + next.width() );
				nextNext.show();
			}

			if ( ! previousPrevious.is( next ) ) {
				setSlidePosition( previousPrevious, -previousPrevious.width() - currentWidth );
				previousPrevious.show();
			}
		} else {
			if ( ! nextNext.is( previous ) ) {
				setSlidePosition( nextNext, galleryWidth + currentWidth );
				nextNext.show();
			}
		}

		setSlidePosition( previous, Math.floor( -previous.width() + screenPadding * 0.75 ) );
		previous.show();

		setSlidePosition( next, Math.ceil( galleryWidth - screenPadding * 0.75 ) );
		next.show();
	}

	function selectSlide( slide, animate ) {
		lastSelectedSlide = gallery.find( '.selected' );
		lastSelectedSlide.removeClass( 'selected' );

		var slides = getSlides( gallery );
		var currentSlide = $( slide );
		var attachmentId = currentSlide.data( 'attachment-id' );
		var previous = getPrevSlide( gallery );
		var next = getNextSlide( gallery );
		var previousPrevious = previous.prev();
		var nextNext = next.next();
		var animated;
		var captionHtml;

		slides.css( { position: 'fixed' } );
		currentSlide.addClass( 'selected' ).css( { position: 'relative' } );

		// center the main image
		loadFullImage( currentSlide );

		caption.hide();

		if ( next.length === 0 && slides.length <= 2 ) {
			$( '.jp-carousel-next-button' ).hide();
		} else {
			$( '.jp-carousel-next-button' ).show();
		}

		if ( previous.length === 0 && slides.length <= 2 ) {
			$( '.jp-carousel-previous-button' ).hide();
		} else {
			$( '.jp-carousel-previous-button' ).show();
		}

		animated = loadSlides(
			currentSlide.add( previous ).add( previousPrevious ).add( next ).add( nextNext )
		);

		// slide the whole view to the x we want
		slides.not( animated ).hide();

		updateSlidePositions( animate );
		container.trigger( 'jp_carousel.selectSlide', [ currentSlide ] );

		updateTitleAndDesc( {
			title: currentSlide.data( 'title' ),
			desc: currentSlide.data( 'desc' ),
		} );

		var imageMeta = currentSlide.data( 'image-meta' );
		updateExif( imageMeta );
		updateFullSizeLink( currentSlide );

		if ( Number( jetpackCarouselStrings.display_comments ) === 1 ) {
			testCommentsOpened( currentSlide.data( 'comments-opened' ) );
			fetchComments( attachmentId, 0, true );
			$( '#jp-carousel-comment-post-results' ).slideUp();
		}

		// $('<div />').text(sometext).html() is a trick to go to HTML to plain
		// text (including HTML entities decode, etc)
		if ( currentSlide.data( 'caption' ) ) {
			captionHtml = $( '<div />' ).text( currentSlide.data( 'caption' ) ).html();

			if ( captionHtml === $( '<div />' ).text( currentSlide.data( 'title' ) ).html() ) {
				$( '.jp-carousel-titleanddesc-title' ).fadeOut( 'fast' ).empty();
			}

			if ( captionHtml === $( '<div />' ).text( currentSlide.data( 'desc' ) ).html() ) {
				$( '.jp-carousel-titleanddesc-desc' ).fadeOut( 'fast' ).empty();
			}

			caption.html( currentSlide.data( 'caption' ) ).fadeIn( 'slow' );
		} else {
			caption.fadeOut( 'fast' ).empty();
		}

		// Record pageview in WP Stats, for each new image loaded full-screen.
		if ( jetpackCarouselStrings.stats ) {
			new Image().src =
				document.location.protocol +
				'//pixel.wp.com/g.gif?' +
				jetpackCarouselStrings.stats +
				'&post=' +
				encodeURIComponent( attachmentId ) +
				'&rand=' +
				Math.random();
		}

		pageview( attachmentId );
		// Load the images for the next and previous slides.
		$( next )
			.add( previous )
			.each( function () {
				loadFullImage( $( this ) );
			} );

		window.location.hash = lastKnownLocationHash = '#jp-carousel-' + attachmentId;
	}

	function getSlides( gal ) {
		return gal.find( '.jp-carousel-slide' );
	}

	function calculateMaxSlideDimensions() {
		return {
			width: $( window ).width() - screenPadding * 2,
			height: Math.floor( ( $( window ).height() / 100 ) * proportion - 60 ),
		};
	}

	function calculateBestFit( slide ) {
		var max = calculateMaxSlideDimensions();
		var orig = getOriginalDimensions( slide ),
			origRatio = orig.width / orig.height,
			wRatio = 1,
			hRatio = 1,
			width,
			height;

		if ( orig.width > max.width ) {
			wRatio = max.width / orig.width;
		}
		if ( orig.height > max.height ) {
			hRatio = max.height / orig.height;
		}

		if ( wRatio < hRatio ) {
			width = max.width;
			height = Math.floor( width / origRatio );
		} else if ( hRatio < wRatio ) {
			height = max.height;
			width = Math.floor( height * origRatio );
		} else {
			width = orig.width;
			height = orig.height;
		}

		return {
			width: width,
			height: height,
		};
	}

	function loadSlides( slides ) {
		return slides.each( function () {
			var slide = $( this );
			slide.find( 'img' ).one( 'load', function () {
				// set the width/height of the image if it's too big
				fitSlides( slide );
			} );
		} );
	}

	function fitInfo() {
		var current = getSelectedSlide( gallery );
		var size = calculateBestFit( current );

		container.find( '.jp-carousel-photo-info' ).css( {
			left: Math.floor( ( info.width() - size.width ) * 0.5 ),
			width: Math.floor( size.width ),
		} );
	}

	function fitSlides( slides ) {
		return slides.each( function () {
			var $slide = $( this ),
				dimensions = calculateBestFit( $slide ),
				max = calculateMaxSlideDimensions();

			dimensions.left = 0;
			dimensions.top = Math.floor( ( max.height - dimensions.height ) * 0.5 ) + 40;
			$slide.css( dimensions );
		} );
	}

	function selectBestImageUrl( args ) {
		if ( typeof args !== 'object' ) {
			args = {};
		}

		if ( typeof args.origFile === 'undefined' ) {
			return '';
		}

		if ( typeof args.origWidth === 'undefined' || typeof args.maxWidth === 'undefined' ) {
			return args.origFile;
		}

		if ( typeof args.mediumFile === 'undefined' || typeof args.largeFile === 'undefined' ) {
			return args.origFile;
		}

		// Check if the image is being served by Photon (using a regular expression on the hostname).

		var imageLinkParser = document.createElement( 'a' );
		imageLinkParser.href = args.largeFile;

		var isPhotonUrl = /^i[0-2]\.wp\.com$/i.test( imageLinkParser.hostname );

		var mediumSizeParts = getImageSizeParts( args.mediumFile, args.origWidth, isPhotonUrl );
		var largeSizeParts = getImageSizeParts( args.largeFile, args.origWidth, isPhotonUrl );

		var largeWidth = parseInt( largeSizeParts[ 0 ], 10 ),
			largeHeight = parseInt( largeSizeParts[ 1 ], 10 ),
			mediumWidth = parseInt( mediumSizeParts[ 0 ], 10 ),
			mediumHeight = parseInt( mediumSizeParts[ 1 ], 10 );

		// Assign max width and height.
		args.origMaxWidth = args.maxWidth;
		args.origMaxHeight = args.maxHeight;

		// Give devices with a higher devicePixelRatio higher-res images (Retina display = 2, Android phones = 1.5, etc)
		if ( typeof window.devicePixelRatio !== 'undefined' && window.devicePixelRatio > 1 ) {
			args.maxWidth = args.maxWidth * window.devicePixelRatio;
			args.maxHeight = args.maxHeight * window.devicePixelRatio;
		}

		if ( largeWidth >= args.maxWidth || largeHeight >= args.maxHeight ) {
			return args.largeFile;
		}

		if ( mediumWidth >= args.maxWidth || mediumHeight >= args.maxHeight ) {
			return args.mediumFile;
		}

		if ( isPhotonUrl ) {
			// args.origFile doesn't point to a Photon url, so in this case we use args.largeFile
			// to return the photon url of the original image.
			var largeFileIndex = args.largeFile.lastIndexOf( '?' );
			var origPhotonUrl = args.largeFile;
			if ( largeFileIndex !== -1 ) {
				origPhotonUrl = args.largeFile.substring( 0, largeFileIndex );
				// If we have a really large image load a smaller version
				// that is closer to the viewable size
				if ( args.origWidth > args.maxWidth || args.origHeight > args.maxHeight ) {
					origPhotonUrl += '?fit=' + args.origMaxWidth + '%2C' + args.origMaxHeight;
				}
			}
			return origPhotonUrl;
		}

		return args.origFile;
	}

	function getImageSizeParts( file, origWidth, isPhotonUrl ) {
		var size = isPhotonUrl
			? file.replace( /.*=([\d]+%2C[\d]+).*$/, '$1' )
			: file.replace( /.*-([\d]+x[\d]+)\..+$/, '$1' );

		var sizeParts =
			size !== file ? ( isPhotonUrl ? size.split( '%2C' ) : size.split( 'x' ) ) : [ origWidth, 0 ];

		// If one of the dimensions is set to 9999, then the actual value of that dimension can't be retrieved from the url.
		// In that case, we set the value to 0.
		if ( sizeParts[ 0 ] === '9999' ) {
			sizeParts[ 0 ] = '0';
		}

		if ( sizeParts[ 1 ] === '9999' ) {
			sizeParts[ 1 ] = '0';
		}

		return sizeParts;
	}

	function getOriginalDimensions( slide ) {
		var splitted = $( slide ).data( 'orig-size' ).split( ',' );
		return { width: parseInt( splitted[ 0 ], 10 ), height: parseInt( splitted[ 1 ], 10 ) };
	}

	function applyReplacements( text, replacements ) {
		if ( ! text ) {
			return;
		}
		if ( ! replacements ) {
			return text;
		}
		return text.replace( /{(\d+)}/g, function ( match, number ) {
			return typeof replacements[ number ] !== 'undefined' ? replacements[ number ] : match;
		} );
	}

	/**
	 * Returns a number in a fraction format that represents the shutter speed.
	 * @param Number speed
	 * @return String
	 */
	function formatShutterSpeed( speed ) {
		var denominator;

		// round to one decimal if value > 1s by multiplying it by 10, rounding, then dividing by 10 again
		if ( speed >= 1 ) {
			return Math.round( speed * 10 ) / 10 + 's';
		}

		// If the speed is less than one, we find the denominator by inverting
		// the number. Since cameras usually use rational numbers as shutter
		// speeds, we should get a nice round number. Or close to one in cases
		// like 1/30. So we round it.
		denominator = Math.round( 1 / speed );

		return '1/' + denominator + 's';
	}

	function parseTitleAndDesc( value ) {
		if ( ! value.match( ' ' ) && value.match( '_' ) ) {
			return '';
		}

		return value;
	}

	function updateTitleAndDesc( data ) {
		var title = '',
			desc = '',
			markup = '',
			target;

		target = $( 'div.jp-carousel-titleanddesc', 'div.jp-carousel-wrap' );
		target.hide();

		title = parseTitleAndDesc( data.title ) || '';
		desc = parseTitleAndDesc( data.desc ) || '';

		if ( title.length || desc.length ) {
			// Convert from HTML to plain text (including HTML entities decode, etc)
			if ( $( '<div />' ).html( title ).text() === $( '<div />' ).html( desc ).text() ) {
				title = '';
			}

			markup = title.length
				? '<div class="jp-carousel-titleanddesc-title">' + title + '</div>'
				: '';
			markup += desc.length ? '<div class="jp-carousel-titleanddesc-desc">' + desc + '</div>' : '';

			target.html( markup ).fadeIn( 'slow' );
		}

		$( 'div#jp-carousel-comment-form-container' ).css( 'margin-top', '20px' );
		$( 'div#jp-carousel-comments-loading' ).css( 'margin-top', '20px' );
	}

	// updateExif updates the contents of the exif UL (.jp-carousel-image-exif)
	function updateExif( meta ) {
		if ( ! meta || Number( jetpackCarouselStrings.display_exif ) !== 1 ) {
			return false;
		}

		var $ul = $( "<ul class='jp-carousel-image-exif'></ul>" );

		$.each( meta, function ( key, val ) {
			if (
				parseFloat( val ) === 0 ||
				! val.length ||
				$.inArray( key, $.makeArray( jetpackCarouselStrings.meta_data ) ) === -1
			) {
				return;
			}

			switch ( key ) {
				case 'focal_length':
					val = val + 'mm';
					break;
				case 'shutter_speed':
					val = formatShutterSpeed( val );
					break;
				case 'aperture':
					val = 'f/' + val;
					break;
			}

			$ul.append( '<li><h5>' + jetpackCarouselStrings[ key ] + '</h5>' + val + '</li>' );
		} );

		// Update (replace) the content of the ul
		$( 'div.jp-carousel-image-meta ul.jp-carousel-image-exif' ).replaceWith( $ul );
	}

	// updateFullSizeLink updates the contents of the jp-carousel-image-download link
	function updateFullSizeLink( currentSlide ) {
		if ( ! currentSlide || ! currentSlide.data ) {
			return false;
		}
		var original,
			origSize = currentSlide.data( 'orig-size' ).split( ',' ),
			imageLinkParser = document.createElement( 'a' );

		imageLinkParser.href = currentSlide.data( 'src' ).replace( /\?.+$/, '' );

		// Is this a Photon URL?
		if ( imageLinkParser.hostname.match( /^i[\d]{1}\.wp\.com$/i ) !== null ) {
			original = imageLinkParser.href;
		} else {
			original = currentSlide.data( 'orig-file' ).replace( /\?.+$/, '' );
		}

		var permalink = $(
			'<a>' + applyReplacements( jetpackCarouselStrings.download_original, origSize ) + '</a>'
		)
			.addClass( 'jp-carousel-image-download' )
			.attr( 'href', original )
			.attr( 'target', '_blank' );

		// Update (replace) the content of the anchor
		$( 'div.jp-carousel-image-meta a.jp-carousel-image-download' ).replaceWith( permalink );
	}

	function testCommentsOpened( opened ) {
		var commentForm = container.find( '.jp-carousel-comment-form-container' );

		if ( parseInt( opened, 10 ) === 1 ) {
			if ( Number( jetpackCarouselStrings.is_logged_in ) === 1 ) {
				$( '.jp-carousel-commentlink' ).fadeIn( 'fast' );
			} else {
				$( '.jp-carousel-buttons' ).fadeIn( 'fast' );
			}
			commentForm.fadeIn( 'fast' );
		} else {
			if ( Number( jetpackCarouselStrings.is_logged_in ) === 1 ) {
				$( '.jp-carousel-commentlink' ).fadeOut( 'fast' );
			} else {
				$( '.jp-carousel-buttons' ).fadeOut( 'fast' );
			}
			commentForm.fadeOut( 'fast' );
		}
	}

	function fetchComments( attachmentId, offset, clear ) {
		clearInterval( commentInterval );

		if ( ! attachmentId ) {
			return;
		}

		if ( ! offset || offset < 1 ) {
			offset = 0;
		}

		var comments = $( '.jp-carousel-comments' );
		var commentsLoading = $( '#jp-carousel-comments-loading' ).show();

		if ( clear ) {
			comments.hide().empty();
		}

		$.ajax( {
			type: 'GET',
			url: jetpackCarouselStrings.ajaxurl,
			dataType: 'json',
			data: {
				action: 'get_attachment_comments',
				nonce: jetpackCarouselStrings.nonce,
				id: attachmentId,
				offset: offset,
			},
			success: function ( data ) {
				if ( clear ) {
					comments.fadeOut( 'fast' ).empty();
				}

				$( data ).each( function () {
					var comment = $( '<div></div>' )
						.addClass( 'jp-carousel-comment' )
						.attr( 'id', 'jp-carousel-comment-' + this[ 'id' ] )
						.html(
							'<div class="comment-gravatar">' +
								this[ 'gravatar_markup' ] +
								'</div>' +
								'<div class="comment-author">' +
								this[ 'author_markup' ] +
								'</div>' +
								'<div class="comment-date">' +
								this[ 'date_gmt' ] +
								'</div>' +
								'<div class="comment-content">' +
								this[ 'content' ] +
								'</div>'
						);
					comments.append( comment );

					// Set the interval to check for a new page of comments.
					clearInterval( commentInterval );
					commentInterval = setInterval( function () {
						if (
							$( '.jp-carousel-overlay' ).height() - 150 <
							$( '.jp-carousel-wrap' ).scrollTop() + $( window ).height()
						) {
							fetchComments( attachmentId, offset + 10, false );
							clearInterval( commentInterval );
						}
					}, 300 );
				} );

				// Verify (late) that the user didn't repeatldy click the arrows really fast, in which case the requested
				// attachment id might no longer match the current attachment id by the time we get the data back or a now
				// registered infiniscroll event kicks in, so we don't ever display comments for the wrong image by mistake.
				var current = $( '.jp-carousel div.selected' );
				if ( current && current.data && current.data( 'attachment-id' ) !== attachmentId ) {
					comments.fadeOut( 'fast' );
					comments.empty();
					return;
				}

				// Increase the height of the background, semi-transparent overlay to match the new length of the comments list.
				$( '.jp-carousel-overlay' ).height(
					$( window ).height() +
						container.find( '.jp-carousel-titleanddesc' ).height() +
						container.find( '.jp-carousel-comment-form-container' ).height() +
						( comments.height() > 0
							? comments.height()
							: container.find( '.jp-carousel-image-meta' ).height() ) +
						200
				);

				comments.show();
				commentsLoading.hide();
			},
			error: function () {
				// TODO: proper error handling
				comments.fadeIn( 'fast' );
				commentsLoading.fadeOut( 'fast' );
			},
		} );
	}

	function handlePostCommentError( field, error ) {
		if ( ! field || ! error ) {
			return;
		}
		$( '#jp-carousel-comment-post-results' )
			.slideUp( 'fast' )
			.html( '<span class="jp-carousel-comment-post-error">' + error + '</span>' )
			.slideDown( 'fast' );
		$( '#jp-carousel-comment-form-spinner' ).hide();
	}

	function clearCommentTextAreaValue() {
		var commentTextArea = $( '#jp-carousel-comment-form-comment-field' );
		if ( commentTextArea ) {
			commentTextArea.val( '' );
		}
	}

	function loadFullImage( slideEl ) {
		var slide = $( slideEl );
		var image = slide.find( 'img:first' );

		if ( ! image.data( 'loaded' ) ) {
			// If the width of the slide is smaller than the width of the "thumbnail" we're already using,
			// don't load the full image.

			image.on( 'load.jetpack', function () {
				image.off( 'load.jetpack' );
				gallery.closest( '.jp-carousel-slide' ).css( 'background-image', '' );
			} );

			if (
				! slide.data( 'preview-image' ) ||
				( slide.data( 'thumb-size' ) && slide.width() > slide.data( 'thumb-size' ).width )
			) {
				image
					.attr( 'src', image.closest( '.jp-carousel-slide' ).data( 'src' ) )
					.attr( 'itemprop', 'image' );
			} else {
				image.attr( 'src', slide.data( 'preview-image' ) ).attr( 'itemprop', 'image' );
			}

			image.data( 'loaded', 1 );
		}
	}

	function initCarouselSlides( items, startIndex ) {
		if ( items.length < 2 ) {
			$( '.jp-carousel-next-button, .jp-carousel-previous-button' ).hide();
		} else {
			$( '.jp-carousel-next-button, .jp-carousel-previous-button' ).show();
		}

		// Calculate the new src.
		items.each( function () {
			var srcItem = $( this );
			var origSize = srcItem.data( 'orig-size' ) || '';
			var max = calculateMaxSlideDimensions();
			var parts = origSize.split( ',' );
			var mediumFile = srcItem.data( 'medium-file' ) || '';
			var largeFile = srcItem.data( 'large-file' ) || '';

			var src;

			origSize = { width: parseInt( parts[ 0 ], 10 ), height: parseInt( parts[ 1 ], 10 ) };

			if ( typeof wpcom !== 'undefined' && wpcom.carousel && wpcom.carousel.generateImgSrc ) {
				src = wpcom.carousel.generateImgSrc( srcItem.get( 0 ), max );
			} else {
				src = srcItem.data( 'orig-file' );

				src = selectBestImageUrl( {
					origFile: src,
					origWidth: origSize.width,
					origHeight: origSize.height,
					maxWidth: max.width,
					maxHeight: max.height,
					mediumFile: mediumFile,
					largeFile: largeFile,
				} );
			}

			// Set the final src
			$( this )[ 0 ].setAttribute( 'data-gallery-src', src );
		} );

		// If the startIndex is not 0 then preload the clicked image first.
		if ( startIndex !== 0 ) {
			$( '<img/>' )[ 0 ].src = $( items[ startIndex ] ).data( 'gallery-src' );
		}

		var useInPageThumbnails = items.first().closest( '.tiled-gallery.type-rectangular' ).length > 0;

		// create the 'slide'
		items.each( function ( i ) {
			var srcItem = $( this );

			var attachmentId = srcItem.data( 'attachment-id' ) || 0;
			var commentsOpened = srcItem.data( 'comments-opened' ) || 0;
			var imageMeta = srcItem.data( 'image-meta' ) || {};
			var origSize = srcItem.data( 'orig-size' ) || '';
			var title = srcItem.data( 'image-title' ) || '';
			var description = srcItem.data( 'image-description' ) || '';
			var src = srcItem.data( 'gallery-src' ) || '';
			var mediumFile = srcItem.data( 'medium-file' ) || '';
			var largeFile = srcItem.data( 'large-file' ) || '';
			var origFile = srcItem.data( 'orig-file' ) || '';

			var caption = srcItem.parents( '.gallery-item' ).find( '.gallery-caption' ).html() || '';
			var thumbSize = { width: srcItem[ 0 ].naturalWidth, height: srcItem[ 0 ].naturalHeight };
			var permalink = srcItem.parents( 'a' ).attr( 'href' );

			var tiledCaption = srcItem
				.parents( 'div.tiled-gallery-item' )
				.find( 'div.tiled-gallery-caption' )
				.html();
			if ( tiledCaption ) {
				caption = tiledCaption;
			}

			if ( attachmentId && origSize.length ) {
				title = texturize( title );
				description = texturize( description );
				caption = texturize( caption );

				// Initially, the image is a 1x1 transparent gif.  The preview is shown as a background image on the slide itself.
				var image = $( '<img/>' )
					.attr(
						'src',
						'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
					)
					.css( 'width', '100%' )
					.css( 'height', '100%' );

				var slide = $(
					'<div class="jp-carousel-slide" itemprop="associatedMedia" itemscope itemtype="https://schema.org/ImageObject"></div>'
				)
					.hide()
					.css( {
						//'position' : 'fixed',
						left: i < startIndex ? -1000 : gallery.width(),
					} )
					.append( image )
					.appendTo( gallery )
					.data( 'src', src )
					.data( 'title', title )
					.data( 'desc', description )
					.data( 'caption', caption )
					.data( 'attachment-id', attachmentId )
					.data( 'permalink', permalink )
					.data( 'orig-size', origSize )
					.data( 'comments-opened', commentsOpened )
					.data( 'image-meta', imageMeta )
					.data( 'medium-file', mediumFile )
					.data( 'large-file', largeFile )
					.data( 'orig-file', origFile )
					.data( 'thumb-size', thumbSize );
				if ( useInPageThumbnails ) {
					// Use the image already loaded in the gallery as a preview.
					slide.data( 'preview-image', srcItem.attr( 'src' ) ).css( {
						'background-image': 'url("' + srcItem.attr( 'src' ) + '")',
						'background-size': '100% 100%',
						'background-position': 'center center',
					} );
				}

				fitSlides( slide );
			}
		} );
	}

	function openCarousel( gal, options ) {
		var settings = {
			items_selector:
				'.gallery-item [data-attachment-id], .tiled-gallery-item [data-attachment-id], img[data-attachment-id]',
			startIndex: 0,
		};

		var data = gal.data( 'carousel-extra' );

		if ( ! data ) {
			return; // don't run if the default gallery functions weren't used
		}

		initializeCarousel();

		if ( isCarouselOpen() ) {
			return; // don't open if already opened
		}

		// make sure to stop the page from scrolling behind the carousel overlay, so we don't trigger
		// infiniscroll for it when enabled (Reader, theme infiniscroll, etc).
		originalOverflow = $( 'body' ).css( 'overflow' );
		$( 'body' ).css( 'overflow', 'hidden' );
		// prevent html from overflowing on some of the new themes.
		originalHOverflow = $( 'html' ).css( 'overflow' );
		$( 'html' ).css( 'overflow', 'hidden' );
		scrollPos = $( window ).scrollTop();

		container.data( 'carousel-extra', data );
		stat( [ 'open', 'view_image' ] );

		return gal.each( function () {
			// If options exist, lets merge them
			// with our default settings
			if ( options ) {
				$.extend( settings, options );
			}
			if ( settings.startIndex === -1 ) {
				settings.startIndex = 0; //-1 returned if can't find index, so start from beginning
			}

			container.trigger( 'jp_carousel.beforeOpen' );

			container.fadeIn( 'fast', function () {
				container.trigger( 'jp_carousel.afterOpen' );
				initCarouselSlides( gal.find( settings.items_selector ), settings.startIndex );
				selectSlideAtIndex( settings.startIndex );
			} );
			gallery.html( '' );
		} );
	}

	// Wipe handler, inspired by https://www.netcu.de/jquery-touchwipe-iphone-ipad-library
	function addWipeHandler( args ) {
		args = args || {};
		var config = {
			root: document.body,
			threshold: 150, // Required min distance traveled to be considered swipe.
			restraint: 100, // Maximum distance allowed at the same time in perpendicular direction.
			allowedTime: 300, // Maximum time allowed to travel that distance.
			wipeLeft: function () {},
			wipeRight: function () {},
			wipeUp: function () {},
			wipeDown: function () {},
		};

		for ( var arg in args ) {
			config[ arg ] = args[ arg ];
		}

		var startX, startY, isMoving, startTime, elapsedTime;

		function cancelTouch() {
			config.root.removeEventListener( 'touchmove', onTouchMove );
			startX = null;
			isMoving = false;
		}

		function onTouchMove( e ) {
			if ( isMoving ) {
				var x = e.touches[ 0 ].pageX;
				var y = e.touches[ 0 ].pageY;
				var dx = startX - x;
				var dy = startY - y;
				elapsedTime = new Date().getTime() - startTime;
				if ( elapsedTime <= config.allowedTime ) {
					if ( Math.abs( dx ) >= config.threshold && Math.abs( dy ) <= config.restraint ) {
						cancelTouch();
						if ( dx > 0 ) {
							config.wipeLeft( e );
						} else {
							config.wipeRight( e );
						}
					} else if ( Math.abs( dy ) >= config.threshold && Math.abs( dx ) <= config.restraint ) {
						cancelTouch();
						if ( dy > 0 ) {
							config.wipeDown( e );
						} else {
							config.wipeUp( e );
						}
					}
				}
			}
		}

		function onTouchStart( e ) {
			if ( e.touches.length === 1 ) {
				startTime = new Date().getTime();
				startX = e.touches[ 0 ].pageX;
				startY = e.touches[ 0 ].pageY;
				isMoving = true;
				config.root.addEventListener( 'touchmove', onTouchMove, false );
			}
		}

		if ( 'ontouchstart' in document.documentElement ) {
			config.root.addEventListener( 'touchstart', onTouchStart, false );
		}
	}

	// register the event listener for starting the gallery
	$( document.body ).on(
		'click.jp-carousel',
		'div.gallery, div.tiled-gallery, ul.wp-block-gallery, ul.blocks-gallery-grid, figure.blocks-gallery-grid, div.wp-block-jetpack-tiled-gallery, a.single-image-gallery',
		function ( e ) {
			if ( ! testForData( e.currentTarget ) ) {
				return;
			}
			// If Gallery is made up of individual Image blocks check for custom link before
			// loading carousel.
			if ( $( e.target ).parents().eq( 1 ).hasClass( 'wp-block-image' ) ) {
				var parentHref = $( e.target ).parent().attr( 'href' );

				// If the link does not point to the attachment or media file then assume Image has
				// a custom link so don't load the carousel.
				if (
					parentHref.split( '?' )[ 0 ] !==
						$( e.target ).attr( 'data-orig-file' ).split( '?' )[ 0 ] &&
					parentHref !== $( e.target ).attr( 'data-permalink' )
				) {
					return;
				}
			}

			// Do not open the modal if we are looking at a gallery caption from before WP5, which may contain a link.
			if ( $( e.target ).parent().hasClass( 'gallery-caption' ) ) {
				return;
			}

			// Do not open the modal if we are looking at a caption of a gallery block, which may contain a link.
			if ( $( e.target ).parent().is( 'figcaption' ) ) {
				return;
			}

			// Set height to auto
			// Fix some themes where closing carousel brings view back to top
			$( 'html' ).css( 'height', 'auto' );

			e.preventDefault();

			// Stopping propagation in case there are parent elements
			// with .gallery or .tiled-gallery class
			e.stopPropagation();
			openCarousel( $( this ), {
				startIndex: $( this )
					.find(
						'.gallery-item, .tiled-gallery-item, .blocks-gallery-item, .tiled-gallery__item, .wp-block-image'
					)
					.index(
						$( e.target ).parents(
							'.gallery-item, .tiled-gallery-item, .blocks-gallery-item, .tiled-gallery__item, .wp-block-image'
						)
					),
			} );
		}
	);

	// handle lightbox (single image gallery) for images linking to 'Attachment Page'
	if ( Number( jetpackCarouselStrings.single_image_gallery ) === 1 ) {
		processSingleImageGallery();
		$( document.body ).on( 'post-load', function () {
			processSingleImageGallery();
		} );
	}

	// Makes carousel work on page load and when back button leads to same URL with carousel hash (ie: no actual document.ready trigger)
	$( window ).on( 'hashchange.jp-carousel', function () {
		var hashRegExp = /jp-carousel-(\d+)/,
			matches,
			attachmentId,
			galleries,
			selectedThumbnail;

		if ( ! window.location.hash || ! hashRegExp.test( window.location.hash ) ) {
			if ( gallery && gallery.opened ) {
				container.jp_carousel( 'close' );
			}

			return;
		}

		if ( window.location.hash === lastKnownLocationHash && gallery.opened ) {
			return;
		}

		if ( window.location.hash && gallery && ! gallery.opened && history.back ) {
			history.back();
			return;
		}

		lastKnownLocationHash = window.location.hash;
		matches = window.location.hash.match( hashRegExp );
		attachmentId = parseInt( matches[ 1 ], 10 );
		galleries = $(
			'div.gallery, div.tiled-gallery, a.single-image-gallery, ul.wp-block-gallery, div.wp-block-jetpack-tiled-gallery'
		);

		// Find the first thumbnail that matches the attachment ID in the location
		// hash, then open the gallery that contains it.
		galleries.each( function ( _, galleryEl ) {
			$( galleryEl )
				.find( 'img' )
				.each( function ( imageIndex, imageEl ) {
					if ( $( imageEl ).data( 'attachment-id' ) === parseInt( attachmentId, 10 ) ) {
						selectedThumbnail = { index: imageIndex, gallery: galleryEl };
						return false;
					}
				} );

			if ( selectedThumbnail ) {
				openOrSelectSlide( $( selectedThumbnail.gallery ), selectedThumbnail.index );
				return false;
			}
		} );
	} );

	if ( window.location.hash ) {
		$( window ).trigger( 'hashchange' );
	}
} );
