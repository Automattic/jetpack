<?php

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-jetpack-rest-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

class WP_Test_Jetpack_Core_Api_Module_Activate_Endpoint extends WP_Test_Jetpack_REST_Testcase {
	/**
	 * @author zinigor
	 * @covers Jetpack_Core_Json_Api_Endpoints
	 * @dataProvider api_routes
	 */
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

	public function api_routes() {
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
	 * Tests the update of a comment subscription setting in the Jetpack_Core_API_Data::update_data() method.
	 *
	 * @param int         $new_value The new value of the comment subscription setting.
	 * @param string|null $option_value The existing value of the comment subscription option.
	 *
	 * @dataProvider update_comment_subscription_option_data_provider
	 */
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
	public function update_comment_subscription_option_data_provider() {
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
