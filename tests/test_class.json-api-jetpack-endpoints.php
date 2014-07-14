<?php

class WP_Test_Jetpack_Json_Api_endpoints extends WP_UnitTestCase {

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {

		$_SERVER['REQUEST_METHOD'] = 'Get';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';

	}

	public function setUp() {

		parent::setUp();

		$this->set_globals();

		// Force direct method. Running the upgrade via PHPUnit can't detect the correct filesystem method.
		add_filter( 'filesystem_method', array( $this,  'filesystem_method_direct' ) );

		require_once __DIR__ . '/../class.json-api.php';
		require_once __DIR__ . '/../class.json-api-endpoints.php';

	}

	/**
	 * @author lezama
	 * @covers Jetpack_JSON_API_Update_Plugin_Endpoint
	 */
	public function test_Jetpack_JSON_API_Update_Plugin_Endpoint() {

		$endpoint = new Jetpack_JSON_API_Update_Plugin_Endpoint( array(
			'description'     => 'Update a Plugin on your Jetpack Site',
			'group'           => 'plugins',
			'stat'            => 'plugins:1:update',
			'method'          => 'GET',
			'path'            => '/sites/%s/plugins/%s/update/',
			'path_labels' => array(
				'$site'   => '(int|string) The site ID, The site domain',
				'$plugin' => '(string) The plugin file name',
			),
			'response_format' => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
			'example_request_data' => array(
				'headers' => array(
					'authorization' => 'Bearer YOUR_API_TOKEN'
				),
			),
			'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello/update'
		) );

		/**
		 * Changes the Accessibility of the protected upgrade_plugin method.
		 */
		$class = new ReflectionClass('Jetpack_JSON_API_Update_Plugin_Endpoint');
		$upgrade_plugin_method = $class->getMethod( 'upgrade_plugin' );
		$upgrade_plugin_method->setAccessible( true );

		$the_plugin_file = 'the/the.php';
		$the_real_folder = WP_PLUGIN_DIR . '/the';
		$the_real_file = WP_PLUGIN_DIR . '/' . $the_plugin_file;

		/*
		 * Create an oudated version of 'The' plugin
		 */

		// Check if 'The' plugin folder is already there.
		if ( ! file_exists( $the_real_folder ) ) {
			mkdir( $the_real_folder );
			$clean = true;
		}

		file_put_contents( $the_real_file,
			'<?php
			/*
			 * Plugin Name: The
			 * Version: 1.0
			 */'
		);

		// Invoke the upgrade_plugin method.
		$result = $upgrade_plugin_method->invokeArgs( $endpoint, array( $the_plugin_file ) );

		$this->assertArrayHasKey( 'id', $result );

		$this->assertEquals( urlencode( 'the/the' ), $result['id'] );

		if ( isset( $clean ) ) {
			$this->rmdir( $the_real_folder );
		}

	}

	function filesystem_method_direct( $method ) {

		return 'direct';

	}

	function rmdir( $dir ) {

		foreach ( scandir( $dir ) as $file ) {
			if ( is_dir( $file ) )
				continue;
			else unlink( "$dir/$file" );
		}
		rmdir( $dir );

	}

}
