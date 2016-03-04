/* global jpTracksAJAX, jQuery */

(function( $, jpTracksAJAX ) {

	$( document ).ready( function () {
		$( 'body' ).on( 'click', '.jptracks a, a.jptracks', function( event ) {

			// We know that the jptracks element is either this, or its ancestor
			var $jptracks = $( this ).closest( '.jptracks' );

			var data = {
				tracksNonce: jpTracksAJAX.jpTracksAJAX_nonce,
				action: 'jetpack_tracks',
				tracksEventType: 'click',
				tracksEventName: $jptracks.attr( 'data-jptracks-name' ),
				tracksEventProp: $jptracks.attr( 'data-jptracks-prop' ) || false
			};

			// We need an event name at least
			if ( undefined === data.tracksEventName ) {
				return;
			}

			var url    = $( this ).attr( 'href' );
			var target = $( this ).get( 0 ).target;
			if ( url && target && '_self' !== target ) {
				var newTabWindow = window.open( '', target );
			}

			event.preventDefault();

			$.ajax( {
				type: 'POST',
				url: jpTracksAJAX.ajaxurl,
				data: data
			} ).always( function() {
				// Continue on to whatever url they were trying to get to.
				if ( url ) {
					if ( newTabWindow ) {
						newTabWindow.location = url;
						return;
					}
					window.location = url;
				}
			} );
		});
	});

})( jQuery, jpTracksAJAX );
