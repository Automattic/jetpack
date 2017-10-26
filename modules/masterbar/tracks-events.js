/*globals JSON */
( function( $ ) {
	var eventName = 'masterbar_click';

	var linksTracksEvents = {
		//top level items
		'wp-admin-bar-blog'                        : 'my_sites_link',
		'wp-admin-bar-newdash'                     : 'reader_link',
		'wp-admin-bar-ab-new-post'                 : 'write_button',
		'wp-admin-bar-my-account'                  : 'my_account_link',
		'wp-admin-bar-notes'                       : 'notifications_link',
		//my sites - top items
		'wp-admin-bar-switch-site'                 : 'my_sites_switch_site_link',
		'wp-admin-bar-blog-info'                   : 'my_sites_blog_info_link',
		'wp-admin-bar-site-view'                   : 'my_sites_view_site_link',
		'wp-admin-bar-blog-stats'                  : 'my_sites_blog_stats_link',
		'wp-admin-bar-plan'                        : 'my_sites_plan_link',
		'wp-admin-bar-plan-badge'                  : 'my_sites_plan_badge_link',
		//my sites - manage
		'wp-admin-bar-edit-page'                   : 'my_sites_manage_site_pages_link',
		'wp-admin-bar-new-page-badge'              : 'my_sites_manage_add_page_link',
		'wp-admin-bar-edit-post'                   : 'my_sites_manage_blog_posts_link',
		'wp-admin-bar-new-post-badge'              : 'my_sites_manage_add_new_post_link',
		'wp-admin-bar-edit-attachment'             : 'my_sites_manage_media_link',
		'wp-admin-bar-new-attachment-badge'        : 'my_sites_manage_add_media_link',
		'wp-admin-bar-comments'                    : 'my_sites_manage_comments_link',
		//my sites - personalize
		'wp-admin-bar-themes'                      : 'my_sites_personalize_themes_link',
		'wp-admin-bar-cmz'                         : 'my_sites_personalize_themes_customize_link',
		//my sites - configure
		'wp-admin-bar-sharing'                     : 'my_sites_configure_sharing_link',
		'wp-admin-bar-people'                      : 'my_sites_configure_people_link',
		'wp-admin-bar-people-add'                  : 'my_sites_configure_people_add_button',
		'wp-admin-bar-plugins'                     : 'my_sites_configure_plugins_link',
		'wp-admin-bar-domains'                     : 'my_sites_configure_domains_link',
		'wp-admin-bar-domains-add'                 : 'my_sites_configure_add_domain_link',
		'wp-admin-bar-blog-settings'               : 'my_sites_configure_settings_link',
		'wp-admin-bar-legacy-dashboard'            : 'my_sites_configure_wp_admin_link',
		//reader
		'wp-admin-bar-followed-sites'              : 'reader_followed_sites_link',
		'wp-admin-bar-reader-followed-sites-manage': 'reader_manage_followed_sites_link',
		'wp-admin-bar-discover-discover'           : 'reader_discover_link',
		'wp-admin-bar-discover-search'             : 'reader_search_link',
		'wp-admin-bar-my-activity-my-likes'        : 'reader_my_likes_link',
		//account
		'wp-admin-bar-user-info'                   : 'my_account_user_name_link',
		// account - profile
		'wp-admin-bar-my-profile'                  : 'my_account_profile_my_profile_link',
		'wp-admin-bar-account-settings'            : 'my_account_profile_account_settings_link',
		'wp-admin-bar-billing'                     : 'my_account_profile_manage_purchases_link',
		'wp-admin-bar-security'                    : 'my_account_profile_security_link',
		'wp-admin-bar-notifications'               : 'my_account_profile_notifications_link',
		//account - special
		'wp-admin-bar-get-apps'                    : 'my_account_special_get_apps_link',
		'wp-admin-bar-next-steps'                  : 'my_account_special_next_steps_link',
		'wp-admin-bar-help'                        : 'my_account_special_help_link'
	};

	var notesTracksEvents = {
		openSite: function( data ) {
			return {
				clicked: 'masterbar_notifications_panel_site_link',
				site_id: data.siteId
			};
		},
		openPost: function( data ) {
			return {
				clicked: 'masterbar_notifications_panel_post_link',
				site_id: data.siteId,
				post_id: data.postId
			};
		},
		openComment: function( data ) {
			return {
				clicked: 'masterbar_notifications_panel_comment_link',
				site_id: data.siteId,
				post_id: data.postId,
				comment_id: data.commentId
			};
		}
	};

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

			if ( ! linksTracksEvents.hasOwnProperty( trackingId ) ) {
				return;
			}
			var eventProps = { 'clicked': linksTracksEvents[ trackingId ] };

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

} )( jQuery );
