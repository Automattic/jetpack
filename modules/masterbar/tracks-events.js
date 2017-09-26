/*globals JSON, jetpackTracks */
(function( $, jetpackTracks ) {
	window._tkq = window._tkq || [];

	var linksTracksEvents = {
		//top level items
		'wp-admin-bar-blog'        : 'jetpack_masterbar_my_sites_link_click',
		'wp-admin-bar-newdash'     : 'jetpack_masterbar_reader_link_click',
		'wp-admin-bar-ab-new-post' : 'jetpack_masterbar_write_button_click',
		'wp-admin-bar-my-account'  : 'jetpack_masterbar_my_account_link_click',
		'wp-admin-bar-notes'       : 'jetpack_masterbar_notifications_link_click'
	};

	var linksToTrack = [
		//my sites - top items
		'wp-admin-bar-switch-site',
		'wp-admin-bar-blog-info',
		'wp-admin-bar-site-view',
		'wp-admin-bar-blog-stats',
		'wp-admin-bar-plan',
		'wp-admin-bar-plan-secondary',
		//my sites - manage
		'wp-admin-bar-new-page',
		'wp-admin-bar-new-page-secondary',
		'wp-admin-bar-new-post',
		'wp-admin-bar-new-post-secondary',
		'wp-admin-bar-comments',
		//my sites - personalize
		'wp-admin-bar-themes',
		'wp-admin-bar-themes-secondary',
		//my sites - configure
		'wp-admin-bar-sharing',
		'wp-admin-bar-users-toolbar',
		'wp-admin-bar-users-toolbar-secondary',
		'wp-admin-bar-plugins',
		'wp-admin-bar-plugins-secondary',
		'wp-admin-bar-blog-settings',
		//reader
		'wp-admin-bar-following',
		'wp-admin-bar-following-secondary',
		'wp-admin-bar-discover-discover',
		'wp-admin-bar-discover-search',
		'wp-admin-bar-discover-recommended-blogs',
		'wp-admin-bar-my-activity-my-likes',
		//account
		'wp-admin-bar-user-info',
		// account - profile
		'wp-admin-bar-my-profile',
		'wp-admin-bar-account-settings',
		'wp-admin-bar-billing',
		'wp-admin-bar-security',
		'wp-admin-bar-notifications',
		//account - special
		'wp-admin-bar-get-apps',
		'wp-admin-bar-next-steps',
		'wp-admin-bar-help'
	];

	var notesTracksEvents = {
		openSite: {
			name: 'jetpack_masterbar_notifications_open_site',
			properties: function( data ) { return { site_id: data.siteId, post_id: data.postId }; }
		},
		openPost: {
			name: 'jetpack_masterbar_notifications_open_post',
			properties: function( data ) { return { site_id: data.siteId, post_id: data.postId }; }
		},
		openComment: {
			name: 'jetpack_masterbar_notifications_open_comment',
			properties: function( data ) { return { site_id: data.siteId, post_id: data.postId, comment_id: data.commentId }; }
		}
	};

	var nonce = jetpackTracks.tracks_nonce;

	function parseJson( s, defaultValue ) {
		try {
			return JSON.parse( s );
		} catch ( e ) {
			return defaultValue;
		}
	}

	$( document ).ready( function(){
		$( '.ab-item, .ab-secondary' ).on( 'click touchstart', function( e ) {
			var $target = $( e.target ),
					$parent = $target.closest( 'li' );

			if( ! $parent ) {
				return;
			}

			var parentId = $parent.attr( 'ID' );
			var trackId = $target.hasClass( 'ab-secondary' ) ? parentId + '-secondary' : parentId;
			var eventName = linksTracksEvents[ trackId ] || linksToTrack.indexOf( trackId ) || null;
			if ( ! eventName ) {
				return;
			}

			if( $parent.hasClass( 'menupop' ) ) {
				//top level items that open a panel
				window._tkq.push( [ 'recordEvent', eventName ] );
			} else {
				e.preventDefault();
				window.location = 'index.php?' + $.param( {
					tracks_and_bounce: trackId,
					tracks_and_bounce_nonce: nonce
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

		window._tkq.push( [ 'recordEvent', eventData.name, eventData.properties( data ) ] );
	} );

	window.jetpackTracks = null;

})( jQuery, jetpackTracks );
