<?php

use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;

/**
 * Testing CRUD on Options
 */
class WP_Test_Jetpack_Sync_Options extends WP_Test_Jetpack_Sync_Base {
	protected $post;
	protected $options_module;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->options_module = Modules::get_module( 'options' );

		$this->options_module->set_options_whitelist( array( 'test_option' ) );

		add_option( 'test_option', 'foo' );

		$this->sender->do_sync();
	}

	public function test_added_option_is_synced() {
		$synced_option_value = $this->server_replica_storage->get_option( 'test_option' );
		$this->assertEquals( 'foo', $synced_option_value );
	}

	public function test_updated_option_is_synced() {
		update_option( 'test_option', 'bar' );
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_option( 'test_option' );
		$this->assertEquals( 'bar', $synced_option_value );
	}

	public function test_deleted_option_is_synced() {
		delete_option( 'test_option' );
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_option( 'test_option' );
		$this->assertFalse( $synced_option_value );
	}

	public function test_don_t_sync_option_if_not_on_whitelist() {
		add_option( 'don_t_sync_test_option', 'foo' );
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_option( 'don_t_sync_test_option' );
		$this->assertFalse( $synced_option_value );
	}

	public function test_sync_options_that_use_filter() {
		add_filter( 'jetpack_options_whitelist', array( $this, 'add_jetpack_options_whitelist_filter' ) );
		$this->options_module->update_options_whitelist();
		update_option( 'foo_option_bar', '123' );
		$this->sender->do_sync();

		$this->assertSame( '123', $this->server_replica_storage->get_option( 'foo_option_bar' ) );
	}

	public function test_sync_default_options() {
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$options = array(
			'stylesheet'                                   => 'test',
			'blogname'                                     => 'test',
			'blogdescription'                              => 'banana',
			'blog_charset'                                 => 'stuffs',
			'permalink_structure'                          => '%postname%',
			'category_base'                                => 'orange',
			'tag_base'                                     => 'apple',
			'comment_moderation'                           => true,
			'default_comment_status'                       => 'kiwi',
			'thread_comments'                              => 0,
			'thread_comments_depth'                        => 2,
			'social_notifications_like'                    => 'test',
			'page_on_front'                                => false,
			'rss_use_excerpt'                              => false,
			'subscription_options'                         => 'pineapple',
			'stb_enabled'                                  => true,
			'stc_enabled'                                  => false,
			'comment_registration'                         => 'pineapple',
			'show_avatars'                                 => 'pineapple',
			'avatar_default'                               => 'pineapple',
			'avatar_rating'                                => 'pineapple',
			'highlander_comment_form_prompt'               => 'pineapple',
			'jetpack_comment_form_color_scheme'            => 'pineapple',
			'stats_options'                                => 'pineapple',
			'gmt_offset'                                   => 1,
			'timezone_string'                              => 'America/Anchorage',
			'jetpack_sync_non_public_post_stati'           => 'pineapple',
			'jetpack_options'                              => array(
				'food' => 'pineapple',
				'id'   => 1234,
			),
			'site_icon'                                    => '1',
			'default_post_format'                          => 'pineapple',
			'default_category'                             => 0,
			'large_size_w'                                 => 1000,
			'large_size_h'                                 => 2000,
			'thumbnail_size_w'                             => 1000,
			'thumbnail_size_h'                             => 9999,
			'medium_size_w'                                => 200,
			'medium_size_h'                                => 200,
			'thumbnail_crop'                               => 'pineapple',
			'image_default_link_type'                      => 'pineapple',
			'site_logo'                                    => 1,
			'sharing-options'                              => 'pineapple',
			'sharing-services'                             => 'pineapple',
			'post_count'                                   => 'pineapple',
			'default_ping_status'                          => 'pineapple',
			'sticky_posts'                                 => 'pineapple',
			'blog_public'                                  => 0,
			'default_pingback_flag'                        => 'pineapple',
			'require_name_email'                           => 'pineapple',
			'close_comments_for_old_posts'                 => 'pineapple',
			'close_comments_days_old'                      => 99,
			'page_comments'                                => 'pineapple',
			'comments_per_page'                            => 99,
			'default_comments_page'                        => 'pineapple',
			'comment_order'                                => 'pineapple',
			'comments_notify'                              => 'pineapple',
			'moderation_notify'                            => 'pineapple',
			'social_notifications_reblog'                  => 'pineapple',
			'social_notifications_subscribe'               => 'pineapple',
			'comment_previously_approved'                  => 'pineapple',
			'comment_max_links'                            => 99,
			'moderation_keys'                              => 'pineapple',
			'jetpack_wga'                                  => 'pineapple',
			'disabled_likes'                               => 'pineapple',
			'disabled_reblogs'                             => 'pineapple',
			'jetpack_comment_likes_enabled'                => 'pineapple',
			'twitter_via'                                  => 'pineapple',
			'jetpack-twitter-cards-site-tag'               => 'pineapple',
			'wpcom_publish_posts_with_markdown'            => 'pineapple',
			'wpcom_publish_comments_with_markdown'         => 'pineapple',
			'jetpack_activated'                            => 'pineapple',
			'jetpack_allowed_xsite_search_ids'             => array( 99 ),
			'jetpack_available_modules'                    => 'pineapple',
			'jetpack_autoupdate_plugins'                   => 'pineapple',
			'jetpack_autoupdate_plugins_translations'      => 'pineapple',
			'jetpack_autoupdate_themes'                    => 'pineapple',
			'jetpack_autoupdate_themes_translations'       => 'pineapple',
			'jetpack_autoupdate_core'                      => 'pineapple',
			'jetpack_autoupdate_translations'              => 'pineapple',
			'carousel_background_color'                    => 'pineapple',
			'carousel_display_exif'                        => 'pineapple',
			'carousel_display_comments'                    => 'pineapple',
			'jetpack_portfolio'                            => 'pineapple',
			'jetpack_portfolio_posts_per_page'             => 'pineapple',
			'jetpack_testimonial'                          => 'pineapple',
			'jetpack_testimonial_posts_per_page'           => 'pineapple',
			'tiled_galleries'                              => 'pineapple',
			'gravatar_disable_hovercards'                  => 'pineapple',
			'infinite_scroll'                              => 'pineapple',
			'infinite_scroll_google_analytics'             => 'pineapple',
			'wp_mobile_excerpt'                            => 'pineapple',
			'wp_mobile_featured_images'                    => 'pineapple',
			'wp_mobile_app_promos'                         => 'pineapple',
			'monitor_receive_notifications'                => 'pineapple',
			'post_by_email_address'                        => 'pineapple',
			'jetpack_mailchimp'                            => '{}',
			'jetpack_protect_key'                          => 'pineapple',
			'jetpack_protect_global_whitelist'             => 'pineapple',
			'jetpack_sso_require_two_step'                 => '1',
			'jetpack_sso_match_by_email'                   => '1',
			'jetpack_relatedposts'                         => 'pineapple',
			'verification_services_codes'                  => 'pineapple',
			'users_can_register'                           => '1',
			'active_plugins'                               => array( 'pineapple' ),
			'uninstall_plugins'                            => 'banana',
			'advanced_seo_front_page_description'          => 'banana', // Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION.
			'advanced_seo_title_formats'                   => array(
				'posts' => array(
					'type'  => 'string',
					'value' => 'test',
				),
			), // Jetpack_SEO_Titles::TITLE_FORMATS_OPTION.
			'jetpack_api_cache_enabled'                    => '1',
			'sidebars_widgets'                             => array( 'array_version' => 3 ),
			'start_of_week'                                => '0',
			'disallowed_keys'                              => '',
			'posts_per_page'                               => '1',
			'posts_per_rss'                                => '1',
			'show_on_front'                                => '0',
			'ping_sites'                                   => false,
			'uploads_use_yearmonth_folders'                => '0',
			'date_format'                                  => '0',
			'time_format'                                  => '0',
			'admin_email'                                  => 'banana@example.org',
			'new_admin_email'                              => 'banana@example.net',
			'default_email_category'                       => '2',
			'default_role'                                 => 'contributor',
			'page_for_posts'                               => '2',
			'mailserver_url'                               => 'pineapple.example.com',
			'mailserver_login'                             => '',
			'mailserver_pass'                              => '',
			'mailserver_port'                              => 1,
			'wp_page_for_privacy_policy'                   => false,
			'enable_header_ad'                             => '1',
			'wordads_second_belowpost'                     => '1',
			'wordads_display_front_page'                   => '1',
			'wordads_display_post'                         => '1',
			'wordads_display_page'                         => '1',
			'wordads_display_archive'                      => '1',
			'wordads_custom_adstxt'                        => 'pineapple',
			'wordads_custom_adstxt_enabled'                => false,
			'wordads_ccpa_enabled'                         => false,
			'wordads_ccpa_privacy_policy_url'              => 'pineapple',
			'site_user_type'                               => wp_json_encode( array( 1 => 'pineapple' ) ),
			'site_segment'                                 => 'pineapple',
			'site_vertical'                                => 'pineapple',
			'jetpack_excluded_extensions'                  => 'pineapple',
			'jetpack-memberships-connected-account-id'     => '340',
			'jetpack_publicize_options'                    => array(),
			'jetpack_connection_active_plugins'            => array( 'jetpack' ),
			'jetpack_sync_non_blocking'                    => false,
			'jetpack_sync_settings_dedicated_sync_enabled' => false,
			'jetpack_sync_settings_comment_meta_whitelist' => array( 'jetpack', 'pineapple' ),
			'jetpack_sync_settings_post_meta_whitelist'    => array( 'jetpack', 'pineapple' ),
			'jetpack_sync_settings_post_types_blacklist'   => array( 'jetpack', 'pineapple' ),
			'jetpack_sync_settings_taxonomies_blacklist'   => array( 'jetpack', 'pineapple' ),
			'ce4wp_referred_by'                            => array(),
			'wpcom_is_fse_activated'                       => '1',
			'videopress_private_enabled_for_site'          => false,
		);

		$theme_mod_key             = 'theme_mods_' . get_option( 'stylesheet' );
		$options[ $theme_mod_key ] = 'pineapple';

		$whitelist = $this->options_module->get_options_whitelist();

		// update all the options.
		foreach ( $options as $option_name => $value ) {
			update_option( $option_name, $value );
		}

		$this->sender->do_sync();

		foreach ( $options as $option_name => $value ) {
			$this->assertOptionIsSynced( $option_name, $value );
		}
		$option_keys                          = array_keys( $options );
		$whitelist_and_option_keys_difference = array_diff( $whitelist, $option_keys );
		// Are we testing all the options
		$unique_whitelist = array_unique( $whitelist );

		$this->assertEquals( count( $unique_whitelist ), count( $whitelist ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
		$this->assertEmpty( $whitelist_and_option_keys_difference, 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	public function test_sync_default_contentless_options() {
		$this->setSyncClientDefaults();
		// Check that these values exist in the contentless options list
		$options = array(
			'mailserver_login' => 'pineapple',
			'mailserver_pass'  => 'pineapple',
		);

		$contentless_options = $this->options_module->get_options_contentless();

		// Update all the options.
		foreach ( $options as $option_name => $value ) {
			update_option( $option_name, $value );
		}

		$this->sender->do_sync();

		$option_keys = array_keys( $options );
		foreach ( $option_keys as $option_name ) {
			$this->assertOptionIsSynced( $option_name, '' );
		}
		$contentless_options_difference = array_diff( $contentless_options, $option_keys );
		// Are we testing all the options
		$unique_contentless_options = array_unique( $contentless_options );

		$this->assertEquals(
			count( $unique_contentless_options ),
			count( $contentless_options ),
			'The duplicate keys are: ' . print_r( array_diff_key( $contentless_options, array_unique( $contentless_options ) ), 1 )
		);
		$this->assertEmpty(
			$contentless_options_difference,
			'Some contentless options don\'t have a test: ' . print_r( $contentless_options_difference, 1 )
		);
	}

	public function assertOptionIsSynced( $option_name, $value ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_option( $option_name ), 'Option ' . $option_name . ' didn\'t have the expected value of ' . wp_json_encode( $value ) );
	}

	public function add_jetpack_options_whitelist_filter( $options ) {
		$options[] = 'foo_option_bar';
		return $options;
	}

	/**
	 * Verify that all options are returned by get_objects_by_id
	 */
	public function test_get_objects_by_id_all() {
		$module      = Modules::get_module( 'options' );
		$all_options = $module->get_objects_by_id( 'option', array( 'all' ) );
		$this->assertEquals( $module->get_all_options(), $all_options );
	}

	/**
	 * Verify that get_object_by_id returns a allowed option.
	 */
	public function test_get_objects_by_id_singular() {
		$module      = Modules::get_module( 'options' );
		$options     = $module->get_all_options();
		$get_options = $module->get_objects_by_id( 'option', array( 'test_option' ) );
		$this->assertEquals( $options['test_option'], $get_options['test_option'] );
	}

	/**
	 * Verify that get_object_by_id returns settings logic for jetpack_sync_settings_* options.
	 */
	public function test_get_objects_by_id_sync_settings() {
		$module   = Modules::get_module( 'options' );
		$settings = Settings::get_settings();
		// Reload the proper allowlist of options, as `setUp` only lists `test_option`.
		$this->options_module->update_options_whitelist();
		$get_options = $module->get_objects_by_id( 'option', array( 'jetpack_sync_settings_post_meta_whitelist' ) );
		$this->assertEquals( $settings['post_meta_whitelist'], $get_options['jetpack_sync_settings_post_meta_whitelist'] );
	}
}
