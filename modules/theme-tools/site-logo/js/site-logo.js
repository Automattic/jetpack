/**
 * JS for handling the Site Logo real-time display in the Customizer preview frame.
 */
( function( $ ) {
	var api = wp.customize,
		$body,
		$anchor,
		$logo,
		size;

	function cacheSelectors() {
		$body = $( 'body' );
		$anchor = $( '.site-logo-link' );
		$logo = $( '.site-logo' );
		size = $logo.attr( 'data-size' );
	}

	api( 'site_logo', function( value ) {
		value.bind( function( newVal ) {
			// grab selectors the first time through
			if ( ! $body ) {
				cacheSelectors();
			}

			// Let's update our preview logo.
			if ( newVal && newVal.url ) {
				// If the source was smaller than the size required by the theme, give the biggest we've got.
				if ( ! newVal.sizes[ size ] ) {
					size = 'full';
				}

				$logo.attr( {
					height: newVal.sizes[ size ].height,
					width: newVal.sizes[ size ].width,
					src: newVal.sizes[ size ].url,
				} );

				$anchor.show();
				$body.addClass( 'has-site-logo' );
			} else {
				$anchor.hide();
				$body.removeClass( 'has-site-logo' );
			}
		} );
	} );
} )( jQuery );
