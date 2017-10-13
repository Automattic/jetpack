/*globals JSON */
(function( $ ) {
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

	var eventName = 'masterbar_click';

	function parseJson( s, defaultValue ) {
		try {
			return JSON.parse( s );
		} catch ( e ) {
			return defaultValue;
		}
	}

	$( document ).ready( function() {
		$( '.mb-trackable .ab-item' ).on( 'click touchstart', function( e ) {
			if ( ! window.jpTracksAJAX || 'function' !== typeof( window.jpTracksAJAX.record_ajax_event ) ) {
				return;
			}

			var $target = $( e.target ),
					$parent = $target.closest( 'li' );

			if ( ! $parent ) {
				return;
			}

			var trackingId = $target.attr( 'ID' ) || $parent.attr( 'ID' );

			if ( $parent.hasClass( 'menupop' ) ) {
				window.jpTracksAJAX.record_ajax_event( eventName, 'click', trackingId );
			} else {
				e.preventDefault();
				window.jpTracksAJAX.record_ajax_event( eventName, 'click', trackingId ).always( function() {
					window.location = $target.attr( 'href' );
				} );
			}
		} );
	} );

	// listen for postMessage events from the notifications iframe
	$( window ).on( 'message', function( e ) {
		if ( ! window.jpTracksAJAX || 'function' !== typeof( window.jpTracksAJAX.record_ajax_event ) ) {
			return;
		}

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

		window.jpTracksAJAX.record_ajax_event( eventName, 'click', eventData( data ) );
	} );

})( jQuery );
