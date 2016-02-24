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
			data.action           = 'jetpack_tracks';
			data.tracksEventType  = 'click';
			data.tracksEventName  = $( this ).attr( 'data-jptracks-name' );
			data.tracksEventProp  = $( this ).attr( 'data-jptracks-prop' ) || false;

			// We need an event name at least
			if ( undefined === data.tracksEventName ) {
				return;
			}

			e.preventDefault();

			var url    = e.srcElement.href;
			var target = e.srcElement.target;
			if ( url && target && '_self' !== target ) {
				var newTabWindow = window.open( '', target );
			}

			$.post( jpTracksAJAX.ajaxurl, data, function ( response ) {
				if ( response.success ) {

					// Continue on to whatever url they were trying to get to.
					if ( url ) {
						if ( newTabWindow ) {
							newTabWindow.location = url;
							return;
						}
						window.location = url;
					}
				}
			} );
		});
	}

})( jQuery, jpTracksAJAX );
