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
}
