jQuery( document ).ready( function ( $ ) {
	console.warn( 'I AM HERE' );

	const setJITMContent = ( $el, response ) => {
		console.log( response );
	};

	$( '.jetpack-jitm-message' ).each( function () {
		const $el = $( this );

		$.get( '/wp-json/jetpack/v4/jitm', {message_path: $el.data( 'message-path' )} ).then( function ( response ) {
			setJITMContent( $el, response );
		} );
	} );
} );
