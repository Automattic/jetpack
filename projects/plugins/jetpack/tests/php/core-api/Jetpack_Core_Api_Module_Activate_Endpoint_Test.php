<?php

use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/Jetpack_REST_TestCase.php';
require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-offline-mode-features.php';

/**
 * @covers \Jetpack_Core_Json_Api_Endpoints
 */
#[CoversClass( Jetpack_Core_Json_Api_Endpoints::class )]
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

	public function test_module_list_keeps_allowed_partial_module_active_in_offline_mode() {
		$this->set_offline_mode_active_modules( array( 'subscriptions', 'stats' ) );

		try {
			$modules = ( new Jetpack_Core_API_Module_List_Endpoint() )->get_modules();

			$this->assertTrue( $modules['subscriptions']['activated'] );
			$this->assertFalse( $modules['stats']['activated'] );
		} finally {
			$this->reset_offline_mode_active_modules();
		}
	}

	public function test_single_module_keeps_allowed_partial_module_active_in_offline_mode() {
		$this->set_offline_mode_active_modules( array( 'subscriptions', 'stats' ) );

		try {
			$subscriptions = ( new Jetpack_Core_API_Data() )->get_module( $this->create_module_request( 'subscriptions' ) );
			$stats         = ( new Jetpack_Core_API_Data() )->get_module( $this->create_module_request( 'stats' ) );

			$this->assertIsArray( $subscriptions );
			$this->assertIsArray( $stats );
			$this->assertTrue( $subscriptions['activated'] );
			$this->assertFalse( $stats['activated'] );
		} finally {
			$this->reset_offline_mode_active_modules();
		}
	}

	/**
	 * Set up Offline Mode with curated partial loading for module response tests.
	 *
	 * @param array $modules Active modules.
	 */
	private function set_offline_mode_active_modules( $modules ) {
		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );
		add_filter(
			'jetpack_offline_mode_allow_module_loading',
			array( 'Jetpack_Offline_Mode_Features', 'allow_partial_module_in_offline_mode' ),
			10,
			3
		);
		Jetpack::update_active_modules( $modules );
	}

	/**
	 * Create a single-module data request.
	 *
	 * @param string $slug Module slug.
	 * @return WP_REST_Request
	 */
	private function create_module_request( $slug ) {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/module/' . $slug );
		$request->set_param( 'slug', $slug );

		return $request;
	}

	/**
	 * Reset Offline Mode module response test state.
	 */
	private function reset_offline_mode_active_modules() {
		Jetpack::update_active_modules( array() );
		remove_filter(
			'jetpack_offline_mode_allow_module_loading',
			array( 'Jetpack_Offline_Mode_Features', 'allow_partial_module_in_offline_mode' ),
			10
		);
		remove_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();
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
}
