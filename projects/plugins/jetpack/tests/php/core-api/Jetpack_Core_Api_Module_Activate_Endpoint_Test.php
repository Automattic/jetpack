<?php

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
}
