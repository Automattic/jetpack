<?php
/**
 * Jetpack `sites/%s/settings` endpoint unit tests.
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Site_Settings_V1_4_Endpoint_Test
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Jetpack `sites/%s/settings` endpoint unit tests.
 */
class WPCOM_JSON_API_Site_Settings_V1_4_Endpoint_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Example of woocommerce_onboarding_profile value.
	 *
	 * @var array
	 */
	private static $onboarding_profile_example = array(
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

		// Mock available abilities (just names)
		add_filter(
			'jetpack_site_mcp_abilities',
			function () {
				return array(
					'wpcom-mcp/posts-search',
					'wpcom-mcp/user-sites',
				);
			}
		);

		// Mock ability metadata
		add_filter(
			'jetpack_site_mcp_ability_meta',
			function ( $ability_meta, $ability_name ) {
				$test_metadata = array(
					'wpcom-mcp/posts-search' => array(
						'title'       => 'Posts search',
						'description' => 'Search posts',
						'category'    => 'search',
						'type'        => 'tool',
						'enabled'     => true,
					),
					'wpcom-mcp/user-sites'   => array(
						'title'       => 'User sites',
						'description' => 'Access user sites',
						'category'    => 'user',
						'type'        => 'resource',
						'enabled'     => false,
					),
				);
				return $test_metadata[ $ability_name ] ?? array();
			},
			10,
			2
		);
	}

	public function tear_down() {
		// Remove the filter to avoid affecting other tests
		remove_all_filters( 'jetpack_mcp_abilities' );
		parent::tear_down();
	}

	/**
	 * Test GET `sites/%s/settings` returns correct keys and key default values when no value is set.
	 *
	 * @dataProvider setting_default_key_values
	 *
	 * @param string $setting_name The setting lookup key.
	 * @param string $expected_default_value The default value we expect when no value is explicitly set.
	 */
	#[DataProvider( 'setting_default_key_values' )]
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
	 * @param string $option_name The option lookup key.
	 * @param string $setting_name The setting lookup key.
	 * @param string $setting_value The setting value to test.
	 */
	#[DataProvider( 'setting_value_pairs_get_request' )]
	public function test_get_settings_contains_keys_values( $option_name, $setting_name, $setting_value ) {
		update_option( $option_name, $setting_value );

		$response = $this->make_get_request();
		$settings = $response['settings'];
		$this->assertSame( $setting_value, $settings[ $setting_name ] );
	}

	/**
	 * The GET response exposes a read-only `free_tier_description_rendered`
	 * derived from the stored markdown source, rendered to safe HTML.
	 */
	public function test_get_settings_renders_free_tier_description() {
		update_option( 'subscription_options', array( 'free_tier_description' => 'Hello **world**' ) );

		$response = $this->make_get_request();
		$settings = $response['settings'];

		$this->assertStringContainsString( '<strong>world</strong>', $settings['free_tier_description_rendered'] );
		// The rendered field is derived only; it must not leak into the writable option bag.
		$this->assertArrayNotHasKey( 'free_tier_description_rendered', $settings['subscription_options'] );
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
	#[DataProvider( 'setting_value_pairs_post_request' )]
	public function test_post_settings_sets_key_values( $setting_name, $setting_value, $expected_value ) {
		$setting  = wp_json_encode( array( $setting_name => $setting_value ), JSON_UNESCAPED_SLASHES );
		$response = $this->make_post_request( $setting );
		$updated  = $response['updated'];
		$this->assertSame( $expected_value, $updated[ $setting_name ] );
	}

	/**
	 * The free tier description is capped to 500 characters to match the
	 * paid-tier description field.
	 */
	public function test_post_free_tier_description_is_length_capped() {
		$setting  = wp_json_encode(
			array( 'subscription_options' => array( 'free_tier_description' => str_repeat( 'a', 600 ) ) ),
			JSON_UNESCAPED_SLASHES
		);
		$response = $this->make_post_request( $setting );
		$updated  = $response['updated'];
		$this->assertSame(
			500,
			strlen( $updated['subscription_options']['free_tier_description'] )
		);
	}

	/**
	 * A non-scalar `free_tier_description` (e.g. an array from a malformed JSON
	 * payload) must be dropped rather than passed to wp_kses()/mb_substr(), which
	 * would fatal on PHP 8+. A sibling valid key is included so the update still
	 * proceeds and the dropped key can be asserted.
	 */
	public function test_post_free_tier_description_ignores_non_scalar() {
		$setting  = wp_json_encode(
			array(
				'subscription_options' => array(
					'free_tier_description'   => array( 'unexpected', 'array' ),
					'subscribe_modal_heading' => 'Still saved',
				),
			),
			JSON_UNESCAPED_SLASHES
		);
		$response = $this->make_post_request( $setting );
		$updated  = $response['updated'];
		$this->assertSame( 'Still saved', $updated['subscription_options']['subscribe_modal_heading'] );
		$this->assertArrayNotHasKey( 'free_tier_description', $updated['subscription_options'] );
	}

	/**
	 * Registers a `subscription_options` default that stands in for the one
	 * `modules/subscriptions/views.php` adds, so these tests exercise the
	 * endpoint's contract without depending on that module being loaded.
	 *
	 * @return array The defaults that `get_option( 'subscription_options' )` now returns.
	 */
	private function register_subscription_options_default() {
		$defaults = array(
			// The real `invitation` default writes its anchor with single-quoted
			// attributes. Mirrored here because wp_kses() may rewrite that quoting, so
			// this is what exercises the endpoint normalizing both sides of the change
			// detection rather than comparing a raw default against a sanitized echo.
			'invitation'     => "Default invitation to <a href='https://example.org'>example.org</a>",
			'comment_follow' => 'Default comment follow',
			'welcome'        => 'Default welcome',
		);

		add_filter(
			'default_option_subscription_options',
			static function ( $default_value, $option, $passed_default ) use ( $defaults ) {
				return $passed_default ? $default_value : $defaults;
			},
			10,
			3
		);

		return $defaults;
	}

	/**
	 * A default carrying markup must survive the round trip unchanged.
	 *
	 * The posted value reaches the comparison already sanitized, and wp_kses() is not
	 * byte-preserving — it rewrites attribute quoting, and not identically across
	 * WordPress versions. So the endpoint has to normalize the current value the same
	 * way before comparing. Without that, `invitation` — the one default containing
	 * markup, and so the sub-key this guard most needs to catch — never compares equal
	 * and is persisted on every save.
	 */
	public function test_post_subscription_options_ignores_unchanged_default_containing_markup() {
		$defaults = $this->register_subscription_options_default();

		$setting  = wp_json_encode(
			array( 'subscription_options' => array( 'invitation' => $defaults['invitation'] ) ),
			JSON_UNESCAPED_SLASHES
		);
		$response = $this->make_post_request( $setting );

		$this->assertArrayNotHasKey( 'subscription_options', $response['updated'] );
		$this->assertFalse( get_option( 'subscription_options', false ) );
	}

	/**
	 * Clients that render the settings form post the whole `subscription_options`
	 * bag back, defaults included. Re-sending values the user never edited must
	 * not create the option row: those defaults are translated at read time, so
	 * persisting them would freeze whichever locale the form was rendered in.
	 */
	public function test_post_subscription_options_ignores_unchanged_defaults() {
		$defaults = $this->register_subscription_options_default();

		$setting  = wp_json_encode( array( 'subscription_options' => $defaults ), JSON_UNESCAPED_SLASHES );
		$response = $this->make_post_request( $setting );

		$this->assertArrayNotHasKey( 'subscription_options', $response['updated'] );
		$this->assertFalse( get_option( 'subscription_options', false ) );
	}

	/**
	 * Only the sub-key the user actually edited is persisted; the untouched
	 * defaults posted alongside it stay out of the stored row.
	 */
	public function test_post_subscription_options_persists_only_changed_sub_keys() {
		$defaults = $this->register_subscription_options_default();

		$setting  = wp_json_encode(
			array( 'subscription_options' => array_merge( $defaults, array( 'welcome' => 'My own welcome' ) ) ),
			JSON_UNESCAPED_SLASHES
		);
		$response = $this->make_post_request( $setting );

		$this->assertSame( array( 'welcome' => 'My own welcome' ), $response['updated']['subscription_options'] );
		$this->assertSame( array( 'welcome' => 'My own welcome' ), get_option( 'subscription_options' ) );
	}

	/**
	 * Re-posting the stored value unchanged is also a no-op, so a save that only
	 * touches other settings doesn't rewrite this option.
	 */
	public function test_post_subscription_options_ignores_unchanged_stored_value() {
		update_option( 'subscription_options', array( 'welcome' => 'Stored welcome' ) );

		$setting  = wp_json_encode(
			array( 'subscription_options' => array( 'welcome' => 'Stored welcome' ) ),
			JSON_UNESCAPED_SLASHES
		);
		$response = $this->make_post_request( $setting );

		$this->assertArrayNotHasKey( 'subscription_options', $response['updated'] );
		$this->assertSame( array( 'welcome' => 'Stored welcome' ), get_option( 'subscription_options' ) );
	}

	/**
	 * Once any sub-key has been saved, the option row exists without the untouched
	 * defaults — the `default_option_subscription_options` filter only fires for a
	 * missing row. The GET response must still expose those defaults so the form
	 * renders the translated welcome/invitation/comment_follow text rather than
	 * blanks.
	 */
	public function test_get_settings_populates_defaults_after_partial_row_saved() {
		$defaults = $this->register_subscription_options_default();

		// A prior save of a non-default sub-key leaves the row partial.
		update_option( 'subscription_options', array( 'subscribe_modal_heading' => 'My heading' ) );

		$response = $this->make_get_request();
		$settings = $response['settings'];

		$this->assertSame( $defaults['invitation'], $settings['subscription_options']['invitation'] );
		$this->assertSame( $defaults['welcome'], $settings['subscription_options']['welcome'] );
		$this->assertSame( $defaults['comment_follow'], $settings['subscription_options']['comment_follow'] );
		$this->assertSame( 'My heading', $settings['subscription_options']['subscribe_modal_heading'] );
	}

	/**
	 * The same partial-row state must not break change detection on save: re-posting
	 * the untouched defaults alongside the stored sub-key is still a no-op, so the
	 * translated defaults aren't frozen into the row on the next save.
	 */
	public function test_post_subscription_options_ignores_defaults_after_partial_row_saved() {
		$defaults = $this->register_subscription_options_default();

		update_option( 'subscription_options', array( 'subscribe_modal_heading' => 'My heading' ) );

		$setting  = wp_json_encode(
			array( 'subscription_options' => $defaults ),
			JSON_UNESCAPED_SLASHES
		);
		$response = $this->make_post_request( $setting );

		$this->assertArrayNotHasKey( 'subscription_options', $response['updated'] );
		$this->assertSame( array( 'subscribe_modal_heading' => 'My heading' ), get_option( 'subscription_options' ) );
	}

	/**
	 * Data provider of falsy `hide_free_tier` representations.
	 *
	 * @return array<string,array{mixed}> [ $posted_value ]
	 */
	public static function falsy_hide_free_tier_values() {
		return array(
			'boolean false' => array( false ),
			'string false'  => array( 'false' ),
			'string zero'   => array( '0' ),
		);
	}

	/**
	 * An unset `hide_free_tier` and a false one mean the same thing everywhere the
	 * option is read, so posting a falsy flag against an unset option is a no-op
	 * rather than a reason to create the row.
	 *
	 * @param mixed $posted_value The falsy value to post.
	 * @dataProvider falsy_hide_free_tier_values
	 */
	#[DataProvider( 'falsy_hide_free_tier_values' )]
	public function test_post_subscription_options_falsy_hide_free_tier_is_noop_when_unset( $posted_value ) {
		$setting  = wp_json_encode(
			array( 'subscription_options' => array( 'hide_free_tier' => $posted_value ) ),
			JSON_UNESCAPED_SLASHES
		);
		$response = $this->make_post_request( $setting );

		$this->assertArrayNotHasKey( 'subscription_options', $response['updated'] );
		$this->assertFalse( get_option( 'subscription_options', false ) );
	}

	/**
	 * The flag can still be turned off once it has been turned on — the no-op
	 * above applies to "never set", not to "set to true".
	 *
	 * @param mixed $posted_value The falsy value to post.
	 * @dataProvider falsy_hide_free_tier_values
	 */
	#[DataProvider( 'falsy_hide_free_tier_values' )]
	public function test_post_subscription_options_falsy_hide_free_tier_clears_stored_true( $posted_value ) {
		update_option( 'subscription_options', array( 'hide_free_tier' => true ) );

		$setting  = wp_json_encode(
			array( 'subscription_options' => array( 'hide_free_tier' => $posted_value ) ),
			JSON_UNESCAPED_SLASHES
		);
		$response = $this->make_post_request( $setting );

		$this->assertSame( array( 'hide_free_tier' => false ), $response['updated']['subscription_options'] );
		$this->assertSame( array( 'hide_free_tier' => false ), get_option( 'subscription_options' ) );
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

		// The API object is a shared singleton, so a preceding POST test can leave the
		// method set to 'POST'. Set it explicitly so the GET path is exercised regardless
		// of test order.
		$endpoint->api->method = 'GET';

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
					'jetpack_relatedposts_show_context'    => '(bool) Show post\'s tags and category in related posts?',
					'jetpack_relatedposts_show_date'       => '(bool) Show date in related posts?',
					'jetpack_relatedposts_show_headline'   => '(bool) Show headline in related posts?',
					'jetpack_relatedposts_show_thumbnails' => '(bool) Show thumbnails in related posts?',
					'instant_search_enabled'               => '(bool) Enable the new Jetpack Instant Search interface',
					'jetpack_search_enabled'               => '(bool) Enable Jetpack Search',
					'jetpack_search_supported'             => '(bool) Jetpack Search supported',
					'jetpack_protect_whitelist'            => '(array) List of IP addresses to always allow',
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
					'social_notifications_subscribe'       => '(bool) Email me when someone subscribes to my blog?',
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
					'podcasting_archive'                   => '(string) The post category, if any, used for publishing podcasts',
					'site_icon'                            => '(int) Media attachment ID to use as site icon. Set to zero or an otherwise empty value to clear',
					'api_cache'                            => '(bool) Turn on/off the Jetpack JSON API cache',
					'posts_per_page'                       => '(int) Number of posts to show on blog pages',
					'posts_per_rss'                        => '(int) Number of posts to show in the RSS feed',
					'rss_use_excerpt'                      => '(bool) Whether the RSS feed will use post excerpts',
					'show_on_front'                        => '(string) Whether homepage should display related posts or a static page. The expected value is \'posts\' or \'page\'.',
					'page_on_front'                        => '(string) The page ID of the page to use as the site\'s homepage. It will apply only if \'show_on_front\' is set to \'page\'.',
					'page_for_posts'                       => '(string) The page ID of the page to use as the site\'s posts page. It will apply only if \'show_on_front\' is set to \'page\'.',
					'subscription_options'                 => '(array) Array of options used in subscription email templates and the Subscribe block: \'invitation\', \'welcome\', \'comment_follow\' and \'subscribe_modal_heading\' strings.',
					'mcp_abilities'                        => '(array) List of MCP Abilities',
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
	 * @return array<string,array{string, mixed}> [ $setting_name, $expected_default_value ]
	 */
	public static function setting_default_key_values() {
		return array(
			'woocommerce_store_address'        => array( 'woocommerce_store_address', '' ),
			'woocommerce_store_address_2'      => array( 'woocommerce_store_address_2', '' ),
			'woocommerce_store_city'           => array( 'woocommerce_store_city', '' ),
			'woocommerce_default_country'      => array( 'woocommerce_default_country', '' ),
			'woocommerce_store_postcode'       => array( 'woocommerce_store_postcode', '' ),
			'woocommerce_onboarding_profile'   => array( 'woocommerce_onboarding_profile', array() ),
			'supports_free_tier_customization' => array( 'supports_free_tier_customization', true ),
			// With no free tier description set, the rendered value is an empty string.
			'free_tier_description_rendered'   => array( 'free_tier_description_rendered', '' ),
			// Add MCP settings default
			'mcp_abilities'                    => array(
				'mcp_abilities',
				array(
					'wpcom-mcp/posts-search' => array(
						'name'        => 'wpcom-mcp/posts-search',
						'title'       => 'Posts search',
						'description' => 'Search posts',
						'category'    => 'search',
						'type'        => 'tool',
						'enabled'     => true,
					),
					'wpcom-mcp/user-sites'   => array(
						'name'        => 'wpcom-mcp/user-sites',
						'title'       => 'User sites',
						'description' => 'Access user sites',
						'category'    => 'user',
						'type'        => 'resource',
						'enabled'     => false,
					),
				),
			),
		);
	}

	/**
	 * Data provider to test setting value pairs in GET request.
	 *
	 * @return array<string,array{string,string,mixed}> [ $setting_name, $setting_value ]
	 */
	public static function setting_value_pairs_get_request() {
		return array(
			'woocommerce_store_address'      => array( 'woocommerce_store_address', 'woocommerce_store_address', 'Street 34th 1/2' ),
			'woocommerce_store_address_2'    => array( 'woocommerce_store_address_2', 'woocommerce_store_address_2', 'Apt #1' ),
			'woocommerce_store_city'         => array( 'woocommerce_store_city', 'woocommerce_store_city', 'City' ),
			'woocommerce_default_country'    => array( 'woocommerce_default_country', 'woocommerce_default_country', 'US:NY' ),
			'woocommerce_store_postcode'     => array( 'woocommerce_store_postcode', 'woocommerce_store_postcode', '98738' ),
			'woocommerce_onboarding_profile' => array( 'woocommerce_onboarding_profile', 'woocommerce_onboarding_profile', array( 'test' => 'test value' ) ),
			// Add MCP settings GET test
			'mcp_abilities'                  => array(
				'mcp_abilities',        // option name
				'mcp_abilities',        // setting name
				array(
					'wpcom-mcp/posts-search' => array(
						'name'        => 'wpcom-mcp/posts-search',
						'title'       => 'Posts search',
						'description' => 'Search posts',
						'category'    => 'search',
						'type'        => 'tool',
						'enabled'     => true,
					),
					'wpcom-mcp/user-sites'   => array(
						'name'        => 'wpcom-mcp/user-sites',
						'title'       => 'User sites',
						'description' => 'Access user sites',
						'category'    => 'user',
						'type'        => 'resource',
						'enabled'     => true,
					),
				),
			),
		);
	}

	/**
	 * Data provider to test setting value pairs in POST request.
	 *
	 * @return array<string,array{string,mixed,mixed}> [ $setting_name, $setting_value, $expected_value ]
	 */
	public static function setting_value_pairs_post_request() {
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
			'woocommerce_onboarding_profile example'    => array( 'woocommerce_onboarding_profile', static::$onboarding_profile_example, static::$onboarding_profile_example ),
			'show_on_front'                             => array( 'show_on_front', 'page', 'page' ),
			'subscription_options html'                 => array(
				'subscription_options',
				array(
					'invitation'     => '<strong>Test</strong> string <a href="#">link</a>',
					'comment_follow' => "Test string 2\n\n Other line",
				),
				array(
					'invitation'     => 'Test string <a href="#">link</a>',
					'comment_follow' => "Test string 2\n\n Other line",
				),
			),
			'subscription_options heading'              => array(
				'subscription_options',
				array(
					'subscribe_modal_heading' => 'Join my newsletter <a href="#">today</a>!',
				),
				array(
					'subscribe_modal_heading' => 'Join my newsletter <a href="#">today</a>!',
				),
			),
			'subscription_options free description'     => array(
				'subscription_options',
				array(
					'free_tier_description' => '<strong>Free</strong> taste <a href="#">link</a>',
				),
				array(
					// The free tier description is stored as plain markdown source, so all HTML is stripped.
					'free_tier_description' => 'Free taste link',
				),
			),
			'subscription_options hide free tier true'  => array(
				'subscription_options',
				array(
					'hide_free_tier' => true,
				),
				array(
					'hide_free_tier' => true,
				),
			),
			// Stringy booleans must be parsed by value via is_truthy(), not by
			// truthiness — otherwise the non-empty string "false" would be stored
			// as `true`. These guard the WPCOM JSON API write path against regressions.
			// The falsy counterparts live in
			// `test_post_subscription_options_falsy_hide_free_tier_*` below, because
			// against an unset option they are a no-op rather than a write.
			'subscription_options hide free tier string true' => array(
				'subscription_options',
				array(
					'hide_free_tier' => 'true',
				),
				array(
					'hide_free_tier' => true,
				),
			),
			'subscription_options hide free tier string one' => array(
				'subscription_options',
				array(
					'hide_free_tier' => '1',
				),
				array(
					'hide_free_tier' => true,
				),
			),
			// Add MCP settings POST tests
			'mcp_abilities valid'                       => array(
				'mcp_abilities',
				array(
					'wpcom-mcp/posts-search' => 1,
					'wpcom-mcp/user-sites'   => 0,
				),
				array(
					'wpcom-mcp/posts-search' => array(
						'name'        => 'wpcom-mcp/posts-search',
						'title'       => 'Posts search',
						'description' => 'Search posts',
						'category'    => 'search',
						'type'        => 'tool',
						'enabled'     => true,
					),
					'wpcom-mcp/user-sites'   => array(
						'name'        => 'wpcom-mcp/user-sites',
						'title'       => 'User sites',
						'description' => 'Access user sites',
						'category'    => 'user',
						'type'        => 'resource',
						'enabled'     => false,
					),
				),
			),
		);
	}
}
