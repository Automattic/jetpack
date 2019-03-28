/*globals jQuery, JSON */
( function( $ ) {
	const eventName = 'masterbar_click';

	const linksTracksEvents = {
		//top level items
		'wp-admin-bar-blog': 'my_sites',
		'wp-admin-bar-newdash': 'reader',
		'wp-admin-bar-ab-new-post': 'write_button',
		'wp-admin-bar-my-account': 'my_account',
		'wp-admin-bar-notes': 'notifications',
		//account
		'wp-admin-bar-user-info': 'my_account_user_name',
		// account - profile
		'wp-admin-bar-my-profile': 'my_account_profile_my_profile',
		'wp-admin-bar-account-settings': 'my_account_profile_account_settings',
		'wp-admin-bar-billing': 'my_account_profile_manage_purchases',
		'wp-admin-bar-security': 'my_account_profile_security',
		'wp-admin-bar-notifications': 'my_account_profile_notifications',
		//account - special
		'wp-admin-bar-get-apps': 'my_account_special_get_apps',
		'wp-admin-bar-next-steps': 'my_account_special_next_steps',
		'wp-admin-bar-help': 'my_account_special_help',
	};

	const notesTracksEvents = {
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
		const trackableLinks =
			'.mb-trackable .ab-item:not(div),' +
			'#wp-admin-bar-notes .ab-item,' +
			'#wp-admin-bar-user-info .ab-item,' +
			'.mb-trackable .ab-secondary';

		$( trackableLinks ).on( 'click touchstart', function( e ) {
			if ( ! window.jpTracksAJAX || 'function' !== typeof window.jpTracksAJAX.record_ajax_event ) {
				return;
			}

			let $target = $( e.target );
			const $parent = $target.closest( 'li' );

			if ( ! $target.is( 'a' ) ) {
				$target = $target.closest( 'a' );
			}

			if ( ! $parent || ! $target ) {
				return;
			}

			const trackingId = $target.attr( 'ID' ) || $parent.attr( 'ID' );

			if ( ! linksTracksEvents.hasOwnProperty( trackingId ) ) {
				return;
			}
			const eventProps = { clicked: linksTracksEvents[ trackingId ] };

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

		const event = ! e.data && e.originalEvent.data ? e.originalEvent : e;
		if ( event.origin !== 'https://widgets.wp.com' ) {
			return;
		}

		const data = 'string' === typeof event.data ? parseJson( event.data, {} ) : event.data;
		if ( 'notesIframeMessage' !== data.type ) {
			return;
		}

		const eventData = notesTracksEvents[ data.action ];
		if ( ! eventData ) {
			return;
		}

		window.jpTracksAJAX.record_ajax_event( eventName, 'click', eventData( data ) );
	} );
} )( jQuery );
