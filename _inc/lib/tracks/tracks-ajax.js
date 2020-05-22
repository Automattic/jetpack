/* global jpTracksAJAX, jQuery */

(function( $, jpTracksAJAX ) {
	window.jpTracksAJAX = window.jpTracksAJAX || {};

	window.jpTracksAJAX.record_ajax_event = function ( eventName, eventType, eventProp ) {
		var data = {
			tracksNonce: jpTracksAJAX.jpTracksAJAX_nonce,
			action: 'jetpack_tracks',
			tracksEventType: eventType,
			tracksEventName: eventName,
			tracksEventProp: eventProp || false
		};

		return $.ajax( {
			type: 'POST',
			url: jpTracksAJAX.ajaxurl,
			data: data
		} );
	};

	$( document ).ready( function () {
		$( 'body' ).on( 'click', '.jptracks a, a.jptracks', function( event ) {
			// We know that the jptracks element is either this, or its ancestor
			var $jptracks = $( this ).closest( '.jptracks' );

			// We need an event name at least
			var eventName = $jptracks.attr( 'data-jptracks-name' );
			if ( undefined === eventName ) {
				return;
			}

			var eventProp = $jptracks.attr( 'data-jptracks-prop' ) || false;

			var url    = $( this ).attr( 'href' );
			var target = $( this ).get( 0 ).target;
			if ( url && target && '_self' !== target ) {
				var newTabWindow = window.open( '', target );
				newTabWindow.opener = null;
			}

			event.preventDefault();

			window.jpTracksAJAX.record_ajax_event( eventName, 'click', eventProp ).always( function() {
				// Continue on to whatever url they were trying to get to.
				if ( url ) {
					if ( newTabWindow ) {
						newTabWindow.location = url;
						return;
					}
					window.location = url;
				}
			} );
		} );
	} );

} )( jQuery, jpTracksAJAX );
