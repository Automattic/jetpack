(function() {
	window.wpcom_masterbar = window.wpcom_masterbar || {};

	window.wpcom_masterbar.linksTracksEvents = {
		//top level items
		'wp-admin-bar-blog'                       : 'jetpack_masterbar_my_sites_link_click',
		'wp-admin-bar-newdash'                    : 'jetpack_masterbar_reader_link_click',
		'wp-admin-bar-ab-new-post'                : 'jetpack_masterbar_write_button_click',
		'wp-admin-bar-my-account'                 : 'jetpack_masterbar_my_account_link_click',
		'wp-admin-bar-notes'                      : 'jetpack_masterbar_notifications_link_click',
		//my sites - top items
		'wp-admin-bar-switch-site'                : 'jetpack_masterbar_switch_site_link_click',
		'wp-admin-bar-blog-info'                  : 'jetpack_masterbar_blog_info_link_click',
		'wp-admin-bar-site-view'                  : 'jetpack_masterbar_view_site_link_click',
		'wp-admin-bar-blog-stats'                 : 'jetpack_masterbar_blog_stats_link_click',
		'wp-admin-bar-plan'                       : 'jetpack_masterbar_plan_link_click',
		'wp-admin-bar-plan-secondary'             : 'jetpack_masterbar_plan_badge_link_click',
		//my sites - manage
		'wp-admin-bar-new-page'                   : 'jetpack_masterbar_new_page_link_click',
		'wp-admin-bar-new-page-secondary'         : 'jetpack_masterbar_add_page_link_click',
		'wp-admin-bar-new-post'                   : 'jetpack_masterbar_new_post_link_click',
		'wp-admin-bar-new-post-secondary'         : 'jetpack_masterbar_add_new_post_link_click',
		'wp-admin-bar-comments'                   : 'jetpack_masterbar_comments_link_click',
		//my sites - personalize
		'wp-admin-bar-themes'                     : 'jetpack_masterbar_themes_link_click',
		'wp-admin-bar-themes-secondary'           : 'jetpack_masterbar_themes_customize_button_click',
		//my sites - configure
		'wp-admin-bar-sharing'                    : 'jetpack_masterbar_configure_sharing_link_click',
		'wp-admin-bar-users-toolbar'              : 'jetpack_masterbar_configure_people_link_click',
		'wp-admin-bar-users-toolbar-secondary'    : 'jetpack_masterbar_configure_people_add_button_click',
		'wp-admin-bar-plugins'                    : 'jetpack_masterbar_configure_plugins_link_click',
		'wp-admin-bar-plugins-secondary'          : 'jetpack_masterbar_configure_plugins_add_button_click',
		'wp-admin-bar-blog-settings'              : 'jetpack_masterbar_settings_link_click',

		//reader
		'wp-admin-bar-following'                  : 'jetpack_masterbar_followed_sites_link_click',
		'wp-admin-bar-following-secondary'        : 'jetpack_masterbar_followed_sites_manage_button_click',
		'wp-admin-bar-discover-discover'          : 'jetpack_masterbar_reader_discover_link_click',
		'wp-admin-bar-discover-search'            : 'jetpack_masterbar_reader_search_link_click',
		'wp-admin-bar-discover-recommended-blogs' : 'jetpack_masterbar_reader_recommendations_link_click',
		'wp-admin-bar-my-activity-my-likes'       : 'jetpack_masterbar_reader_my_links_link_click',

		//account
		'wp-admin-bar-user-info'                  : 'jetpack_masterbar_user_name_link_click',
		// account - profile
		'wp-admin-bar-my-profile'                 : 'jetpack_masterbar_profile_my_profile_link_click',
		'wp-admin-bar-account-settings'           : 'jetpack_masterbar_profile_account_settings_link_click',
		'wp-admin-bar-billing'                    : 'jetpack_masterbar_profile_manage_purchases_link_click',
		'wp-admin-bar-security'                   : 'jetpack_masterbar_profile_security_link_click',
		'wp-admin-bar-notifications'              : 'jetpack_masterbar_profile_notifications_link_click',
		//account - special
		'wp-admin-bar-get-apps'                   : 'jetpack_masterbar_get_apps_link_click',
		'wp-admin-bar-next-steps'                 : 'jetpack_masterbar_next_steps_link_click',
		'wp-admin-bar-help'                       : 'jetpack_masterbar_help_link_click',
	};

	window.wpcom_masterbar.notesTracksEvents = {
		openSite: {
			name: 'jetpack_masterbar_notifications_open_site',
			properties: function( data ) { return { site_id: data.siteId, post_id: data.postId } }
		},
		openPost: {
			name: 'jetpack_masterbar_notifications_open_post',
			properties: function( data ) { return { site_id: data.siteId, post_id: data.postId } }
		},
		openComment: {
			name: 'jetpack_masterbar_notifications_open_comment',
			properties: function( data ) { return { site_id: data.siteId, post_id: data.postId, comment_id: data.commentId } }
		},
	};

	window.wpcom_masterbar.user_id = jetpackTracks.user_id;
})( jetpackTracks );
