/*globals JSON, jetpackTracks */
(function( $, jetpackTracks ) {
	window._tkq = window._tkq || [];

	var notesTracksEvents = {
		openSite: function( data ) {
			return {
				source: 'masterbar_notifications_panel',
				site_id: data.siteId
			};
		},
		openPost: function( data ) {
			return {
				source: 'masterbar_notifications_panel',
				site_id: data.siteId,
				post_id: data.postId
			};
		},
		openComment: function( data ) {
			return {
				source: 'masterbar_notifications_panel',
				site_id: data.siteId,
				post_id: data.postId,
				comment_id: data.commentId
			};
		}
	};

	var nonce = jetpackTracks.tracks_nonce;
	var eventName = jetpackTracks.event_name;

	function parseJson( s, defaultValue ) {
		try {
			return JSON.parse( s );
		} catch ( e ) {
			return defaultValue;
		}
	}

	$( document ).ready( function() {
		$( '.mb-trackable a' ).on( 'click touchstart', function( e ) {
			var $target = $( e.target ),
					$parent = $target.closest( 'li' );

			if( ! $parent ) {
				return;
			}

			if( $parent.hasClass( 'menupop' ) ) {
				//top level items that open a panel
				window._tkq.push( [ 'recordEvent', 'jetpack_' + eventName, {
					source: 'masterbar',
					item: $parent.attr( 'ID' ),
					target: $target.attr( 'href' )
				} ] );
			} else {
				e.preventDefault();
				window.location = 'jetpack-track-and-bounce.php?' + $.param( {
					jetpack_tracks_and_bounce_id: $target.attr( 'ID' ) || $parent.attr( 'ID' ),
					jetpack_tracks_and_bounce_event: eventName,
					jetpack_tracks_and_bounce_nonce: nonce
				} );
			}
		} );
	} );

	// listen for postMessage events from the notifications iframe
	$( window ).on( 'message', function( e ) {
		var event = ! e.data && e.originalEvent.data ? e.originalEvent : event;
		if ( event.origin !== 'https://widgets.wp.com' ) {
			return;
		}

		var data = ( 'string' === typeof event.data ) ? parseJson( event.data, {} ) : event.data;
		if ( 'notesIframeMessage' !== data.type ) {
			return;
		}

		var eventData = notesTracksEvents[ data.action ];
		if ( ! eventData ) {
			return;
		}

		window._tkq.push( [ 'recordEvent', 'jetpack_' + eventName, eventData( data ) ] );
	} );

	window.jetpackTracks = null;

})( jQuery, jetpackTracks );
