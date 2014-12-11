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

		require_once dirname( __FILE__ ) . '/../class.json-api.php';
		require_once dirname( __FILE__ ) . '/../class.json-api-endpoints.php';

	}

	/**
	 * @author lezama
	 * @covers Jetpack_JSON_API_Plugins_Modify_Endpoint
	 */
	public function test_Jetpack_JSON_API_Plugins_Modify_Endpoint() {

		$endpoint = new Jetpack_JSON_API_Plugins_Modify_Endpoint( array(
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
		$class = new ReflectionClass('Jetpack_JSON_API_Plugins_Modify_Endpoint');
		$update_plugin_method = $class->getMethod( 'update' );
		$update_plugin_method->setAccessible( true );

		$plugin_property = $class->getProperty( 'plugins' );
		$plugin_property->setAccessible( true );
		$plugin_property->setValue ( $endpoint , array( 'the/the.php' ) );

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
		$result = $update_plugin_method->invoke( $endpoint );

		$this->assertTrue( $result );

		if ( isset( $clean ) ) {
			$this->rmdir( $the_real_folder );
		}

	}

//	/**
//	 * @author lezama
//	 * @covers Jetpack_JSON_API_Core_Update_Endpoint
//   * WARNING: this test downgrades and upgrades core, things could go wrong :)
//	 */
//	public function test_Jetpack_JSON_API_Core_Update_Endpoint() {
//
//		$endpoint = new Jetpack_JSON_API_Core_Update_Endpoint( array(
//			'description'     => 'Update WordPress installation on a Jetpack blog',
//			'method'          => 'POST',
//			'path'            => '/sites/%s/core/update',
//			'stat'            => 'core:update',
//			'path_labels' => array(
//				'$site' => '(int|string) The site ID, The site domain'
//			),
//			'request_format' => array(
//				'version'   => '(string) The core version to update',
//			),
//			'response_format' => array(
//				'version' => '(string) The core version after the upgrade has run.',
//				'log'     => '(array:safehtml) An array of log strings.',
//			),
//			'example_request_data' => array(
//				'headers' => array(
//					'authorization' => 'Bearer YOUR_API_TOKEN'
//				),
//			),
//			'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/core/update'
//		) );
//
//		/**
//		 * Changes the Accessibility of the protected update_core method.
//		 */
//		$class = new ReflectionClass('Jetpack_JSON_API_Core_Update_Endpoint');
//		$update_core_method = $class->getMethod( 'update_core' );
//		$update_core_method->setAccessible( true );
//
//		$version_file = ABSPATH . WPINC . '/version.php';
//
//		include( ABSPATH . WPINC . '/version.php' ); // $wp_version; // x.y.z
//
//		$current_version = floatval( implode( '.', array_slice( preg_split( '/[.-]/', $wp_version  ), 0, 2 ) ) );
//		$previous_version = number_format( $current_version - 0.1, 1 );
//
//		$lines = file( $version_file );
//		$file_contents = '';
//		foreach( $lines as $line ) {
//			// Downgrade the $wp_version number.
//			if( strpos( $line, '$wp_version' ) === 0 )
//				$line = '$wp_version = ' . $previous_version . ';' . "\n";
//			$file_contents .= $line;
//		}
//		file_put_contents( $version_file, $file_contents );
//
//		$locale = get_locale();
//
//		// Invoke the update_core method.
//
//		$result = $update_core_method->invokeArgs( $endpoint, array( false, $locale ) );
//
//		$this->assertEquals( number_format( round( floatval( $result ), 1 ), 1 ),  number_format( $current_version, 1 ) );
//
//	}

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
