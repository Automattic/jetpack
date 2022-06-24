/* global jpTracksAJAX */
( function ( $, jpTracksAJAX ) {
	window.jpTracksAJAX = window.jpTracksAJAX || {};
	const debugSet = localStorage.getItem( 'debug' ) === 'dops:analytics';

	window.jpTracksAJAX.record_ajax_event = function ( eventName, eventType, eventProp ) {
		const data = {
			tracksNonce: jpTracksAJAX.jpTracksAJAX_nonce,
			action: 'jetpack_tracks',
			tracksEventType: eventType,
			tracksEventName: eventName,
			tracksEventProp: eventProp || false,
		};

		return $.ajax( {
			type: 'POST',
			url: jpTracksAJAX.ajaxurl,
			data: data,
			success: function ( response ) {
				if ( debugSet ) {
					// eslint-disable-next-line
					console.log( 'AJAX tracks event recorded: ', data, response );
				}
			},
		} );
	};

	$( document ).ready( function () {
		$( 'body' ).on( 'click', '.jptracks a, a.jptracks', function ( event ) {
			const $this = $( event.target );
			// We know that the jptracks element is either this, or its ancestor
			const $jptracks = $this.closest( '.jptracks' );
			// We need an event name at least
			const eventName = $jptracks.attr( 'data-jptracks-name' );
			if ( undefined === eventName ) {
				return;
			}

			const eventProp = $jptracks.attr( 'data-jptracks-prop' ) || false;

			const url = $this.attr( 'href' );
			const target = $this.get( 0 ).target;
			let newTabWindow = null;
			if ( url && target && '_self' !== target ) {
				newTabWindow = window.open( '', target );
				newTabWindow.opener = null;
			}

			event.preventDefault();

			window.jpTracksAJAX.record_ajax_event( eventName, 'click', eventProp ).always( function () {
				// Continue on to whatever url they were trying to get to.
				if ( url && ! $this.hasClass( 'thickbox' ) ) {
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
