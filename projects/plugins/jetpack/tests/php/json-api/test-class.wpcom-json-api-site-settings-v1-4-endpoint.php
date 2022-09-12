<?php
/**
 * Jetpack `sites/%s/settings` endpoint unit tests.
 * Run this test with command: jetpack docker phpunit -- --filter=WP_Test_WPCOM_JSON_API_Site_Settings_V1_4_Endpoint
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'class.json-api-endpoints.php' );

/**
 * Jetpack `sites/%s/settings` endpoint unit tests.
 */
class WP_Test_WPCOM_JSON_API_Site_Settings_V1_4_Endpoint extends WP_UnitTestCase {

	/**
	 * Example of woocommerce_onboarding_profile value.
	 *
	 * @var array
	 */
	private $onboarding_profile_example = array(
		'is_agree_marketing'  => true,
		'store_email'         => 'example@gmail.com',
		'industry'            =>
		array(
			0 =>
			array(
				'slug' => 'health-beauty',
			),
			1 =>
			array(
				'slug' => 'fashion-apparel-accessories',
			),
			2 =>
			array(
				'slug'   => 'other',
				'detail' => 'Custom industry',
			),
		),
		'product_types'       =>
		array(
			0 => 'physical',
			1 => 'downloads',
			2 => 'memberships',
		),
		'product_count'       => '11-100',
		'selling_venues'      => 'other-woocommerce',
		'revenue'             => 'up-to-2500',
		'setup_client'        => true,
		'business_extensions' =>
		array(
			0 => 'google-listings-and-ads',
		),
		'theme'               => 'storefront',
		'completed'           => true,
	);

	/**
	 * Prepare the environment for the test.
	 */
	public function set_up() {
		global $blog_id;

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1.4' );
		}

		parent::set_up();

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
	}

	/**
	 * Test GET `sites/%s/settings` returns correct keys and key default values when no value is set.
	 *
	 * @dataProvider setting_default_key_values
	 *
	 * @param string $setting_name The setting lookup key.
	 * @param string $expected_default_value The default value we expect when no value is explicitly set.
	 */
	public function test_get_settings_contains_key_defaults( $setting_name, $expected_default_value ) {
		$response = $this->make_get_request();
		$settings = $response['settings'];
		$this->assertSame( $expected_default_value, $settings[ $setting_name ] );
	}

	/**
	 * Test GET `sites/%s/settings` returns correct set value.
	 *
	 * @dataProvider setting_value_pairs_get_request
	 *
	 * @param string $setting_name The setting lookup key.
	 * @param string $setting_value The setting value to test.
	 */
	public function test_get_settings_contains_keys_values( $setting_name, $setting_value ) {
		update_option( $setting_name, $setting_value );

		$response = $this->make_get_request();
		$settings = $response['settings'];
		$this->assertSame( $setting_value, $settings[ $setting_name ] );
	}

	/**
	 * Test POST `sites/%s/settings` sets the correct value.
	 *
	 * @dataProvider setting_value_pairs_post_request
	 *
	 * @param string $setting_name The setting lookup key.
	 * @param string $setting_value The setting value to test.
	 * @param string $expected_value The expected sanitized value.
	 */
	public function test_post_settings_sets_key_values( $setting_name, $setting_value, $expected_value ) {
		$setting  = wp_json_encode( array( $setting_name => $setting_value ) );
		$response = $this->make_post_request( $setting );
		$updated  = $response['updated'];
		$this->assertSame( $expected_value, $updated[ $setting_name ] );
	}

	/**
	 * Returns the response of a successful GET request to `sites/%s/settings`.
	 */
	public function make_get_request() {
		global $blog_id;

		$admin = self::factory()->user->create_and_get(
			array(
				'role' => 'administrator',
			)
		);

		wp_set_current_user( $admin->ID );

		$endpoint = new WPCOM_JSON_API_Site_Settings_V1_4_Endpoint(
			array(
				'description'      => 'Get detailed settings information about a site.',
				'group'            => '__do_not_document',
				'stat'             => 'sites:X',
				'min_version'      => '1.4',
				'method'           => 'GET',
				'path'             => '/sites/%s/settings',
				'path_labels'      => array(
					'$site' => '(int|string) Site ID or domain',
				),

				'query_parameters' => array(
					'context' => false,
				),

				'response_format'  => WPCOM_JSON_API_Site_Settings_Endpoint::$site_format,

				'example_request'  => 'https://public-api.wordpress.com/rest/v1.4/sites/en.blog.wordpress.com/settings?pretty=1',
			)
		);

		return $endpoint->callback( '/sites/%s/settings', $blog_id );
	}

	/**
	 * Returns the response of a successful POST request to `sites/%s/settings`.
	 *
	 * @param string $setting The json encoded POST request body containing the test setting key and value.
	 */
	public function make_post_request( $setting ) {
		global $blog_id;

		$admin = self::factory()->user->create_and_get(
			array(
				'role' => 'administrator',
			)
		);

		wp_set_current_user( $admin->ID );

		$endpoint = new WPCOM_JSON_API_Site_Settings_V1_4_Endpoint(
			array(
				'description'     => 'Update settings for a site.',
				'group'           => '__do_not_document',
				'stat'            => 'sites:X',
				'min_version'     => '1.4',
				'method'          => 'POST',
				'path'            => '/sites/%s/settings',
				'path_labels'     => array(
					'$site' => '(int|string) Site ID or domain',
				),

				'request_format'  => array(
					'blogname'                             => '(string) Blog name',
					'blogdescription'                      => '(string) Blog description',
					'default_pingback_flag'                => '(bool) Notify blogs linked from article?',
					'default_ping_status'                  => '(bool) Allow link notifications from other blogs?',
					'default_comment_status'               => '(bool) Allow comments on new articles?',
					'blog_public'                          => '(string) Site visibility; -1: private, 0: discourage search engines, 1: allow search engines',
					'jetpack_sync_non_public_post_stati'   => '(bool) allow sync of post and pages with non-public posts stati',
					'jetpack_relatedposts_enabled'         => '(bool) Enable related posts?',
					'jetpack_relatedposts_show_headline'   => '(bool) Show headline in related posts?',
					'jetpack_relatedposts_show_thumbnails' => '(bool) Show thumbnails in related posts?',
					'instant_search_enabled'               => '(bool) Enable the new Jetpack Instant Search interface',
					'jetpack_search_enabled'               => '(bool) Enable Jetpack Search',
					'jetpack_search_supported'             => '(bool) Jetpack Search supported',
					'jetpack_protect_whitelist'            => '(array) List of IP addresses to whitelist',
					'infinite_scroll'                      => '(bool) Support infinite scroll of posts?',
					'default_category'                     => '(int) Default post category',
					'default_post_format'                  => '(string) Default post format',
					'require_name_email'                   => '(bool) Require comment authors to fill out name and email?',
					'comment_registration'                 => '(bool) Require users to be registered and logged in to comment?',
					'close_comments_for_old_posts'         => '(bool) Automatically close comments on old posts?',
					'close_comments_days_old'              => '(int) Age at which to close comments',
					'thread_comments'                      => '(bool) Enable threaded comments?',
					'thread_comments_depth'                => '(int) Depth to thread comments',
					'page_comments'                        => '(bool) Break comments into pages?',
					'comments_per_page'                    => '(int) Number of comments to display per page',
					'default_comments_page'                => '(string) newest|oldest Which page of comments to display first',
					'comment_order'                        => '(string) asc|desc Order to display comments within page',
					'comments_notify'                      => '(bool) Email me when someone comments?',
					'moderation_notify'                    => '(bool) Email me when a comment is helf for moderation?',
					'social_notifications_like'            => '(bool) Email me when someone likes my post?',
					'social_notifications_reblog'          => '(bool) Email me when someone reblogs my post?',
					'social_notifications_subscribe'       => '(bool) Email me when someone follows my blog?',
					'comment_moderation'                   => '(bool) Moderate comments for manual approval?',
					'comment_previously_approved'          => '(bool) Moderate comments unless author has a previously-approved comment?',
					'comment_max_links'                    => '(int) Moderate comments that contain X or more links',
					'moderation_keys'                      => '(string) Words or phrases that trigger comment moderation, one per line',
					'disallowed_keys'                      => '(string) Words or phrases that mark comment spam, one per line',
					'lang_id'                              => '(int) ID for language blog is written in',
					'locale'                               => '(string) locale code for language blog is written in',
					'wga'                                  => '(array) Google Analytics Settings',
					'jetpack_cloudflare_analytics'         => '(array) Cloudflare Analytics Settings',
					'disabled_likes'                       => '(bool) Are likes globally disabled (they can still be turned on per post)?',
					'disabled_reblogs'                     => '(bool) Are reblogs disabled on posts?',
					'jetpack_comment_likes_enabled'        => '(bool) Are comment likes enabled for all comments?',
					'sharing_button_style'                 => '(string) Style to use for sharing buttons (icon-text, icon, text, or official)',
					'sharing_label'                        => '(string) Label to use for sharing buttons, e.g. "Share this:"',
					'sharing_show'                         => '(string|array:string) Post type or array of types where sharing buttons are to be displayed',
					'sharing_open_links'                   => '(string) Link target for sharing buttons (same or new)',
					'twitter_via'                          => '(string) Twitter username to include in tweets when people share using the Twitter button',
					'jetpack-twitter-cards-site-tag'       => '(string) The Twitter username of the owner of the site\'s domain.',
					'eventbrite_api_token'                 => '(int) The Keyring token ID for an Eventbrite token to associate with the site',
					'timezone_string'                      => '(string) PHP-compatible timezone string like \'UTC-5\'',
					'gmt_offset'                           => '(int) Site offset from UTC in hours',
					'date_format'                          => '(string) PHP Date-compatible date format',
					'time_format'                          => '(string) PHP Date-compatible time format',
					'start_of_week'                        => '(int) Starting day of week (0 = Sunday, 6 = Saturday)',
					'woocommerce_onboarding_profile'       => '(array) woocommerce_onboarding_profile',
					'woocommerce_store_address'            => '(string) woocommerce_store_address option',
					'woocommerce_store_address_2'          => '(string) woocommerce_store_address_2 option',
					'woocommerce_store_city'               => '(string) woocommerce_store_city option',
					'woocommerce_default_country'          => '(string) woocommerce_default_country option',
					'woocommerce_store_postcode'           => '(string) woocommerce_store_postcode option',
					'jetpack_testimonial'                  => '(bool) Whether testimonial custom post type is enabled for the site',
					'jetpack_testimonial_posts_per_page'   => '(int) Number of testimonials to show per page',
					'jetpack_portfolio'                    => '(bool) Whether portfolio custom post type is enabled for the site',
					'jetpack_portfolio_posts_per_page'     => '(int) Number of portfolio projects to show per page',
					Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION => '(string) The SEO meta description for the site.',
					Jetpack_SEO_Titles::TITLE_FORMATS_OPTION => '(array) SEO meta title formats. Allowed keys: front_page, posts, pages, groups, archives',
					'verification_services_codes'          => '(array) Website verification codes. Allowed keys: google, pinterest, bing, yandex, facebook',
					'amp_is_enabled'                       => '(bool) Whether AMP is enabled for this site',
					'podcasting_archive'                   => '(string) The post category, if any, used for publishing podcasts',
					'site_icon'                            => '(int) Media attachment ID to use as site icon. Set to zero or an otherwise empty value to clear',
					'api_cache'                            => '(bool) Turn on/off the Jetpack JSON API cache',
					'posts_per_page'                       => '(int) Number of posts to show on blog pages',
					'posts_per_rss'                        => '(int) Number of posts to show in the RSS feed',
					'rss_use_excerpt'                      => '(bool) Whether the RSS feed will use post excerpts',
				),

				'response_format' => array(
					'updated' => '(array)',
				),

				'example_request' => 'https://public-api.wordpress.com/rest/v1.4/sites/en.blog.wordpress.com/settings?pretty=1',
			)
		);

		$endpoint->api->post_body    = $setting;
		$endpoint->api->content_type = 'application/json';
		$endpoint->api->method       = 'POST';

		return $endpoint->callback( '', $blog_id );
	}

	/**
	 * Data provider that contains keys we expect to see returned by the settings endpoint and their default value.
	 *
	 * @return array[ $setting_name, $expected_default_value ]
	 */
	public function setting_default_key_values() {
		return array(
			'woocommerce_store_address'      => array( 'woocommerce_store_address', '' ),
			'woocommerce_store_address_2'    => array( 'woocommerce_store_address_2', '' ),
			'woocommerce_store_city'         => array( 'woocommerce_store_city', '' ),
			'woocommerce_default_country'    => array( 'woocommerce_default_country', '' ),
			'woocommerce_store_postcode'     => array( 'woocommerce_store_postcode', '' ),
			'woocommerce_onboarding_profile' => array( 'woocommerce_onboarding_profile', array() ),
		);
	}

	/**
	 * Data provider to test setting value pairs in GET request.
	 *
	 * @return array[ $setting_name, $setting_value ]
	 */
	public function setting_value_pairs_get_request() {
		return array(
			'woocommerce_store_address'      => array( 'woocommerce_store_address', 'Street 34th 1/2' ),
			'woocommerce_store_address_2'    => array( 'woocommerce_store_address_2', 'Apt #1' ),
			'woocommerce_store_city'         => array( 'woocommerce_store_city', 'City' ),
			'woocommerce_default_country'    => array( 'woocommerce_default_country', 'US:NY' ),
			'woocommerce_store_postcode'     => array( 'woocommerce_store_postcode', '98738' ),
			'woocommerce_onboarding_profile' => array( 'woocommerce_onboarding_profile', array( 'test' => 'test value' ) ),
		);
	}

	/**
	 * Data provider to test setting value pairs in POST request.
	 *
	 * @return array[ $setting_name, $setting_value, $expected_value ]
	 */
	public function setting_value_pairs_post_request() {
		return array(
			'woocommerce_store_address'                 => array( 'woocommerce_store_address', '<h1>Street 34th 1/2</h1>', 'Street 34th 1/2' ),
			'woocommerce_store_address_2'               => array( 'woocommerce_store_address_2', '<h2>Apt #1</h2>', 'Apt #1' ),
			'woocommerce_store_city'                    => array( 'woocommerce_store_city', '<h3>City</h3>', 'City' ),
			'woocommerce_default_country'               => array( 'woocommerce_default_country', '<p>US:NY</p>', 'US:NY' ),
			'woocommerce_store_postcode'                => array( 'woocommerce_store_postcode', '<div>98738</div>', '98738' ),
			'woocommerce_store_postcode script tag'     => array( 'woocommerce_store_postcode', '<script>98738</script>', '' ),
			'woocommerce_onboarding_profile'            => array( 'woocommerce_onboarding_profile', array( 'test_key' => '<strong>test value</strong>' ), array( 'test_key' => 'test value' ) ),
			'woocommerce_onboarding_profile script tag' => array( 'woocommerce_onboarding_profile', array( 'test_key' => '<script>test value</script>' ), array( 'test_key' => '' ) ),
			'woocommerce_onboarding_profile string'     => array( 'woocommerce_onboarding_profile', 'string', array( 'string' ) ),
			'woocommerce_onboarding_profile bool'       => array( 'woocommerce_onboarding_profile', true, array( true ) ),
			'woocommerce_onboarding_profile example'    => array( 'woocommerce_onboarding_profile', $this->onboarding_profile_example, $this->onboarding_profile_example ),
		);
	}
}
