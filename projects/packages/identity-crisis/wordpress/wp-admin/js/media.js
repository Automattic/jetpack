/**
 * Creates a dialog containing posts that can have a particular media attached
 * to it.
 *
 * @since 2.7.0
 * @output wp-admin/js/media.js
 *
 * @namespace findPosts
 *
 * @requires jQuery
 */

/* global ajaxurl, _wpMediaGridSettings, showNotice, findPosts, ClipboardJS */

( function( $ ){
	window.findPosts = {
		/**
		 * Opens a dialog to attach media to a post.
		 *
		 * Adds an overlay prior to retrieving a list of posts to attach the media to.
		 *
		 * @since 2.7.0
		 *
		 * @memberOf findPosts
		 *
		 * @param {string} af_name The name of the affected element.
		 * @param {string} af_val The value of the affected post element.
		 *
		 * @return {boolean} Always returns false.
		 */
		open: function( af_name, af_val ) {
			var overlay = $( '.ui-find-overlay' );

			if ( overlay.length === 0 ) {
				$( 'body' ).append( '<div class="ui-find-overlay"></div>' );
				findPosts.overlay();
			}

			overlay.show();

			if ( af_name && af_val ) {
				// #affected is a hidden input field in the dialog that keeps track of which media should be attached.
				$( '#affected' ).attr( 'name', af_name ).val( af_val );
			}

			$( '#find-posts' ).show();

			// Close the dialog when the escape key is pressed.
			$('#find-posts-input').trigger( 'focus' ).on( 'keyup', function( event ){
				if ( event.which == 27 ) {
					findPosts.close();
				}
			});

			// Retrieves a list of applicable posts for media attachment and shows them.
			findPosts.send();

			return false;
		},

		/**
		 * Clears the found posts lists before hiding the attach media dialog.
		 *
		 * @since 2.7.0
		 *
		 * @memberOf findPosts
		 *
		 * @return {void}
		 */
		close: function() {
			$('#find-posts-response').empty();
			$('#find-posts').hide();
			$( '.ui-find-overlay' ).hide();
		},

		/**
		 * Binds a click event listener to the overlay which closes the attach media
		 * dialog.
		 *
		 * @since 3.5.0
		 *
		 * @memberOf findPosts
		 *
		 * @return {void}
		 */
		overlay: function() {
			$( '.ui-find-overlay' ).on( 'click', function () {
				findPosts.close();
			});
		},

		/**
		 * Retrieves and displays posts based on the search term.
		 *
		 * Sends a post request to the admin_ajax.php, requesting posts based on the
		 * search term provided by the user. Defaults to all posts if no search term is
		 * provided.
		 *
		 * @since 2.7.0
		 *
		 * @memberOf findPosts
		 *
		 * @return {void}
		 */
		send: function() {
			var post = {
					ps: $( '#find-posts-input' ).val(),
					action: 'find_posts',
					_ajax_nonce: $('#_ajax_nonce').val()
				},
				spinner = $( '.find-box-search .spinner' );

			spinner.addClass( 'is-active' );

			/**
			 * Send a POST request to admin_ajax.php, hide the spinner and replace the list
			 * of posts with the response data. If an error occurs, display it.
			 */
			$.ajax( ajaxurl, {
				type: 'POST',
				data: post,
				dataType: 'json'
			}).always( function() {
				spinner.removeClass( 'is-active' );
			}).done( function( x ) {
				if ( ! x.success ) {
					$( '#find-posts-response' ).text( wp.i18n.__( 'An error has occurred. Please reload the page and try again.' ) );
				}

				$( '#find-posts-response' ).html( x.data );
			}).fail( function() {
				$( '#find-posts-response' ).text( wp.i18n.__( 'An error has occurred. Please reload the page and try again.' ) );
			});
		}
	};

	/**
	 * Initializes the file once the DOM is fully loaded and attaches events to the
	 * various form elements.
	 *
	 * @return {void}
	 */
	$( function() {
		var settings,
			$mediaGridWrap             = $( '#wp-media-grid' ),
			copyAttachmentURLClipboard = new ClipboardJS( '.copy-attachment-url.media-library' ),
			copyAttachmentURLSuccessTimeout;

		// Opens a manage media frame into the grid.
		if ( $mediaGridWrap.length && window.wp && window.wp.media ) {
			settings = _wpMediaGridSettings;

			var frame = window.wp.media({
				frame: 'manage',
				container: $mediaGridWrap,
				library: settings.queryVars
			}).open();

			// Fire a global ready event.
			$mediaGridWrap.trigger( 'wp-media-grid-ready', frame );
		}

		// Prevents form submission if no post has been selected.
		$( '#find-posts-submit' ).on( 'click', function( event ) {
			if ( ! $( '#find-posts-response input[type="radio"]:checked' ).length )
				event.preventDefault();
		});

		// Submits the search query when hitting the enter key in the search input.
		$( '#find-posts .find-box-search :input' ).on( 'keypress', function( event ) {
			if ( 13 == event.which ) {
				findPosts.send();
				return false;
			}
		});

		// Binds the click event to the search button.
		$( '#find-posts-search' ).on( 'click', findPosts.send );

		// Binds the close dialog click event.
		$( '#find-posts-close' ).on( 'click', findPosts.close );

		// Binds the bulk action events to the submit buttons.
		$( '#doaction' ).on( 'click', function( event ) {

			/*
			 * Handle the bulk action based on its value.
			 */
			$( 'select[name="action"]' ).each( function() {
				var optionValue = $( this ).val();

				if ( 'attach' === optionValue ) {
					event.preventDefault();
					findPosts.open();
				} else if ( 'delete' === optionValue ) {
					if ( ! showNotice.warn() ) {
						event.preventDefault();
					}
				}
			});
		});

		/**
		 * Enables clicking on the entire table row.
		 *
		 * @return {void}
		 */
		$( '.find-box-inside' ).on( 'click', 'tr', function() {
			$( this ).find( '.found-radio input' ).prop( 'checked', true );
		});

		/**
		 * Handles media list copy media URL button.
		 *
		 * @since 6.0.0
		 *
		 * @param {MouseEvent} event A click event.
		 * @return {void}
		 */
		copyAttachmentURLClipboard.on( 'success', function( event ) {
			var triggerElement = $( event.trigger ),
				successElement = $( '.success', triggerElement.closest( '.copy-to-clipboard-container' ) );

			// Clear the selection and move focus back to the trigger.
			event.clearSelection();
			// Handle ClipboardJS focus bug, see https://github.com/zenorocha/clipboard.js/issues/680.
			triggerElement.trigger( 'focus' );

			// Show success visual feedback.
			clearTimeout( copyAttachmentURLSuccessTimeout );
			successElement.removeClass( 'hidden' );

			// Hide success visual feedback after 3 seconds since last success and unfocus the trigger.
			copyAttachmentURLSuccessTimeout = setTimeout( function() {
				successElement.addClass( 'hidden' );
			}, 3000 );

			// Handle success audible feedback.
			wp.a11y.speak( wp.i18n.__( 'The file URL has been copied to your clipboard' ) );
		} );
	});
})( jQuery );
