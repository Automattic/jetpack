<?php

/**
 * Testing CRUD on Options
 */
class WP_Test_Jetpack_Sync_Options extends WP_Test_Jetpack_Sync_Base {
	protected $post;
	protected $options_module;

	public function setUp() {
		parent::setUp();

		$this->options_module = Jetpack_Sync_Modules::get_module( "options" );

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
		$this->assertEquals( false, $synced_option_value );
	}

	public function test_don_t_sync_option_if_not_on_whitelist() {
		add_option( 'don_t_sync_test_option', 'foo' );
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_option( 'don_t_sync_test_option' );
		$this->assertEquals( false, $synced_option_value );
	}

	public function test_sync_options_that_use_filter() {
		add_filter( 'jetpack_options_whitelist', array( $this, 'add_jetpack_options_whitelist_filter' ) );
		$this->options_module->update_options_whitelist();
		update_option( 'foo_option_bar', '123' );
		$this->sender->do_sync();

		$this->assertEquals( '123', $this->server_replica_storage->get_option( 'foo_option_bar' ) );
	}

	public function test_sync_initalize_Jetpack_Sync_Action_on_init() {
		// prioroty should be set so that plugins can set their own filers initialize the whitelist_filter before.
		// Priority is set earlier now plugins_loaded but we plugins should still be able to set whitelist_filters by
		// using the plugins_loaded action.

		$this->assertEquals( 90, has_action( 'plugins_loaded', array( 'Jetpack_Sync_Actions', 'init' ) ) );
	}

	public function test_sync_default_options() {
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$options = array(
			'stylesheet'                           => 'test',
			'blogname'                             => 'test',
			'blogdescription'                      => 'banana',
			'blog_charset'                         => 'stuffs',
			'permalink_structure'                  => '%postname%',
			'category_base'                        => 'orange',
			'tag_base'                             => 'apple',
			'comment_moderation'                   => true,
			'default_comment_status'               => 'kiwi',
			'thread_comments'                      => 0,
			'thread_comments_depth'                => 2,
			'social_notifications_like'            => 'test',
			'page_on_front'                        => false,
			'rss_use_excerpt'                      => false,
			'subscription_options'                 => 'pineapple',
			'stb_enabled'                          => true,
			'stc_enabled'                          => false,
			'comment_registration'                 => 'pineapple',
			'show_avatars'                         => 'pineapple',
			'avatar_default'                       => 'pineapple',
			'avatar_rating'                        => 'pineapple',
			'highlander_comment_form_prompt'       => 'pineapple',
			'jetpack_comment_form_color_scheme'    => 'pineapple',
			'stats_options'                        => 'pineapple',
			'gmt_offset'                           => 1,
			'timezone_string'                      => 'America/Anchorage',
			'jetpack_sync_non_public_post_stati'   => 'pineapple',
			'jetpack_options'                      => array( 'food' => 'pineapple' ),
			'site_icon'                            => '1',
			'default_post_format'                  => 'pineapple',
			'default_category'                     => 0,
			'large_size_w'                         => 1000,
			'large_size_h'                         => 2000,
			'thumbnail_size_w'                     => 1000,
			'thumbnail_size_h'                     => 9999,
			'medium_size_w'                        => 200,
			'medium_size_h'                        => 200,
			'thumbnail_crop'                       => 'pineapple',
			'image_default_link_type'              => 'pineapple',
			'site_logo'                            => 1,
			'sharing-options'                      => 'pineapple',
			'sharing-services'                     => 'pineapple',
			'post_count'                           => 'pineapple',
			'default_ping_status'                  => 'pineapple',
			'sticky_posts'                         => 'pineapple',
			'blog_public'                          => 0,
			'default_pingback_flag'                => 'pineapple',
			'require_name_email'                   => 'pineapple',
			'close_comments_for_old_posts'         => 'pineapple',
			'close_comments_days_old'              => 99,
			'page_comments'                        => 'pineapple',
			'comments_per_page'                    => 99,
			'default_comments_page'                => 'pineapple',
			'comment_order'                        => 'pineapple',
			'comments_notify'                      => 'pineapple',
			'moderation_notify'                    => 'pineapple',
			'social_notifications_reblog'          => 'pineapple',
			'social_notifications_subscribe'       => 'pineapple',
			'comment_whitelist'                    => 'pineapple',
			'comment_max_links'                    => 99,
			'moderation_keys'                      => 'pineapple',
			'jetpack_wga'                          => 'pineapple',
			'disabled_likes'                       => 'pineapple',
			'disabled_reblogs'                     => 'pineapple',
			'jetpack_comment_likes_enabled'        => 'pineapple',
			'twitter_via'                          => 'pineapple',
			'jetpack-twitter-cards-site-tag'       => 'pineapple',
			'wpcom_publish_posts_with_markdown'    => 'pineapple',
			'wpcom_publish_comments_with_markdown' => 'pineapple',
			'jetpack_activated'                    => 'pineapple',
			'jetpack_available_modules'            => 'pineapple',
			'jetpack_autoupdate_plugins'           => 'pineapple',
			'jetpack_autoupdate_plugins_translations' => 'pineapple',
			'jetpack_autoupdate_themes'            => 'pineapple',
			'jetpack_autoupdate_themes_translations' => 'pineapple',
			'jetpack_autoupdate_core'              => 'pineapple',
			'jetpack_autoupdate_translations'      => 'pineapple',
			'carousel_background_color'            => 'pineapple',
			'carousel_display_exif'                => 'pineapple',
			'jetpack_portfolio'                    => 'pineapple',
			'jetpack_portfolio_posts_per_page'     => 'pineapple',
			'jetpack_testimonial'                  => 'pineapple',
			'jetpack_testimonial_posts_per_page'   => 'pineapple',
			'tiled_galleries'                      => 'pineapple',
			'gravatar_disable_hovercards'          => 'pineapple',
			'infinite_scroll'                      => 'pineapple',
			'infinite_scroll_google_analytics'     => 'pineapple',
			'wp_mobile_excerpt'                    => 'pineapple',
			'wp_mobile_featured_images'            => 'pineapple',
			'wp_mobile_app_promos'                 => 'pineapple',
			'monitor_receive_notifications'        => 'pineapple',
			'post_by_email_address'                => 'pineapple',
			'jetpack_protect_key'                  => 'pineapple',
			'jetpack_protect_global_whitelist'     => 'pineapple',
			'sharing_services'                     => 'pineapple',
			'jetpack_sso_require_two_step'         => 'pineapple',
			'jetpack_relatedposts'                 => 'pineapple',
			'verification_services_codes'          => 'pineapple',
			'users_can_register'                   => '1',
			'active_plugins'                       => array( 'pineapple' ),
			'uninstall_plugins'                    => 'banana',
			'advanced_seo_front_page_description'  => 'banana', // Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION
			'advanced_seo_title_formats'           => array( 'posts' => array( 'type' => 'string', 'value' => 'test' ) ), // Jetpack_SEO_Titles::TITLE_FORMATS_OPTION
			'jetpack_api_cache_enabled'            => '1',
		);

		$theme_mod_key             = 'theme_mods_' . get_option( 'stylesheet' );
		$options[ $theme_mod_key ] = 'pineapple';

		$whitelist = $this->options_module->get_options_whitelist();

		// update all the opyions.
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
		$this->assertTrue( empty( $whitelist_and_option_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	public function test_add_whitelisted_option_on_init_89() {
		add_action( 'init', array( $this, 'add_option_on_89' ), 89 );
		do_action( 'init' );

		$whitelist = $this->options_module->get_options_whitelist();

		$this->assertTrue( in_array( 'foo_option_bar', $whitelist ) );
	}

	function assertOptionIsSynced( $option_name, $value ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_option( $option_name ), 'Option ' . $option_name . ' did\'t have the extected value of ' . json_encode( $value ) );
	}

	public function add_jetpack_options_whitelist_filter( $options ) {
		$options[] = 'foo_option_bar';
		return $options;
	}



	function add_option_on_89() {
		add_filter( 'jetpack_options_whitelist', array( $this, 'add_jetpack_options_whitelist_filter' ) );
	}
}
