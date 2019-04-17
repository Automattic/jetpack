/*globals jQuery, JSON */
( function( $ ) {
	var eventName = 'masterbar_click';

	var linksTracksEvents = {
		//top level items
		'wp-admin-bar-blog': 'my_sites',
		'wp-admin-bar-newdash': 'reader',
		'wp-admin-bar-ab-new-post': 'write_button',
		'wp-admin-bar-my-account': 'my_account',
		'wp-admin-bar-notes': 'notifications',
	};

	var notesTracksEvents = {
		openSite: function( data ) {
			return {
				clicked: 'masterbar_notifications_panel_site',
				site_id: data.siteId,
			};
		},
		openPost: function( data ) {
			return {
				clicked: 'masterbar_notifications_panel_post',
				site_id: data.siteId,
				post_id: data.postId,
			};
		},
		openComment: function( data ) {
			return {
				clicked: 'masterbar_notifications_panel_comment',
				site_id: data.siteId,
				post_id: data.postId,
				comment_id: data.commentId,
			};
		},
	};

	function parseJson( s, defaultValue ) {
		try {
			return JSON.parse( s );
		} catch ( e ) {
			return defaultValue;
		}
	}

	$( document ).ready( function() {
		var trackableLinks =
			'.mb-trackable .ab-item:not(div),' +
			'#wp-admin-bar-notes .ab-item,' +
			'#wp-admin-bar-user-info .ab-item,' +
			'.mb-trackable .ab-secondary';

		$( trackableLinks ).on( 'click touchstart', function( e ) {
			if ( ! window.jpTracksAJAX || 'function' !== typeof window.jpTracksAJAX.record_ajax_event ) {
				return;
			}

			var $target = $( e.target ),
				$parent = $target.closest( 'li' );

			if ( ! $target.is( 'a' ) ) {
				$target = $target.closest( 'a' );
			}

			if ( ! $parent || ! $target ) {
				return;
			}

			var trackingId = $target.attr( 'ID' ) || $parent.attr( 'ID' );

			if ( ! linksTracksEvents.hasOwnProperty( trackingId ) ) {
				return;
			}
			var eventProps = { clicked: linksTracksEvents[ trackingId ] };

			if ( $parent.hasClass( 'menupop' ) ) {
				window.jpTracksAJAX.record_ajax_event( eventName, 'click', eventProps );
			} else {
				e.preventDefault();
				window.jpTracksAJAX.record_ajax_event( eventName, 'click', eventProps ).always( function() {
					window.location = $target.attr( 'href' );
				} );
			}
		} );
	} );

	// listen for postMessage events from the notifications iframe
	$( window ).on( 'message', function( e ) {
		if ( ! window.jpTracksAJAX || 'function' !== typeof window.jpTracksAJAX.record_ajax_event ) {
			return;
		}

		var event = ! e.data && e.originalEvent.data ? e.originalEvent : e;
		if ( event.origin !== 'https://widgets.wp.com' ) {
			return;
		}

		var data = 'string' === typeof event.data ? parseJson( event.data, {} ) : event.data;
		if ( 'notesIframeMessage' !== data.type ) {
			return;
		}

		var eventData = notesTracksEvents[ data.action ];
		if ( ! eventData ) {
			return;
		}

		window.jpTracksAJAX.record_ajax_event( eventName, 'click', eventData( data ) );
	} );
} )( jQuery );
