/* global wpcom, jetpackCarouselStrings, DocumentTouch */

( function () {
	'use strict';

	/////////////////////////////////////
	// Utility functions
	/////////////////////////////////////
	var util = ( function () {
		var noop = function () {};

		function unique( array ) {
			var newArray = [];
			array.forEach( function ( item ) {
				if ( item !== undefined && newArray.indexOf( item ) === -1 ) {
					newArray.push( item );
				}
			} );

			return newArray;
		}

		function texturize( text ) {
			// Ensure we get a string.
			text = text + '';
			text = text
				.replace( /'/g, '&#8217;' )
				.replace( /&#039;/g, '&#8217;' )
				.replace( /[\u2019]/g, '&#8217;' );
			text = text
				.replace( /"/g, '&#8221;' )
				.replace( /&#034;/g, '&#8221;' )
				.replace( /&quot;/g, '&#8221;' )
				.replace( /[\u201D]/g, '&#8221;' );
			// Untexturize allowed HTML tags params double-quotes.
			text = text.replace( /([\w]+)=&#[\d]+;(.+?)&#[\d]+;/g, '$1="$2"' );
			return text.trim();
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

		return {
			noop: noop,
			unique: unique,
			texturize: texturize,
			applyReplacements: applyReplacements,
		};
	} )();

	/////////////////////////////////////
	// DOM-related utility functions
	/////////////////////////////////////
	var domUtil = ( function () {
		// Helper matches function (not a polyfill), compatible with IE 11.
		function matches( el, sel ) {
			if ( Element.prototype.matches ) {
				return el.matches( sel );
			}

			if ( Element.prototype.msMatchesSelector ) {
				return el.msMatchesSelector( sel );
			}
		}

		// Helper closest parent node function (not a polyfill) based on
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
		function closest( el, sel ) {
			if ( el.closest ) {
				return el.closest( sel );
			}

			var current = el;

			do {
				if ( matches( current, sel ) ) {
					return current;
				}
				current = current.parentElement || current.parentNode;
			} while ( current !== null && current.nodeType === 1 );

			return null;
		}

		function hide( el ) {
			if ( el ) {
				el.style.display = 'none';
			}
		}

		function show( el ) {
			if ( el ) {
				// Everything we show and hide in Carousel is currently a block,
				// so we can make this really straightforward.
				el.style.display = 'block';
			}
		}

		function fade( el, start, end, callback ) {
			if ( ! el ) {
				return callback();
			}

			// Prepare for transition.
			// Ensure the item is in the render tree, in its initial state.
			el.style.removeProperty( 'display' );
			el.style.opacity = start;
			el.style.transition = 'opacity 0.2s';
			el.style.pointerEvents = 'none';

			var finished = function ( e ) {
				if ( e.target === el && e.propertyName === 'opacity' ) {
					el.style.removeProperty( 'transition' );
					el.style.removeProperty( 'opacity' );
					el.style.removeProperty( 'pointer-events' );
					el.removeEventListener( 'transitionend', finished );
					el.removeEventListener( 'transitioncancel', finished );
					callback();
				}
			};

			requestAnimationFrame( function () {
				// Double rAF for browser compatibility.
				requestAnimationFrame( function () {
					el.addEventListener( 'transitionend', finished );
					el.addEventListener( 'transitioncancel', finished );
					// Trigger transition.
					el.style.opacity = end;
				} );
			} );
		}

		function fadeIn( el, callback ) {
			callback = callback || util.noop;
			fade( el, '0', '1', callback );
		}

		function fadeOut( el, callback ) {
			callback = callback || util.noop;
			fade( el, '1', '0', function () {
				el.style.display = 'none';
				callback();
			} );
		}

		function emitEvent( el, type, detail ) {
			var e;
			try {
				e = new CustomEvent( type, {
					bubbles: true,
					cancelable: true,
					detail: detail || null,
				} );
			} catch ( err ) {
				e = document.createEvent( 'CustomEvent' );
				e.initCustomEvent( type, true, true, detail || null );
			}
			el.dispatchEvent( e );
		}

		function scrollToY( el, top ) {
			if ( ! el ) {
				return;
			}

			if (
				typeof el.scrollTo === 'function' &&
				'scrollBehavior' in document.documentElement.style
			) {
				el.scrollTo( { top: top, behavior: 'smooth' } );
			} else {
				el.scrollTop = top;
			}
		}

		function scrollToElement( el ) {
			if ( ! el || typeof el.scrollIntoView !== 'function' ) {
				return;
			}

			if ( 'scrollBehavior' in document.documentElement.style ) {
				el.scrollIntoView( { behavior: 'smooth' } );
			} else {
				el.scrollIntoView();
			}
		}

		function getJSONAttribute( el, attr ) {
			if ( ! el || ! el.hasAttribute( attr ) ) {
				return undefined;
			}

			try {
				return JSON.parse( el.getAttribute( attr ) );
			} catch ( e ) {
				return undefined;
			}
		}

		function convertToPlainText( html ) {
			var dummy = document.createElement( 'div' );
			dummy.textContent = html;
			return dummy.innerHTML;
		}

		return {
			closest: closest,
			matches: matches,
			hide: hide,
			show: show,
			fadeIn: fadeIn,
			fadeOut: fadeOut,
			scrollToY: scrollToY,
			scrollToElement: scrollToElement,
			getJSONAttribute: getJSONAttribute,
			convertToPlainText: convertToPlainText,
			emitEvent: emitEvent,
		};
	} )();

	/////////////////////////////////////
	// Touch-related utility functions
	/////////////////////////////////////
	var touchUtil = ( function () {
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

		return { addWipeHandler: addWipeHandler };
	} )();

	/////////////////////////////////////
	// Carousel implementation
	/////////////////////////////////////
	function init() {
		var resizeTimeout;
		var commentInterval;
		var screenPadding;
		var originalOverflow;
		var originalHOverflow;
		var scrollPos;

		var lastKnownLocationHash = '';
		var isUserTyping = false;

		var gallerySelector =
			'div.gallery, div.tiled-gallery, ul.wp-block-gallery, ul.blocks-gallery-grid, ' +
			'figure.blocks-gallery-grid, div.wp-block-jetpack-tiled-gallery, a.single-image-gallery';

		var itemSelector =
			'.gallery-item, .tiled-gallery-item, .blocks-gallery-item, ' +
			' .tiled-gallery__item, .wp-block-image';

		var carousel = {};

		var stat =
			typeof wpcom !== 'undefined' && wpcom.carousel && wpcom.carousel.stat
				? wpcom.carousel.stat
				: util.noop;

		var pageview =
			typeof wpcom !== 'undefined' && wpcom.carousel && wpcom.carousel.pageview
				? wpcom.carousel.pageview
				: util.noop;

		function handleKeyboardEvent( e ) {
			if ( ! isUserTyping ) {
				switch ( e.which ) {
					case 38: // up
						e.preventDefault();
						carousel.container.scrollTop -= 100;
						break;
					case 40: // down
						e.preventDefault();
						carousel.container.scrollTop += 100;
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

		function resizeListener() {
			clearTimeout( resizeTimeout );
			resizeTimeout = setTimeout( function () {
				calculatePadding();
				fitSlides( carousel.slides );
				updateSlidePositions();
				fitMeta();
			}, 200 );
		}

		function fitMeta() {
			carousel.info.style.left = screenPadding + 'px';
			carousel.info.style.right = screenPadding + 'px';
		}

		function initializeCarousel() {
			if ( ! carousel.overlay ) {
				carousel.container = document.querySelector( '.jp-carousel-wrap' );
				carousel.overlay = carousel.container.querySelector( '.jp-carousel-overlay' );
				carousel.gallery = carousel.container.querySelector( '.jp-carousel' );
				carousel.info = carousel.container.querySelector( '.jp-carousel-info' );
				carousel.caption = carousel.container.querySelector( '.jp-carousel-caption' );
				carousel.nextButton = carousel.container.querySelector( '.jp-carousel-next-button' );
				carousel.prevButton = carousel.container.querySelector( '.jp-carousel-previous-button' );
				carousel.commentField = carousel.container.querySelector(
					'#jp-carousel-comment-form-comment-field'
				);
				carousel.emailField = carousel.container.querySelector(
					'#jp-carousel-comment-form-email-field'
				);
				carousel.authorField = carousel.container.querySelector(
					'#jp-carousel-comment-form-author-field'
				);
				carousel.urlField = carousel.container.querySelector(
					'#jp-carousel-comment-form-url-field'
				);

				calculatePadding();
				fitMeta();

				[
					carousel.commentField,
					carousel.emailField,
					carousel.authorField,
					carousel.urlField,
				].forEach( function ( field ) {
					if ( field ) {
						field.addEventListener( 'focus', disableKeyboardNavigation );
						field.addEventListener( 'blur', enableKeyboardNavigation );
					}
				} );

				carousel.container.addEventListener( 'click', function ( e ) {
					var target = e.target;
					var isTargetCloseHint = !! domUtil.closest( target, '.jp-carousel-close-hint' );
					var isSmallScreen = !! window.matchMedia( '(max-device-width: 760px)' ).matches;

					if ( target === carousel.gallery ) {
						if ( isSmallScreen ) {
							handleCarouselGalleryTouch( e );
						} else {
							closeCarousel();
						}
					} else if ( isTargetCloseHint ) {
						closeCarousel();
					} else if ( target.classList.contains( 'jp-carousel-image-download' ) ) {
						stat( 'download_original_click' );
					} else if ( target.classList.contains( 'jp-carousel-commentlink' ) ) {
						handleCommentLinkClick( e );
					} else if ( target.classList.contains( 'jp-carousel-comment-login' ) ) {
						handleCommentLoginClick( e );
					} else if ( domUtil.closest( target, '#jp-carousel-comment-form-container' ) ) {
						handleCommentFormClick( e );
					} else if ( ! domUtil.closest( target, '.jp-carousel-info' ) ) {
						if ( isSmallScreen ) {
							handleCarouselGalleryTouch( e );
						} else {
							moveToNextSlide();
						}
					}
				} );

				window.addEventListener( 'keydown', handleKeyboardEvent );

				carousel.container.addEventListener( 'jp_carousel.beforeOpen', function () {
					window.addEventListener( 'resize', resizeListener );
					resizeListener();
				} );

				carousel.container.addEventListener( 'jp_carousel.afterOpen', function () {
					enableKeyboardNavigation();
				} );

				carousel.container.addEventListener( 'jp_carousel.beforeClose', function () {
					disableKeyboardNavigation();
					window.removeEventListener( 'resize', resizeListener );
					domUtil.hide( carousel.prevButton );
					domUtil.hide( carousel.nextButton );

					// Fixes some themes where closing carousel brings view back to top.
					document.documentElement.style.removeProperty( 'height' );
				} );

				carousel.container.addEventListener( 'jp_carousel.afterClose', function () {
					if ( window.location.hash && history.back ) {
						history.back();
					}
					lastKnownLocationHash = '';
					carousel.isOpen = false;
				} );

				touchUtil.addWipeHandler( {
					root: carousel.container,
					wipeLeft: function ( e ) {
						e.preventDefault();
						moveToNextSlide();
					},
					wipeRight: function ( e ) {
						e.preventDefault();
						moveToPreviousSlide();
					},
				} );

				carousel.nextButton.addEventListener( 'click', function ( e ) {
					e.preventDefault();
					e.stopPropagation();
					moveToNextSlide();
				} );

				carousel.prevButton.addEventListener( 'click', function ( e ) {
					e.preventDefault();
					e.stopPropagation();
					moveToPreviousSlide();
				} );
			}
		}

		function handleCarouselGalleryTouch( e ) {
			if ( typeof e.pageX === 'undefined' ) {
				return;
			}

			if ( e.pageX <= 70 ) {
				moveToPreviousSlide();
			}

			if ( window.innerWidth - e.pageX <= 70 ) {
				moveToNextSlide();
			}
		}

		function handleCommentLinkClick( e ) {
			e.preventDefault();
			e.stopPropagation();
			disableKeyboardNavigation();
			domUtil.scrollToElement( carousel.info );
			domUtil.show(
				carousel.container.querySelector( '#jp-carousel-comment-form-submit-and-info-wrapper' )
			);
			var field = carousel.commentField;
			field.focus();
		}

		function handleCommentLoginClick() {
			var slide = carousel.currentSlide;
			var attachmentId = slide ? slide.attrs.attachmentId : '0';

			window.location.href = jetpackCarouselStrings.login_url + '%23jp-carousel-' + attachmentId;
		}

		function updatePostResults( msg, isSuccess ) {
			var results = carousel.container.querySelector( '#jp-carousel-comment-post-results' );
			var elClass = 'jp-carousel-comment-post-' + ( isSuccess ? 'success' : 'error' );
			results.innerHTML = '<span class="' + elClass + '">' + msg + '</span>';
			domUtil.hide( carousel.container.querySelector( '#jp-carousel-comment-form-spinner' ) );
			domUtil.show( results );
		}

		function handleCommentFormClick( e ) {
			var target = e.target;
			var data = domUtil.getJSONAttribute( carousel.container, 'data-carousel-extra' ) || {};
			var attachmentId = carousel.currentSlide.attrs.attachmentId;

			var wrapper = document.querySelector( '#jp-carousel-comment-form-submit-and-info-wrapper' );
			var spinner = document.querySelector( '#jp-carousel-comment-form-spinner' );
			var submit = document.querySelector( '#jp-carousel-comment-form-button-submit' );

			if (
				carousel.commentField &&
				carousel.commentField.getAttribute( 'id' ) === target.getAttribute( 'id' )
			) {
				// For first page load
				disableKeyboardNavigation();
				domUtil.show( wrapper );
			} else if ( domUtil.matches( target, 'input[type="submit"]' ) ) {
				e.preventDefault();
				e.stopPropagation();

				domUtil.show( spinner );

				var ajaxData = {
					action: 'post_attachment_comment',
					nonce: jetpackCarouselStrings.nonce,
					blog_id: data.blog_id,
					id: attachmentId,
					comment: carousel.commentField.value,
				};

				if ( ! ajaxData.comment.length ) {
					updatePostResults( jetpackCarouselStrings.no_comment_text, false );
					return;
				}

				if ( Number( jetpackCarouselStrings.is_logged_in ) !== 1 ) {
					ajaxData.email = carousel.emailField.value;
					ajaxData.author = carousel.authorField.value;
					ajaxData.url = carousel.urlField.value;

					if ( Number( jetpackCarouselStrings.require_name_email ) === 1 ) {
						if ( ! ajaxData.email.length || ! ajaxData.email.match( '@' ) ) {
							updatePostResults( jetpackCarouselStrings.no_comment_email, false );
							return;
						} else if ( ! ajaxData.author.length ) {
							updatePostResults( jetpackCarouselStrings.no_comment_author, false );
							return;
						}
					}
				}

				var xhr = new XMLHttpRequest();
				xhr.open( 'POST', jetpackCarouselStrings.ajaxurl, true );
				xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
				xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' );

				xhr.onreadystatechange = function () {
					if (
						this.readyState === XMLHttpRequest.DONE &&
						this.status >= 200 &&
						this.status < 300
					) {
						var response;
						try {
							response = JSON.parse( this.response );
						} catch ( error ) {
							updatePostResults( jetpackCarouselStrings.comment_post_error, false );
							return;
						}
						if ( response.comment_status === 'approved' ) {
							updatePostResults( jetpackCarouselStrings.comment_approved, true );
						} else if ( response.comment_status === 'unapproved' ) {
							updatePostResults( jetpackCarouselStrings.comment_unapproved, true );
						} else {
							// 'deleted', 'spam', false
							updatePostResults( jetpackCarouselStrings.comment_post_error, false );
						}
						clearCommentTextAreaValue();
						fetchComments( attachmentId );
						submit.value = jetpackCarouselStrings.post_comment;
						domUtil.hide( spinner );
					} else {
						// TODO: Add error handling and display here
						updatePostResults( jetpackCarouselStrings.comment_post_error, false );
					}
				};

				var params = [];
				for ( var item in ajaxData ) {
					if ( item ) {
						// Encode each form element into a URI-compatible string.
						var encoded = encodeURIComponent( item ) + '=' + encodeURIComponent( ajaxData[ item ] );
						// In x-www-form-urlencoded, spaces should be `+`, not `%20`.
						params.push( encoded.replace( /%20/g, '+' ) );
					}
				}
				var encodedData = params.join( '&' );

				xhr.send( encodedData );
			}
		}

		function processSingleImageGallery() {
			var images = document.querySelectorAll( 'a img[data-attachment-id]' );
			Array.prototype.forEach.call( images, function ( image ) {
				var container = image.parentElement;

				// Skip if image was already added to gallery by shortcode.
				if ( container.parentElement.classList.contains( 'gallery-icon' ) ) {
					return;
				}

				// Skip if the container is not a link.
				if ( ! container.hasAttribute( 'href' ) ) {
					return;
				}

				var valid = false;

				// If link points to 'Media File' (ignoring GET parameters) and flag is set, allow it.
				if (
					container.getAttribute( 'href' ).split( '?' )[ 0 ] ===
						image.getAttribute( 'data-orig-file' ).split( '?' )[ 0 ] &&
					Number( jetpackCarouselStrings.single_image_gallery_media_file ) === 1
				) {
					valid = true;
				}

				// If link points to 'Attachment Page', allow it.
				if ( container.getAttribute( 'href' ) === image.getAttribute( 'data-permalink' ) ) {
					valid = true;
				}

				// Links to 'Custom URL' or 'Media File' when flag is not set are not valid.
				if ( ! valid ) {
					return;
				}

				// Make this node a gallery recognizable by event listener above.
				container.classList.add( 'single-image-gallery' );
				// blog_id is needed to allow posting comments to correct blog.
				container.setAttribute(
					'data-carousel-extra',
					JSON.stringify( {
						blog_id: Number( jetpackCarouselStrings.blog_id ),
					} )
				);
			} );
		}

		function testForData( el ) {
			return !! ( el && el.getAttribute( 'data-carousel-extra' ) );
		}

		function openOrSelectSlide( gal, index ) {
			if ( ! carousel.isOpen ) {
				// The `open` method selects the correct slide during the initialization.
				openCarousel( gal, { startIndex: index } );
			} else {
				selectSlideAtIndex( index );
			}
		}

		function selectSlideAtIndex( index ) {
			if ( ! index || index < 0 || index > carousel.slides.length ) {
				index = 0;
			}

			if ( carousel.currentSlide ) {
				carousel.lastSlide = carousel.currentSlide;
				carousel.currentSlide.el.classList.remove( 'selected' );
			}

			carousel.currentSlide = carousel.slides[ index ];

			var current = carousel.currentSlide;
			var attachmentId = current.attrs.attachmentId;
			var prev = getPrevSlide( carousel.currentSlide );
			var next = getNextSlide( carousel.currentSlide );
			var previousPrevious = getPrevSlide( prev );
			var nextNext = getNextSlide( next );
			var captionHtml;

			carousel.slides.forEach( function ( slide ) {
				slide.el.style.position = 'fixed';
			} );
			current.el.classList.add( 'selected' );
			current.el.style.position = 'relative';

			// Center the main image.
			loadFullImage( carousel.slides[ index ] );

			domUtil.hide( carousel.caption );

			if ( ! next || ( next.index < current.index && carousel.slides.length <= 2 ) ) {
				domUtil.hide( carousel.nextButton );
			} else {
				domUtil.show( carousel.nextButton );
			}

			if ( ! prev || ( prev.index > current.index && carousel.slides.length <= 2 ) ) {
				domUtil.hide( carousel.prevButton );
			} else {
				domUtil.show( carousel.prevButton );
			}

			var inUse = util.unique( [ current, prev, previousPrevious, next, nextNext ] );
			loadSlides( inUse );

			carousel.slides.forEach( function ( slide ) {
				if ( inUse.indexOf( slide ) === -1 ) {
					domUtil.hide( slide.el );
				}
			} );

			updateSlidePositions();
			domUtil.emitEvent( carousel.container, 'jp_carousel.selectSlide', current.el );

			updateTitleAndDesc( { title: current.attrs.title, desc: current.attrs.desc } );

			var imageMeta = carousel.slides[ index ].attrs.imageMeta;
			updateExif( imageMeta );
			updateFullSizeLink( current );

			if ( Number( jetpackCarouselStrings.display_comments ) === 1 ) {
				testCommentsOpened( carousel.slides[ index ].attrs.commentsOpened );
				fetchComments( attachmentId );
				domUtil.hide( carousel.container.querySelector( '#jp-carousel-comment-post-results' ) );
			}

			if ( current.attrs.caption ) {
				captionHtml = domUtil.convertToPlainText( current.attrs.caption );

				if ( domUtil.convertToPlainText( current.attrs.title ) === captionHtml ) {
					var title = carousel.container.querySelector( '.jp-carousel-titleanddesc-title' );
					domUtil.fadeOut( title, function () {
						title.innerHTML = '';
					} );
				}

				if ( domUtil.convertToPlainText( current.attrs.desc ) === captionHtml ) {
					var desc = carousel.container.querySelector( '.jp-carousel-titleanddesc-desc' );
					domUtil.fadeOut( desc, function () {
						desc.innerHTML = '';
					} );
				}

				carousel.caption.innerHTML = current.attrs.caption;
				domUtil.fadeIn( carousel.caption );
			} else {
				domUtil.fadeOut( carousel.caption, function () {
					carousel.caption.innerHTML = '';
				} );
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

			// Load previous and next slides, while trying to ensure that the current one is first.
			setTimeout( function () {
				if ( next ) {
					loadFullImage( next );
				}
				if ( prev ) {
					loadFullImage( next );
				}
			} );

			window.location.hash = lastKnownLocationHash = '#jp-carousel-' + attachmentId;
		}

		function moveToNextSlide() {
			moveToPreviousOrNextSlide( getNextSlide );
		}

		function moveToPreviousSlide() {
			moveToPreviousOrNextSlide( getPrevSlide );
		}

		function moveToPreviousOrNextSlide( slideSelectionMethod ) {
			if ( carousel.slides.length <= 1 ) {
				return false;
			}

			var newIndex = slideSelectionMethod( carousel.currentSlide ).index;

			if ( newIndex >= 0 ) {
				domUtil.scrollToY( carousel.container, 0 );
				clearCommentTextAreaValue();
				selectSlideAtIndex( newIndex );
				stat( [ 'previous', 'view_image' ] );
			}
		}

		function getNextSlide( slide ) {
			var isLast = slide && slide.index === carousel.slides.length - 1;

			if ( slide === undefined || ( carousel.slides.length > 2 && isLast ) ) {
				return carousel.slides[ 0 ];
			}

			return carousel.slides[ slide.index + 1 ];
		}

		function getPrevSlide( slide ) {
			var isFirst = slide && slide.index === 0;

			if ( slide === undefined || ( carousel.slides.length > 2 && isFirst ) ) {
				return carousel.slides[ carousel.slides.length - 1 ];
			}

			return carousel.slides[ slide.index - 1 ];
		}

		function restoreScroll() {
			window.scrollTo( window.scrollX || window.pageXOffset || 0, scrollPos || 0 );
		}

		function closeCarousel() {
			// Make sure to let the page scroll again.
			document.body.style.overflow = originalOverflow;
			document.documentElement.style.overflow = originalHOverflow;
			clearCommentTextAreaValue();

			disableKeyboardNavigation();

			domUtil.emitEvent( carousel.container, 'jp_carousel.beforeClose' );

			restoreScroll();

			domUtil.fadeOut( carousel.container, function () {
				// Clear slide data for DOM garbage collection.
				carousel.slides = [];
				carousel.currentSlide = undefined;
				carousel.gallery.innerHTML = '';

				restoreScroll();

				domUtil.emitEvent( carousel.container, 'jp_carousel.afterClose' );
			} );
		}

		function setSlidePosition( slideEl, x ) {
			if ( ! slideEl ) {
				return;
			}
			slideEl.style.transform = 'translate3d(' + x + 'px,0,0)';
		}

		function getSlideWidth( slide ) {
			return parseInt( getComputedStyle( slide.el ).width, 10 );
		}

		function updateSlidePositions() {
			var current = carousel.currentSlide;
			var last = carousel.lastSlide;

			var galleryWidth = carousel.gallery.offsetWidth;
			var currentWidth = getSlideWidth( current );

			var previous = getPrevSlide( current );
			var next = getNextSlide( current );
			var previousPrevious = getPrevSlide( previous );
			var nextNext = getNextSlide( next );

			var left = Math.floor( ( galleryWidth - currentWidth ) * 0.5 );

			setSlidePosition( current.el, left );
			domUtil.show( current.el );

			// minimum width
			fitInfo();

			// prep the slides
			var direction = current && last && last.index < current.index ? 1 : -1;

			if ( carousel.slides.length > 1 ) {
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
					if ( nextNext !== previous ) {
						setSlidePosition( nextNext.el, galleryWidth + getSlideWidth( next ) );
						domUtil.show( nextNext.el );
					}

					if ( previousPrevious !== next ) {
						setSlidePosition(
							previousPrevious.el,
							-getSlideWidth( previousPrevious ) - currentWidth
						);
						domUtil.show( previousPrevious.el );
					}
				} else {
					if ( nextNext !== previous ) {
						setSlidePosition( nextNext.el, galleryWidth + currentWidth );
						domUtil.show( nextNext.el );
					}
				}

				setSlidePosition(
					previous.el,
					Math.floor( -getSlideWidth( previous ) + screenPadding * 0.75 )
				);
				domUtil.show( previous.el );

				setSlidePosition( next.el, Math.ceil( galleryWidth - screenPadding * 0.75 ) );
				domUtil.show( next.el );
			}
		}

		function calculateMaxSlideDimensions() {
			var screenHeightPercent = 80;

			return {
				width: window.innerWidth - screenPadding * 2,
				height: Math.floor( ( window.innerHeight / 100 ) * screenHeightPercent - 60 ),
			};
		}

		function calculateBestFit( slide ) {
			var max = calculateMaxSlideDimensions();
			var origRatio = slide.attrs.origWidth / slide.attrs.origHeight,
				wRatio = 1,
				hRatio = 1,
				width,
				height;

			if ( slide.attrs.origWidth > max.width ) {
				wRatio = max.width / slide.attrs.origWidth;
			}
			if ( slide.attrs.origHeight > max.height ) {
				hRatio = max.height / slide.attrs.origHeight;
			}

			if ( wRatio < hRatio ) {
				width = max.width;
				height = Math.floor( width / origRatio );
			} else if ( hRatio < wRatio ) {
				height = max.height;
				width = Math.floor( height * origRatio );
			} else {
				width = slide.attrs.origWidth;
				height = slide.attrs.origHeight;
			}

			return {
				width: width,
				height: height,
			};
		}

		function loadSlides( slides ) {
			for ( var i = 0; i < slides.length; i++ ) {
				var slide = slides[ i ];
				var img = slide.el.querySelector( 'img' );

				var loadHandler = function () {
					// set the width/height of the image if it's too big
					fitSlides( [ slide ] );
				};
				img.addEventListener( 'load', loadHandler );
			}
		}

		function fitInfo() {
			var size = calculateBestFit( carousel.currentSlide );

			var photoInfos = carousel.container.querySelectorAll( '.jp-carousel-photo-info' );
			Array.prototype.forEach.call( photoInfos, function ( photoInfo ) {
				photoInfo.style.left =
					Math.floor( ( carousel.info.offsetWidth - size.width ) * 0.5 ) + 'px';
				photoInfo.style.width = Math.floor( size.width ) + 'px';
			} );
		}

		function fitSlides( slides ) {
			if ( ! slides ) {
				return;
			}

			slides.forEach( function ( slide ) {
				var dimensions = calculateBestFit( slide );
				var max = calculateMaxSlideDimensions();

				dimensions.left = 0;
				dimensions.top = Math.floor( ( max.height - dimensions.height ) * 0.5 ) + 40;

				for ( var dimension in dimensions ) {
					slide.el.style.setProperty( dimension, dimensions[ dimension ] + 'px' );
				}
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

			var largeWidth = parseInt( largeSizeParts[ 0 ], 10 );
			var largeHeight = parseInt( largeSizeParts[ 1 ], 10 );
			var mediumWidth = parseInt( mediumSizeParts[ 0 ], 10 );
			var mediumHeight = parseInt( mediumSizeParts[ 1 ], 10 );

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
				size !== file
					? isPhotonUrl
						? size.split( '%2C' )
						: size.split( 'x' )
					: [ origWidth, 0 ];

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

		function parseTitleOrDesc( value ) {
			if ( ! value.match( ' ' ) && value.match( '_' ) ) {
				return '';
			}

			return value;
		}

		function updateTitleAndDesc( data ) {
			var title = '';
			var desc = '';
			var markup = '';
			var target;

			target = carousel.container.querySelector( '.jp-carousel-titleanddesc' );
			domUtil.hide( target );

			title = parseTitleOrDesc( data.title ) || '';
			desc = parseTitleOrDesc( data.desc ) || '';

			if ( title || desc ) {
				// Convert from HTML to plain text (including HTML entities decode, etc)
				if ( domUtil.convertToPlainText( title ) === domUtil.convertToPlainText( desc ) ) {
					title = '';
				}

				markup = title ? '<div class="jp-carousel-titleanddesc-title">' + title + '</div>' : '';
				markup += desc ? '<div class="jp-carousel-titleanddesc-desc">' + desc + '</div>' : '';

				target.innerHTML = markup;
				domUtil.fadeIn( target );
			}
		}

		// updateExif updates the contents of the exif UL (.jp-carousel-image-exif)
		function updateExif( meta ) {
			if ( ! meta || Number( jetpackCarouselStrings.display_exif ) !== 1 ) {
				return false;
			}

			var ul = carousel.info.querySelector( '.jp-carousel-image-meta ul.jp-carousel-image-exif' );
			var html = '';

			for ( var key in meta ) {
				var val = meta[ key ];
				var metaKeys = jetpackCarouselStrings.meta_data || [];

				if ( parseFloat( val ) === 0 || ! val.length || metaKeys.indexOf( key ) === -1 ) {
					continue;
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

				html += '<li><h5>' + jetpackCarouselStrings[ key ] + '</h5>' + val + '</li>';
			}

			ul.innerHTML = html;
			ul.style.removeProperty( 'display' );
		}

		// Update the contents of the jp-carousel-image-download link
		function updateFullSizeLink( currentSlide ) {
			if ( ! currentSlide ) {
				return false;
			}
			var original;
			var origSize = [ currentSlide.attrs.origWidth, currentSlide.attrs.origHeight ];
			var imageLinkParser = document.createElement( 'a' );

			imageLinkParser.href = currentSlide.attrs.src.replace( /\?.+$/, '' );

			// Is this a Photon URL?
			if ( imageLinkParser.hostname.match( /^i[\d]{1}\.wp\.com$/i ) !== null ) {
				original = imageLinkParser.href;
			} else {
				original = currentSlide.attrs.origFile.replace( /\?.+$/, '' );
			}

			var permalink = carousel.info.querySelector( '.jp-carousel-image-download' );
			permalink.innerHTML = util.applyReplacements(
				jetpackCarouselStrings.download_original,
				origSize
			);
			permalink.setAttribute( 'href', original );
			permalink.style.removeProperty( 'display' );
		}

		function testCommentsOpened( opened ) {
			var commentForm = carousel.container.querySelector( '.jp-carousel-comment-form-container' );
			var commentLink = carousel.container.querySelector( '.jp-carousel-commentlink' );
			var buttons = carousel.container.querySelector( '.jp-carousel-buttons' );
			var control = Number( jetpackCarouselStrings.is_logged_in ) === 1 ? commentLink : buttons;
			var isOpened = parseInt( opened, 10 ) === 1;

			if ( isOpened ) {
				domUtil.fadeIn( control );
				domUtil.fadeIn( commentForm );
			} else {
				domUtil.fadeOut( control );
				domUtil.fadeOut( commentForm );
			}
		}

		function fetchComments( attachmentId, offset ) {
			var shouldClear = offset === undefined;

			clearInterval( commentInterval );

			if ( ! attachmentId ) {
				return;
			}

			if ( ! offset || offset < 1 ) {
				offset = 0;
			}

			var comments = carousel.container.querySelector( '.jp-carousel-comments' );
			var commentsLoading = carousel.container.querySelector( '#jp-carousel-comments-loading' );
			domUtil.show( commentsLoading );

			if ( shouldClear ) {
				domUtil.hide( comments );
				comments.innerHTML = '';
			}

			var xhr = new XMLHttpRequest();
			var url =
				jetpackCarouselStrings.ajaxurl +
				'?action=get_attachment_comments' +
				'&nonce=' +
				jetpackCarouselStrings.nonce +
				'&id=' +
				attachmentId +
				'&offset=' +
				offset;
			xhr.open( 'GET', url );
			xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

			var onError = function () {
				domUtil.fadeIn( comments );
				domUtil.fadeOut( commentsLoading );
			};

			xhr.onload = function () {
				// Ignore the results if they arrive late and we're now on a different slide.
				if (
					! carousel.currentSlide ||
					carousel.currentSlide.attrs.attachmentId !== attachmentId
				) {
					return;
				}

				var isSuccess = xhr.status >= 200 && xhr.status < 300;
				var data;
				try {
					data = JSON.parse( xhr.responseText );
				} catch ( e ) {
					// Do nothing.
				}

				if ( ! isSuccess || ! data || ! Array.isArray( data ) ) {
					return onError();
				}

				if ( shouldClear ) {
					comments.innerHTML = '';
				}

				for ( var i = 0; i < data.length; i++ ) {
					var entry = data[ i ];
					var comment = document.createElement( 'div' );
					comment.classList.add( 'jp-carousel-comment' );
					comment.setAttribute( 'id', 'jp-carousel-comment-' + entry.id );
					comment.innerHTML =
						'<div class="comment-gravatar">' +
						entry.gravatar_markup +
						'</div>' +
						'<div class="comment-author">' +
						entry.author_markup +
						'</div>' +
						'<div class="comment-date">' +
						entry.date_gmt +
						'</div>' +
						'<div class="comment-content">' +
						entry.content +
						'</div>';
					comments.appendChild( comment );

					// Set the interval to check for a new page of comments.
					clearInterval( commentInterval );
					commentInterval = setInterval( function () {
						if ( carousel.container.scrollTop + 150 > window.innerHeight ) {
							fetchComments( attachmentId, offset + 10 );
							clearInterval( commentInterval );
						}
					}, 300 );
				}

				domUtil.show( comments );
				domUtil.hide( commentsLoading );
			};

			xhr.onerror = onError;

			xhr.send();
		}

		function clearCommentTextAreaValue() {
			if ( carousel.commentField ) {
				carousel.commentField.value = '';
			}
		}

		function loadFullImage( slide ) {
			var el = slide.el;
			var attrs = slide.attrs;
			var image = el.querySelector( 'img' );

			if ( ! image.hasAttribute( 'data-loaded' ) ) {
				// If the width of the slide is smaller than the width of the "thumbnail" we're already using,
				// don't load the full image.

				var loadListener = function () {
					image.removeEventListener( 'load', loadListener );
					el.style.backgroundImage = '';
				};
				image.addEventListener( 'load', loadListener );

				var hasPreview = !! attrs.previewImage;
				var thumbSize = attrs.thumbSize;

				if ( ! hasPreview || ( thumbSize && el.offsetWidth > thumbSize.width ) ) {
					image.src = attrs.src;
				} else {
					image.src = attrs.previewImage;
				}

				image.setAttribute( 'itemprop', 'image' );
				image.setAttribute( 'data-loaded', 1 );
			}
		}

		function getOriginalDimensions( el ) {
			var size = el.getAttribute( 'data-orig-size' ) || '';

			if ( size ) {
				var parts = size.split( ',' );
				return { width: parseInt( parts[ 0 ], 10 ), height: parseInt( parts[ 1 ], 10 ) };
			} else {
				return {
					width:
						el.getAttribute( 'data-original-width' ) || el.getAttribute( 'width' ) || undefined,
					height:
						el.getAttribute( 'data-original-height' ) || el.getAttribute( 'height' ) || undefined,
				};
			}
		}

		function initCarouselSlides( items, startIndex ) {
			carousel.slides = [];

			if ( items.length < 2 ) {
				domUtil.hide( carousel.nextButton );
				domUtil.hide( carousel.prevButton );
			} else {
				domUtil.show( carousel.nextButton );
				domUtil.show( carousel.prevButton );
			}

			var max = calculateMaxSlideDimensions();

			// If the startIndex is not 0 then preload the clicked image first.
			if ( startIndex !== 0 ) {
				var img = new Image();
				img.src = items[ startIndex ].getAttribute( 'data-gallery-src' );
			}

			var useInPageThumbnails = !! domUtil.closest( items[ 0 ], '.tiled-gallery.type-rectangular' );

			// create the 'slide'
			Array.prototype.forEach.call( items, function ( item, i ) {
				var galleryItem = domUtil.closest( item, '.gallery-item' );
				var captionEl = galleryItem && galleryItem.querySelector( '.gallery-caption' );
				var permalinkEl = domUtil.closest( item, 'a' );

				var attrs = {
					attachmentId: item.getAttribute( 'data-attachment-id' ) || '0',
					commentsOpened: item.getAttribute( 'data-comments-opened' ) || '0',
					imageMeta: domUtil.getJSONAttribute( item, 'data-image-meta' ) || {},
					title: item.getAttribute( 'data-image-title' ) || '',
					desc: item.getAttribute( 'data-image-description' ) || '',
					mediumFile: item.getAttribute( 'data-medium-file' ) || '',
					largeFile: item.getAttribute( 'data-large-file' ) || '',
					origFile: item.getAttribute( 'data-orig-file' ) || '',
					thumbSize: { width: item.naturalWidth, height: item.naturalHeight },
					caption: ( captionEl && captionEl.innerHTML ) || '',
					permalink: permalinkEl && permalinkEl.getAttribute( 'href' ),
				};

				var tiledGalleryItem = domUtil.closest( item, '.tiled-gallery-item' );
				var tiledCaptionEl =
					tiledGalleryItem && tiledGalleryItem.querySelector( '.tiled-gallery-caption' );
				var tiledCaption = tiledCaptionEl && tiledCaptionEl.innerHTML;
				if ( tiledCaption ) {
					attrs.caption = tiledCaption;
				}

				var origDimensions = getOriginalDimensions( item );

				attrs.origWidth = origDimensions.width;
				attrs.origHeight = origDimensions.height;

				if ( typeof wpcom !== 'undefined' && wpcom.carousel && wpcom.carousel.generateImgSrc ) {
					attrs.src = wpcom.carousel.generateImgSrc( item, max );
				} else {
					attrs.src = item.getAttribute( 'data-orig-file' );

					attrs.src = selectBestImageUrl( {
						origFile: attrs.src,
						origWidth: attrs.origWidth,
						origHeight: attrs.origHeight,
						maxWidth: max.width,
						maxHeight: max.height,
						mediumFile: attrs.mediumFile,
						largeFile: attrs.largeFile,
					} );
				}

				// Set the final src.
				item.setAttribute( 'data-gallery-src', attrs.src );

				if ( attrs.attachmentId !== '0' ) {
					attrs.title = util.texturize( attrs.title );
					attrs.desc = util.texturize( attrs.desc );
					attrs.caption = util.texturize( attrs.caption );

					// Initially, the image is a 1x1 transparent gif.
					// The preview is shown as a background image on the slide itself.
					var image = new Image();
					image.src =
						'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
					image.style.width = '100%';
					image.style.height = '100%';

					var slideEl = document.createElement( 'div' );
					slideEl.classList.add( 'jp-carousel-slide' );
					slideEl.setAttribute( 'itemprop', 'associatedMedia' );
					slideEl.setAttribute( 'itemscope', '' );
					slideEl.setAttribute( 'itemtype', 'https://schema.org/ImageObject' );
					domUtil.hide( slideEl );

					slideEl.style.left = i < startIndex ? -1000 : carousel.gallery.offsetWidth;
					carousel.gallery.appendChild( slideEl );
					slideEl.appendChild( image );

					slideEl.setAttribute( 'data-attachment-id', attrs.attachmentId );
					slideEl.setAttribute( 'data-permalink', attrs.permalink );
					slideEl.setAttribute( 'data-orig-file', attrs.origFile );

					if ( useInPageThumbnails ) {
						// Use the image already loaded in the gallery as a preview.
						attrs.previewImage = attrs.src;
						slideEl.style.backgroundImage = 'url("' + attrs.src + '")';
						slideEl.style.backgroundSize = '100% 100%';
						slideEl.style.backgroundPosition = 'center center';
					}

					var slide = { el: slideEl, attrs: attrs, index: i };
					carousel.slides.push( slide );
					fitSlides( [ slide ] );
				}
			} );
		}

		function openCarousel( gallery, options ) {
			var settings = {
				imgSelector:
					'.gallery-item [data-attachment-id], .tiled-gallery-item [data-attachment-id], img[data-attachment-id]',
				startIndex: 0,
			};

			var data = domUtil.getJSONAttribute( gallery, 'data-carousel-extra' );

			if ( ! data ) {
				return; // don't run if the default gallery functions weren't used
			}

			initializeCarousel();

			if ( carousel.isOpen ) {
				return; // don't open if already opened
			}

			carousel.isOpen = true;

			// make sure to stop the page from scrolling behind the carousel overlay, so we don't trigger
			// infiniscroll for it when enabled (Reader, theme infiniscroll, etc).
			originalOverflow = getComputedStyle( document.body ).overflow;
			document.body.style.overflow = 'hidden';
			// prevent html from overflowing on some of the new themes.
			originalHOverflow = getComputedStyle( document.documentElement ).overflow;
			document.documentElement.style.overflow = 'hidden';
			scrollPos = window.scrollY || window.pageYOffset || 0;

			carousel.container.setAttribute( 'data-carousel-extra', JSON.stringify( data ) );
			stat( [ 'open', 'view_image' ] );

			// If options exist, lets merge them
			// with our default settings
			for ( var option in options || {} ) {
				settings[ option ] = options[ option ];
			}

			if ( settings.startIndex === -1 ) {
				settings.startIndex = 0; // -1 returned if can't find index, so start from beginning
			}

			domUtil.emitEvent( carousel.container, 'jp_carousel.beforeOpen' );

			domUtil.fadeIn( carousel.container, function () {
				domUtil.emitEvent( carousel.container, 'jp_carousel.afterOpen' );
			} );

			carousel.gallery.innerHTML = '';
			initCarouselSlides( gallery.querySelectorAll( settings.imgSelector ), settings.startIndex );
			selectSlideAtIndex( settings.startIndex );
		}

		// Register the event listener for starting the gallery
		document.body.addEventListener( 'click', function ( e ) {
			var target = e.target;
			var gallery = domUtil.closest( target, gallerySelector );

			if ( gallery ) {
				if ( ! testForData( gallery ) ) {
					return;
				}

				var parent = target.parentElement;
				var grandparent = parent.parentElement;

				// If Gallery is made up of individual Image blocks check for custom link before
				// loading carousel.
				if ( grandparent && grandparent.classList.contains( 'wp-block-image' ) ) {
					var parentHref = parent.getAttribute( 'href' );

					// If the link does not point to the attachment or media file then assume Image has
					// a custom link so don't load the carousel.
					if (
						parentHref.split( '?' )[ 0 ] !==
							target.getAttribute( 'data-orig-file' ).split( '?' )[ 0 ] &&
						parentHref !== target.getAttribute( 'data-permalink' )
					) {
						return;
					}
				}

				// Do not open the modal if we are looking at a gallery caption from before WP5, which may contain a link.
				if ( parent.classList.contains( 'gallery-caption' ) ) {
					return;
				}

				// Do not open the modal if we are looking at a caption of a gallery block, which may contain a link.
				if ( domUtil.matches( parent, 'figcaption' ) ) {
					return;
				}

				// Set height to auto.
				// Fix some themes where closing carousel brings view back to top.
				document.documentElement.style.height = 'auto';

				e.preventDefault();

				// Stopping propagation in case there are parent elements
				// with .gallery or .tiled-gallery class
				e.stopPropagation();

				var item = domUtil.closest( target, itemSelector );
				var index = Array.prototype.indexOf.call( gallery.querySelectorAll( itemSelector ), item );

				openCarousel( gallery, { startIndex: index } );
			}
		} );

		// Handle lightbox (single image gallery) for images linking to 'Attachment Page'.
		if ( Number( jetpackCarouselStrings.single_image_gallery ) === 1 ) {
			processSingleImageGallery();
			document.body.addEventListener( 'is.post-load', function () {
				processSingleImageGallery();
			} );
		}

		// Makes carousel work on page load and when back button leads to same URL with carousel hash
		// (i.e. no actual document.ready trigger).
		window.addEventListener( 'hashchange', function () {
			var hashRegExp = /jp-carousel-(\d+)/;

			if ( ! window.location.hash || ! hashRegExp.test( window.location.hash ) ) {
				if ( carousel.isOpen ) {
					closeCarousel();
				}

				return;
			}

			if ( window.location.hash === lastKnownLocationHash && carousel.isOpen ) {
				return;
			}

			if ( window.location.hash && carousel.gallery && ! carousel.isOpen && history.back ) {
				history.back();
				return;
			}

			lastKnownLocationHash = window.location.hash;
			var matchList = window.location.hash.match( hashRegExp );
			var attachmentId = parseInt( matchList[ 1 ], 10 );
			var galleries = document.querySelectorAll( gallerySelector );

			// Find the first thumbnail that matches the attachment ID in the location
			// hash, then open the gallery that contains it.
			for ( var i = 0; i < galleries.length; i++ ) {
				var gallery = galleries[ i ];
				var selected;

				var images = gallery.querySelectorAll( 'img' );
				for ( var j = 0; j < images.length; j++ ) {
					if ( parseInt( images[ j ].getAttribute( 'data-attachment-id' ), 10 ) === attachmentId ) {
						selected = j;
						break;
					}
				}

				if ( selected !== undefined ) {
					openOrSelectSlide( gallery, selected );
					break;
				}
			}
		} );

		if ( window.location.hash ) {
			domUtil.emitEvent( window, 'hashchange' );
		}
	}

	if ( document.readyState !== 'loading' ) {
		init();
	} else {
		document.addEventListener( 'DOMContentLoaded', init );
	}
} )();
