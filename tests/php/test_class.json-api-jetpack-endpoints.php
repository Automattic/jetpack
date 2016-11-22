<?php
/**
 * @group external-http
 */
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

		require_once dirname( __FILE__ ) . '/../../class.json-api.php';
		require_once dirname( __FILE__ ) . '/../../class.json-api-endpoints.php';
	}

	/**
	 * @author lezama
	 * @covers Jetpack_JSON_API_Plugins_Modify_Endpoint
	 * @requires PHP 5.3.2
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

	/**
	 * @author tonykova
	 * @covers Jetpack_API_Plugins_Install_Endpoint
	 * @requires PHP 5.3.2
	 */
	public function test_Jetpack_API_Plugins_Install_Endpoint() {
		$endpoint = new Jetpack_JSON_API_Plugins_Install_Endpoint( array(
			'stat'            => 'plugins:1:new',
			'method'          => 'POST',
			'path'            => '/sites/%s/plugins/new',
			'path_labels' => array(
				'$site'   => '(int|string) The site ID, The site domain',
			),
			'request_format' => array(
				'plugin'       => '(string) The plugin slug.'
			),
			'response_format' => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
			'example_request_data' => array(
				'headers' => array(
					'authorization' => 'Bearer YOUR_API_TOKEN'
				),
				'body' => array(
					'plugin' => 'buddypress'
				)
			),
			'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/new'
		) );

		$the_plugin_file = 'the/the.php';
		$the_real_folder = WP_PLUGIN_DIR . '/the';
		$the_real_file = WP_PLUGIN_DIR . '/' . $the_plugin_file;
		$the_plugin_slug = 'the';

		// Check if 'The' plugin folder is already there.
		if ( file_exists( $the_real_folder ) ) {
			$this->markTestSkipped( 'The plugin the test tries to install (the) is already installed. Skipping.' );
		}

		$class = new ReflectionClass('Jetpack_JSON_API_Plugins_Install_Endpoint');

		$plugins_property = $class->getProperty( 'plugins' );
		$plugins_property->setAccessible( true );
		$plugins_property->setValue ( $endpoint , array( $the_plugin_slug ) );

		$validate_plugins_method = $class->getMethod( 'validate_plugins' );
		$validate_plugins_method->setAccessible( true );
		$result = $validate_plugins_method->invoke( $endpoint );
		$this->assertTrue( $result );

		$install_plugin_method = $class->getMethod( 'install' );
		$install_plugin_method->setAccessible( true );

		$result = $install_plugin_method->invoke( $endpoint );

		$this->assertTrue( $result );
		$this->assertTrue( file_exists( $the_real_folder ) );

		// Clean up
		$this->rmdir( $the_real_folder );
	}

	/**
	 * @author wpbenyamin
	 * @covers Jetpack_JSON_API_Export_Endpoint
	 * @requires PHP 5.3.2
	 */
	public function test_Jetpack_JSON_API_Export_Endpoint() {
		$endpoint = new Jetpack_JSON_API_Plugins_Install_Endpoint( array(
			'method' => 'POST',
			'description' => 'Export site data.',
			'group' => '__do_not_document',
			'stat' => 'export',
			'path' => '/sites/%s/export',
			'path_labels' => array(
				'$site' => '(int|string) Site ID or domain',
			),
			'request_format' => array(
				'content'               => '(string=all) The content to export',
				'cat'                   => '(integer=0) The Id of the category to export',
				'post_author'           => '(integer=0) The Id of the author to export his posts',
				'post_start_date'       => '(string=0) The start month of posts to export. Format: YYYY-MM',
				'post_end_date'         => '(string=0) The end month of posts to export. Format: YYYY-MM',
				'post_status'           => '(string=0) The status of the posts to export',
				'page_author'           => '(integer=0) The Id of the author to export his pages',
				'page_start_date'       => '(string=0) The start month of pages to export. Format: YYYY-MM',
				'page_end_date'         => '(string=0) The end month of pages to export. Format: YYYY-MM',
				'page_status'           => '(string=0) The status of the pages to export',
				'attachment_start_date' => '(string=0) The start month of media to export. Format: YYYY-MM',
				'attachment_end_date'   => '(string=0) The end month of media to export. Format: YYYY-MM',
			),
			'response_format' => array(
				'status'        => '(string) The status of the export. Values are success|fail',
				'download_url'  => '(string) The URL of the export file to download from the Jetpack site.'
			),
			'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/export',
			'example_request_data' => array(
				'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
				'body' => array(
					'content'               => 'all',
					'cat'                   => '0',
					'post_author'           => '0',
					'post_start_date'       => '0',
					'post_end_date'         => '0',
					'post_status'           => '0',
					'page_author'           => '0',
					'page_start_date'       => '0',
					'page_end_date'         => '0',
					'page_status'           => '0',
					'attachment_start_date' => '0',
					'attachment_end_date'   => '0',
				),
			),
		) );
		$class = new ReflectionClass('Jetpack_JSON_API_Export_Endpoint');
		$result_method = $class->getMethod( 'result' );
		$result_method->setAccessible( true );
		$result = $result_method->invoke( $endpoint );
		$expectedResult =  array(
			'status'        => 'success',
			'download_url'  => 'uploads/2016/11/21/export.zip'
		);

		$this->assertEqual( $result, $expectedResult );

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
