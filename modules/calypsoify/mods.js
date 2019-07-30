/* global pagenow, ajaxurl, CalypsoifyOpts */
( function( $ ) {
	$( window ).load( function() {
		// On Plugins.php
		if ( 'plugins' === pagenow ) {
			// pagenow === $current_screen->id
			// Remove | and () from the plugins filter bar
			$.each( $( 'ul.subsubsub li' ), function( i, el ) {
				var li = $( el );
				li.html(
					li
						.html()
						.replace( '|', '' )
						.replace( '(', '' )
						.replace( ')', '' )
				);
			} );

			// Add in the AJAX-y goodness for toggling autoupdates.
			$( 'input.autoupdate-toggle' ).change( function( event ) {
				var el = event.target;

				el.disabled = true;
				el.classList.add( 'is-toggling' );

				jQuery.post(
					ajaxurl,
					{
						action: 'jetpack_toggle_autoupdate',
						type: 'plugins',
						slug: el.dataset.slug,
						active: el.checked,
						_wpnonce: CalypsoifyOpts.nonces.autoupdate_plugins,
					},
					function() {
						// Add something to test and confirm that `el.dataset.slug` is missing from `response.data` ?
						el.disabled = false;
						el.classList.remove( 'is-toggling' );
					}
				);
			} );
		}

		$( '#wp-admin-bar-root-default' ).on( 'click', 'li', function( event ) {
			location.href = $( event.target )
				.closest( 'a' )
				.attr( 'href' );
		} );

		$( '#wp-admin-bar-top-secondary' ).on( 'click', 'li#wp-admin-bar-my-account', function(
			event
		) {
			location.href = $( event.target )
				.closest( 'a' )
				.attr( 'href' );
		} );

		if ( document && document.location && document.location.search ) {
			var params_array = document.location.search.substr( 1 ).split( '&' ),
				params_object = {},
				body = $( document.body ),
				i,
				key_value,
				pluginEl;

			if ( params_array && params_array.length ) {
				for ( i = 0; i < params_array.length; i++ ) {
					key_value = params_array[ i ].split( '=' );
					params_object[ key_value[ 0 ] ] = key_value[ 1 ];
				}

				if ( params_object.s && params_object[ 'modal-mode' ] && params_object.plugin ) {
					pluginEl = $(
						'.plugin-card-' + params_object.plugin + ' .thickbox.open-plugin-details-modal'
					);
					if ( pluginEl && pluginEl.length ) {
						pluginEl.click();
					}
				}
			}

			body.on( 'thickbox:iframe:loaded', function() {
				$( '#TB_window' ).on( 'click', 'button#TB_closeWindowButton', function() {
					$( '#TB_closeWindowButton' ).click();
				} );
			} );
		}
	} );

	/**
	 * Prepend icons to notices.
	 */
	$( document ).ready( function() {
		$( 'div.notice, div.error, div.updated, div.warning' ).each( function() {
			if ( $( this ).children( '.wc-calypso-bridge-notice-content' ).length ) {
				return;
			}

			var icon = CalypsoifyOpts.icons.info;
			if ( $( this ).hasClass( 'notice-success' ) ) {
				icon = CalypsoifyOpts.icons.checkmark;
			} else if ( $( this ).hasClass( 'error' ) || $( this ).hasClass( 'notice-warning' ) ) {
				icon = CalypsoifyOpts.icons.notice;
			}
			$( this ).prepend(
				'<span class="wc-calypso-bridge-notice-icon-wrapper">' + icon + '</span>'
			);
		} );
	} );

	/**
	 * Replace dismissal buttons in notices.
	 */
	$( document ).ready( function() {
		$( '.notice-dismiss' ).html( CalypsoifyOpts.icons.cross );
	} );

	/**
	 * Place notice content inside it's own tag.
	 *
	 * Used to prevent side by side content in flexbox when multiple paragraphs exist.
	 */
	$( document ).ready( function() {
		$( 'div.notice, div.error, div.updated, div.warning' ).each( function() {
			if ( $( this ).children( '.wc-calypso-bridge-notice-content' ).length ) {
				return;
			}

			var $noticeContent = $( '<div class="wc-calypso-bridge-notice-content"></div>' );
			$( this )
				.find( '.wc-calypso-bridge-notice-icon-wrapper' )
				.after( $noticeContent );
			$( this )
				.find( 'p:not(.submit)' )
				.appendTo( $noticeContent );
		} );
	} );

	/**
	 * Move notices on pages with sub navigation
	 *
	 * WP Core moves notices with jQuery so this is needed to move them again since
	 * we can't control their position.
	 */
	$( document ).ready( function() {
		var $subNavigation = $( '.wrap .subsubsub' );
		if ( $subNavigation.length ) {
			$( 'div.notice, div.error, div.updated, div.warning' ).insertAfter( $subNavigation.first() );
			$( '.jetpack-jitm-message, .jitm-card' ).insertAfter( $subNavigation.first() );
		}
	} );

	/**
	 * Append notice.
	 */
	function appendNotice( content, type ) {
		var html = '';
		var icon = CalypsoifyOpts.icons.info;
		var classes = [ 'notice' ];
		if ( 'success' === type ) {
			icon = CalypsoifyOpts.icons.checkmark;
			classes.push( 'notice-success' );
		} else if ( 'error' === type ) {
			icon = CalypsoifyOpts.icons.notice;
			classes.push( 'error' );
		}
		html += '<div class="' + classes.join( ' ' ) + '">';
		html += '<span class="wc-calypso-bridge-notice-icon-wrapper">';
		html += icon;
		html += '</span>';
		html += '<div class="wc-calypso-bridge-notice-content"><p>' + content + '</p></div>';
		html += '</div>';
		$( html ).insertAfter( 'h1.wp-heading-inline:first' );
	}
} )( jQuery );
