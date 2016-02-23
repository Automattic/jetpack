/* global jpTracksAJAX, jQuery */

(function( $, jpTracksAJAX ) {

	var data;

	$( document ).ready( function () {

		data = {
			'tracksNonce' : jpTracksAJAX.jpTracksAJAX_nonce
		};

		jetpackTracksAJAX();
	});

	function jetpackTracksAJAX() {
		$( '.jptracks' ).click( function( e ) {
			e.preventDefault();

			data.action          = 'jetpack_tracks';
			data.tracksEventName = $( this ).attr( 'data-jptracks-name' );

			$.post( jpTracksAJAX.ajaxurl, data, function ( response ) {
				if ( 0 !== response ) {
					alert( response );
				}
			} );
		});
	}

})( jQuery, jpTracksAJAX );
