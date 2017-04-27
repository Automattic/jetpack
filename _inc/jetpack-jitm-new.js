jQuery( document ).ready( function( $ ) {
	var templates = {
		'default': function( $el, msg ) {
			console.log( msg );
			$el.hide();
			$el.html( msg.content );
			$el.delay( 400 ).slideDown();
		}
	};

	var setJITMContent = function( $el, response ) {
		var i, template;
		for ( i = 0; i < response.length; i += 1 ) {
			template = response[ i ].template;

			// if we don't have a template for this version, just use the default template
			if ( ! template || ! templates[ template ] ) {
				template = 'default';
			}

			// todo: inject a div to put the template in and pass it to the template
			templates[ template ]( $el, response[ i ] );
		}
	};

	$( '.jetpack-jitm-message' ).each( function() {
		var $el = $( this );

		var message_path = $el.data( 'message-path' );

		$.get( '/wp-json/jetpack/v4/jitm', { message_path: message_path } ).then( function( response ) {
			setJITMContent( $el, response );
		} );
	} );
} );
