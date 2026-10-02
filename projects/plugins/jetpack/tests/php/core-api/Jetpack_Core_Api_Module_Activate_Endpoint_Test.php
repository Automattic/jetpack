<?php

use Automattic\Jetpack\Newsletter\Onboarding_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/Jetpack_REST_TestCase.php';

/**
 * @covers \Jetpack_Core_Json_Api_Endpoints
 * @covers \Jetpack_Core_API_Data
 */
#[CoversClass( Jetpack_Core_Json_Api_Endpoints::class )]
#[CoversClass( Jetpack_Core_API_Data::class )]
class Jetpack_Core_Api_Module_Activate_Endpoint_Test extends Jetpack_REST_TestCase {
	/**
	 * Direct update_data() tests bypass the permission callback that guards the endpoint in production.
	 */
	public function set_up() {
		parent::set_up();

		wp_set_current_user(
			self::factory()->user->create( array( 'role' => 'administrator' ) )
		);
	}

	public function tear_down() {
		foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
			delete_option( Onboarding_Controller::get_option_name( $step_id ) );
		}
		delete_option( Onboarding_Controller::FIELD_NAME );
		delete_option( 'jetpack_blocks_disabled' );
		parent::tear_down();
	}

	/**
	 * @author zinigor
	 * @dataProvider api_routes
	 */
	#[DataProvider( 'api_routes' )]
	public function test_register_routes( $route_string = false, $method = false, $classname = false ) {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( $route_string, $routes );

		$route = array();
		foreach ( $routes[ $route_string ] as $item ) {
			if ( isset( $item['methods'][ $method ] ) ) {
				$route = $item;
				break;
			}
		}

		$this->assertInstanceOf(
			$classname,
			$route['callback'][0],
			"process method object should be an instance of the $classname class"
		);
		$this->assertInstanceOf(
			$classname,
			$route['permission_callback'][0],
			"permission method object should be an instance of the $classname class"
		);
	}

	public static function api_routes() {
		return array(
			array( '/jetpack/v4/module/all', 'GET', 'Jetpack_Core_API_Module_List_Endpoint' ),
			array( '/jetpack/v4/module/all/active', 'POST', 'Jetpack_Core_API_Module_List_Endpoint' ),
			array( '/jetpack/v4/module/(?P<slug>[a-z\-]+)', 'GET', 'Jetpack_Core_API_Data' ),
			array( '/jetpack/v4/module/(?P<slug>[a-z\-]+)', 'POST', 'Jetpack_Core_API_Data' ),
			array( '/jetpack/v4/module/(?P<slug>[a-z\-]+)/data', 'GET', 'Jetpack_Core_API_Module_Data_Endpoint' ),
			array( '/jetpack/v4/module/(?P<slug>[a-z\-]+)/active', 'POST', 'Jetpack_Core_API_Module_Toggle_Endpoint' ),
			array( '/jetpack/v4/settings', 'GET', 'Jetpack_Core_API_Data' ),
			array( '/jetpack/v4/settings', 'POST', 'Jetpack_Core_API_Data' ),
			array( '/jetpack/v4/settings/(?P<slug>[a-z\-]+)', 'POST', 'Jetpack_Core_API_Data' ),
		);
	}

	/**
	 * Tests that the default value is used for settings returned by the Jetpack_Core_API_Data::get_all_options() method.
	 */
	public function test_options_use_defaults_when_not_set() {
		// wpcom_reader_views_enabled should default to true when not set.
		// @see Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list
		$option_name = 'wpcom_reader_views_enabled';

		// Make sure the option is not present.
		delete_option( $option_name );

		$endpoint = new Jetpack_Core_API_Data();
		$settings = $endpoint->get_all_options();

		$this->assertTrue( isset( $settings->data[ $option_name ] ) );
		$this->assertTrue( $settings->data[ $option_name ] );
	}

	public function test_newsletter_skip_setting_is_in_v4_registry_schema() {
		$settings = Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list( 'any' );
		$setting  = $settings[ Onboarding_Controller::FIELD_NAME ];

		$this->assertSame( 'array', $setting['type'] );
		$this->assertSame( array(), $setting['default'] );
		$this->assertSame( 'settings', $setting['jp_group'] );
		$this->assertSame( Onboarding_Controller::STEP_IDS, $setting['items']['enum'] );
		$this->assertTrue( is_callable( $setting['validate_callback'] ) );
		$this->assertArrayHasKey(
			Onboarding_Controller::FIELD_NAME,
			Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list( 'settings' )
		);

		$routes     = $this->server->get_routes();
		$post_route = array();
		foreach ( $routes['/jetpack/v4/settings'] as $route ) {
			if ( isset( $route['methods']['POST'] ) ) {
				$post_route = $route;
				break;
			}
		}
		$this->assertArrayHasKey( Onboarding_Controller::FIELD_NAME, $post_route['args'] );
	}

	public function test_v4_settings_get_projects_skip_options_without_writing_defaults() {
		$setting_name = Onboarding_Controller::FIELD_NAME;
		$settings     = ( new Jetpack_Core_API_Data() )->get_all_options()->get_data();

		$this->assertSame( array(), $settings[ $setting_name ] );
		$this->assertFalse( get_option( $setting_name, false ) );
		foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
			$this->assertFalse( get_option( Onboarding_Controller::get_option_name( $step_id ), false ) );
		}

		add_option( Onboarding_Controller::get_option_name( 'send_newsletter' ), true, '', false );
		add_option( Onboarding_Controller::get_option_name( 'subscribe_form' ), true, '', false );
		$settings = ( new Jetpack_Core_API_Data() )->get_all_options()->get_data();

		$this->assertSame( array( 'subscribe_form', 'send_newsletter' ), $settings[ $setting_name ] );
		$this->assertFalse( get_option( $setting_name, false ) );
	}

	public function test_v4_settings_post_adds_skips_and_empty_update_does_not_clear_them() {
		$setting_name = Onboarding_Controller::FIELD_NAME;
		$request      = new WP_REST_Request();
		$request->set_body_params( array( $setting_name => array( 'send_newsletter', 'subscribers' ) ) );

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array( 'subscribers', 'send_newsletter' ), $result->get_data()[ $setting_name ] );
		foreach ( array( 'subscribers', 'send_newsletter' ) as $step_id ) {
			$this->assertTrue( (bool) get_option( Onboarding_Controller::get_option_name( $step_id ) ) );
		}
		$this->assertFalse( get_option( $setting_name, false ) );
		wp_cache_delete( 'alloptions', 'options' );
		foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
			$this->assertArrayNotHasKey( Onboarding_Controller::get_option_name( $step_id ), wp_load_alloptions() );
		}

		$request = new WP_REST_Request();
		$request->set_body_params( array( $setting_name => array() ) );
		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array( 'subscribers', 'send_newsletter' ), $result->get_data()[ $setting_name ] );
	}

	public function test_v4_settings_post_rejects_mixed_valid_and_invalid_skip_ids_before_writing() {
		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				Onboarding_Controller::FIELD_NAME => array( 'subscribe_form', 'invalid_step' ),
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
			$this->assertFalse( get_option( Onboarding_Controller::get_option_name( $step_id ), false ) );
		}
		$this->assertFalse( get_option( Onboarding_Controller::FIELD_NAME, false ) );
	}

	public function test_v4_settings_route_rejects_invalid_skip_ids_before_updating_other_settings() {
		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_admin_page' );
		$user->add_cap( 'jetpack_configure_modules' );
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/settings' );
		$request->set_body_params(
			array(
				'jetpack_blocks_disabled'             => true,
				Onboarding_Controller::FIELD_NAME => array( 'subscribe_form', 'invalid_step' ),
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertFalse( get_option( 'jetpack_blocks_disabled', false ) );
		foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
			$this->assertFalse( get_option( Onboarding_Controller::get_option_name( $step_id ), false ) );
		}
	}

	public function test_v4_settings_post_returns_individual_option_write_errors() {
		$failed_option = Onboarding_Controller::get_option_name( 'subscribe_form' );
		add_option( $failed_option, false, '', false );
		$request = new WP_REST_Request();
		$request->set_body_params( array( Onboarding_Controller::FIELD_NAME => array( 'subscribe_form' ) ) );

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'newsletter_onboarding_skip_write_failed', $result->get_error_code() );
		$this->assertSame( 500, $result->get_error_data()['status'] );
		$this->assertFalse( get_option( Onboarding_Controller::FIELD_NAME, false ) );
	}

	public function test_newsletter_skip_options_are_isolated_per_site() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test requires the Jetpack multisite test suite.' );
		}

		$main_site_id = get_current_blog_id();
		$site_id      = self::factory()->blog->create();
		$this->assertNotSame( $main_site_id, $site_id );

		try {
			switch_to_blog( $site_id );
			$this->assertSame( array(), Onboarding_Controller::get_skipped_steps() );
			$this->assertSame( array( 'subscribers' ), Onboarding_Controller::add_skipped_steps( array( 'subscribers' ) ) );
		} finally {
			restore_current_blog();
			wpmu_delete_blog( $site_id, true );
		}

		$this->assertSame( array(), Onboarding_Controller::get_skipped_steps() );
	}

	public function test_v4_settings_capabilities_match_the_existing_endpoint() {
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$user    = get_user_by( 'id', $user_id );
		wp_set_current_user( $user_id );

		$endpoint = new Jetpack_Core_API_Data();
		$get       = new WP_REST_Request( 'GET', '/jetpack/v4/settings/' );
		$post      = new WP_REST_Request( 'POST', '/jetpack/v4/settings' );

		$this->assertFalse( $endpoint->can_request( $get ) );
		$this->assertFalse( $endpoint->can_request( $post ) );

		$user->add_cap( 'jetpack_admin_page' );
		$this->assertTrue( $endpoint->can_request( $get ) );
		$this->assertFalse( $endpoint->can_request( $post ) );

		$user->add_cap( 'jetpack_configure_modules' );
		$this->assertTrue( $endpoint->can_request( $post ) );
	}

	/**
	 * Every `jetpack_waf_*` option, plus the Protect options carrying the same data.
	 *
	 * `jetpack_protect_global_whitelist` is populated from `jetpack_waf_ip_allow_list`,
	 * and `jetpack_protect_key` is a shared secret.
	 */
	public static function restricted_options() {
		return array(
			'automatic rules'    => array( 'jetpack_waf_automatic_rules' ),
			'block list enabled' => array( 'jetpack_waf_ip_block_list_enabled' ),
			'block list'         => array( 'jetpack_waf_ip_block_list' ),
			'allow list enabled' => array( 'jetpack_waf_ip_allow_list_enabled' ),
			'allow list'         => array( 'jetpack_waf_ip_allow_list' ),
			'share data'         => array( 'jetpack_waf_share_data' ),
			'share debug data'   => array( 'jetpack_waf_share_debug_data' ),
			'protect key'        => array( 'jetpack_protect_key' ),
			'protect allow list' => array( 'jetpack_protect_global_whitelist' ),
		);
	}

	/**
	 * Tests that firewall settings are stripped for users without `manage_options`.
	 *
	 * @dataProvider restricted_options
	 *
	 * @param string $option The option name.
	 */
	#[DataProvider( 'restricted_options' )]
	public function test_restricted_options_hidden_from_non_admins( $option ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'contributor' ) ) );

		$settings = ( new Jetpack_Core_API_Data() )->get_all_options()->get_data();

		$this->assertArrayHasKey( 'wpcom_reader_views_enabled', $settings );
		$this->assertArrayNotHasKey( $option, $settings );
	}

	/**
	 * Tests that firewall settings are still returned to administrators.
	 *
	 * @dataProvider restricted_options
	 *
	 * @param string $option The option name.
	 */
	#[DataProvider( 'restricted_options' )]
	public function test_restricted_options_returned_to_admins( $option ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$settings = ( new Jetpack_Core_API_Data() )->get_all_options()->get_data();

		$this->assertArrayHasKey( $option, $settings );
	}

	/**
	 * Tests updating an option that doesn't currently exist with a value of false.
	 *
	 * The Core function update_option will not work with the boolean false value, so it needs to be coerced
	 * into null or 0.
	 */
	public function test_update_boolean_option_when_first_value_is_false() {
		// wpcom_reader_views_enabled defaults to true, so it's first saved value will normally be false.
		$option_name = 'wpcom_reader_views_enabled';

		// Make sure the option is not present.
		delete_option( $option_name );

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				$option_name => false,
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'success', $result->get_data()['code'] );
		$this->assertSame( 0, get_option( $option_name ) );
	}

	/**
	 * Tests the update of a comment subscription setting in the Jetpack_Core_API_Data::update_data() method.
	 *
	 * @param int         $new_value The new value of the comment subscription setting.
	 * @param string|null $option_value The existing value of the comment subscription option.
	 *
	 * @dataProvider update_comment_subscription_option_data_provider
	 */
	#[DataProvider( 'update_comment_subscription_option_data_provider' )]
	public function test_update_data_comment_subscription_option( $new_value, $option_value ) {
		$option_name = 'stb_enabled';
		delete_option( $option_name );

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				$option_name => $new_value,
			)
		);

		if ( null !== $option_value ) {
			update_option( $option_name, $option_value );
		}

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertInstanceOf( WP_REST_Response::class, $result );
		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'success', $result->get_data()['code'] );
	}

	/**
	 * The data provider for test_update_data_comment_subscription_option.
	 *
	 * @return array The test data array:
	 *   [
	 *     'new_value' => The new value of the comment subscription setting,
	 *     'option_value' => The existing value of the comment subscription option
	 *   ]
	 */
	public static function update_comment_subscription_option_data_provider() {
		return array(
			'new value: int 1, option: no option' => array(
				'new_value'    => 1,
				'option_value' => null,
			),
			'new value: int 0, option: 1'         => array(
				'new_value'    => 0,
				'option_value' => '1',
			),
			'new value: int 1, option: 0'         => array(
				'new_value'    => 1,
				'option_value' => '0',
			),
			'new value: int 1, option: 1'         => array(
				'new_value'    => 1,
				'option_value' => '1',
			),
			'new value: int 0, option: 0'         => array(
				'new_value'    => 0,
				'option_value' => '0',
			),
			'new value: int 0, option: no option' => array(
				'new_value'    => 0,
				'option_value' => null,
			),
		);
	}

	// ──────────────────────────────────────────────────
	// subscription_options write path
	// ──────────────────────────────────────────────────

	/**
	 * Seed `subscription_options` with a known full set so each test can verify
	 * merge / trim / allowlist behaviour against a deterministic baseline.
	 */
	private function seed_subscription_options() {
		update_option(
			'subscription_options',
			array(
				'invitation'              => 'Existing invitation',
				'comment_follow'          => 'Existing comment follow',
				'welcome'                 => 'Existing welcome',
				'subscribe_modal_heading' => 'Existing heading',
			)
		);
	}

	public function test_update_data_subscription_options_strips_unknown_keys() {
		$this->seed_subscription_options();

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				'subscription_options' => array(
					'subscribe_modal_heading' => 'Updated heading',
					'evil_key'                => 'should be dropped',
					'arbitrary'               => 'also dropped',
				),
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$stored = get_option( 'subscription_options' );
		$this->assertArrayNotHasKey( 'evil_key', $stored );
		$this->assertArrayNotHasKey( 'arbitrary', $stored );
		$this->assertSame( 'Updated heading', $stored['subscribe_modal_heading'] );
	}

	public function test_update_data_subscription_options_trims_whitespace_only_modal_heading() {
		// Pre-seed with a non-empty heading so the post-trim '' is a meaningful
		// change and survives the same-value short-circuit in the endpoint.
		$this->seed_subscription_options();

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				'subscription_options' => array(
					'subscribe_modal_heading' => "   \n\t  ",
				),
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$stored = get_option( 'subscription_options' );
		$this->assertSame( '', $stored['subscribe_modal_heading'] );
	}

	public function test_update_data_subscription_options_merges_with_existing() {
		$this->seed_subscription_options();

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				'subscription_options' => array(
					'subscribe_modal_heading' => 'Brand new heading',
				),
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$stored = get_option( 'subscription_options' );
		$this->assertSame( 'Brand new heading', $stored['subscribe_modal_heading'] );
		$this->assertSame( 'Existing invitation', $stored['invitation'] );
		$this->assertSame( 'Existing welcome', $stored['welcome'] );
		$this->assertSame( 'Existing comment follow', $stored['comment_follow'] );
	}

	public function test_update_data_subscription_options_strips_disallowed_html() {
		$this->seed_subscription_options();

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				'subscription_options' => array(
					// `<script>` is disallowed, but `wp_kses` only strips the
					// tags — it keeps the text content. Use an empty-content
					// `<iframe>` so the post-kses string is unambiguous.
					'subscribe_modal_heading' => '<iframe src="evil"></iframe>Subscribe today',
				),
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$stored = get_option( 'subscription_options' );
		$this->assertStringNotContainsString( '<iframe', $stored['subscribe_modal_heading'] );
		$this->assertSame( 'Subscribe today', $stored['subscribe_modal_heading'] );
	}

	public function test_update_data_subscription_options_free_tier_description_strips_html() {
		$this->seed_subscription_options();

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				'subscription_options' => array(
					// The free tier description stores plain markdown source, so all
					// HTML tags are stripped via `wp_kses( ..., array() )`. kses removes
					// the tags themselves but keeps their text content, so the `<script>`
					// wrapper is gone while the inner `alert(1)` text remains.
					'free_tier_description' => '<script>alert(1)</script>Just the **markdown** text',
				),
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$stored = get_option( 'subscription_options' );
		$this->assertStringNotContainsString( '<script', $stored['free_tier_description'] );
		$this->assertSame( 'alert(1)Just the **markdown** text', $stored['free_tier_description'] );
	}

	/**
	 * A non-scalar `free_tier_description` (e.g. an array from a malformed JSON
	 * payload) must be dropped rather than passed to wp_kses()/mb_substr(), which
	 * would fatal on PHP 8+.
	 *
	 * @return void
	 */
	public function test_update_data_subscription_options_free_tier_description_ignores_non_scalar() {
		$this->seed_subscription_options();

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				'subscription_options' => array(
					'free_tier_description' => array( 'unexpected', 'array' ),
				),
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$stored = get_option( 'subscription_options' );
		$this->assertArrayNotHasKey( 'free_tier_description', $stored );
	}

	public function test_update_data_subscription_options_free_tier_description_is_length_capped() {
		$this->seed_subscription_options();

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				'subscription_options' => array(
					'free_tier_description' => str_repeat( 'a', 600 ),
				),
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$stored = get_option( 'subscription_options' );
		$this->assertSame( 500, strlen( $stored['free_tier_description'] ) );
	}

	/**
	 * @dataProvider provider_hide_free_tier_values
	 *
	 * @param mixed $input    The raw `hide_free_tier` value sent in the request.
	 * @param bool  $expected The boolean value expected to be stored.
	 */
	#[DataProvider( 'provider_hide_free_tier_values' )]
	public function test_update_data_subscription_options_hide_free_tier_is_boolean( $input, $expected ) {
		$this->seed_subscription_options();

		$request = new WP_REST_Request();
		$request->set_body_params(
			array(
				'subscription_options' => array(
					'hide_free_tier' => $input,
				),
			)
		);

		$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

		$this->assertSame( 200, $result->get_status() );
		$stored = get_option( 'subscription_options' );
		$this->assertSame( $expected, $stored['hide_free_tier'] );
	}

	/**
	 * Stringy booleans (e.g. "false", "0") must be interpreted by value, not by
	 * truthiness — `rest_sanitize_boolean()` handles this. A plain `! empty()`
	 * would incorrectly treat "false"/"0" as `true`.
	 *
	 * @return array[]
	 */
	public static function provider_hide_free_tier_values() {
		return array(
			'real true'    => array( true, true ),
			'real false'   => array( false, false ),
			'integer one'  => array( 1, true ),
			'integer zero' => array( 0, false ),
			'string true'  => array( 'true', true ),
			'string false' => array( 'false', false ),
			'string one'   => array( '1', true ),
			'string zero'  => array( '0', false ),
		);
	}

	/**
	 * Front-page descriptions use the SEO utility so grandfathered sites keep
	 * writing the legacy option and retain its 300-character contract.
	 */
	public function test_update_data_front_page_description_uses_seo_utility() {
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );
		update_option( Jetpack_SEO_Utils::LEGACY_META_OPTION, 'Legacy description.' );
		delete_option( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION );

		try {
			$description = str_repeat( 'a', 350 );
			$request     = new WP_REST_Request();
			$request->set_body_params(
				array( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION => $description )
			);

			$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

			$this->assertSame( 200, $result->get_status() );
			$this->assertSame( str_repeat( 'a', 300 ), get_option( Jetpack_SEO_Utils::LEGACY_META_OPTION ) );
			$this->assertSame( false, get_option( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION ) );
			$this->assertSame(
				str_repeat( 'a', 300 ),
				$result->get_data()[ Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION ]
			);

			// Repeating the stored value and clearing it are both successful even
			// though update_front_page_meta_description() returns '' for those cases.
			foreach ( array( str_repeat( 'a', 300 ), '' ) as $value ) {
				$request = new WP_REST_Request();
				$request->set_body_params(
					array( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION => $value )
				);
				$result = ( new Jetpack_Core_API_Data() )->update_data( $request );

				$this->assertSame( 200, $result->get_status() );
				$this->assertSame( $value, $result->get_data()[ Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION ] );
			}

			$this->assertSame( '', get_option( Jetpack_SEO_Utils::LEGACY_META_OPTION ) );
		} finally {
			remove_filter( 'jetpack_disable_seo_tools', '__return_true' );
			delete_option( Jetpack_SEO_Utils::LEGACY_META_OPTION );
			delete_option( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION );
		}
	}
}
