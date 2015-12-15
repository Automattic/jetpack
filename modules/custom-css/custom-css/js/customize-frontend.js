/* global ajaxurl:true */
( function( $ ) {
	var removedCss = false,
		api = wp.customize,
		preprocess;

	if ( typeof ajaxurl === 'undefined' ) {
		ajaxurl = '/wp-admin/admin-ajax.php';
	}

	preprocess = _.debounce( function( css, preprocessor, callback ){
		$.post( ajaxurl, {
			action : 'jetpack_custom_css_preprocess',
			css : css,
			preprocessor : preprocessor
		}, callback, 'text' );
	}, 500 );

	function replace_css( css ) {
		// do some setup the first time
		if ( ! removedCss ) {
			$( '#custom-css-css' ).remove();
			$( '#jetpack-custom-css' ).remove();
			$( '<style/>', {
				type: 'text/css',
				id: 'jetpack-custom-css'
			} ).appendTo( 'head' );
			removedCss = true;
		}

		$( '#jetpack-custom-css' ).text( css );
	}

	/**
	 * Handles CSS in both css + preprocessor callbacks
	 */
	function handle_css() {
		if ( api( 'jetpack_custom_css[preprocessor]' )() ) {
			preprocess( api( 'jetpack_custom_css[css]' )(), api( 'jetpack_custom_css[preprocessor]' )(), replace_css );
		} else {
			replace_css( api( 'jetpack_custom_css[css]' )() );
		}
	}

	api( 'jetpack_custom_css[css]', function ( setting ) {
		setting.bind( handle_css );
	} );

	api( 'jetpack_custom_css[preprocessor]', function ( setting ) {
		setting.bind( handle_css );
	} );

	api( 'jetpack_custom_css[replace]', function ( setting ) {
		setting.bind( function ( newval ) {
			// Remove (or re-instate) the theme's CSS.
			$( 'link[rel~="original-stylesheet"]' ).each( function () {
				$( this ).attr( 'rel', newval ? 'original-stylesheet' : 'stylesheet original-stylesheet' );
			} );
		} );
	} );
} )( jQuery );