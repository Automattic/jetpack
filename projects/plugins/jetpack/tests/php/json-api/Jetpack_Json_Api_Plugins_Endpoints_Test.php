<?php

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * @covers \Jetpack_JSON_API_Plugins_Install_Endpoint
 * @covers \Jetpack_JSON_API_Plugins_Modify_Endpoint
 */
#[CoversClass( Jetpack_JSON_API_Plugins_Install_Endpoint::class )]
#[CoversClass( Jetpack_JSON_API_Plugins_Modify_Endpoint::class )]
class Jetpack_Json_Api_Plugins_Endpoints_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private static $super_admin_user_id;
	private $the_plugin_lock;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$super_admin_user_id = $factory->user->create( array( 'role' => 'administrator' ) );
		grant_super_admin( self::$super_admin_user_id );
	}

	/**
	 * Set up.
	 */
	public function set_up() {
		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();

		$this->set_globals();

		// Force direct method. Running the upgrade via PHPUnit can't detect the correct filesystem method.
		add_filter( 'filesystem_method', array( $this, 'filesystem_method_direct' ) );
	}

	public function tear_down() {
		if ( $this->the_plugin_lock ) {
			$this->remove_the_plugin();
		}
	}

	private function install_the_plugin() {
		// For CI coverage tests, use a lock file to avoid multiple copies of this test from interfering with each other.
		if ( getenv( 'PHPUNIT_JETPACK_TESTSUITE_IS_PARALLEL' ) === 'true' && ! $this->the_plugin_lock ) {
			$this->the_plugin_lock = fopen( WP_PLUGIN_DIR . '/.thepluginlock', 'c+' );
			if ( ! $this->the_plugin_lock ) {
				throw new RuntimeException( 'Failed to open lockfile ' . WP_PLUGIN_DIR . '/.thepluginlock' );
			}
			if ( ! flock( $this->the_plugin_lock, LOCK_EX ) ) {
				throw new RuntimeException( 'Failed to lock lockfile ' . WP_PLUGIN_DIR . '/.thepluginlock' );
			}
		}

		$the_plugin_file = 'the/the.php';
		$the_real_folder = WP_PLUGIN_DIR . '/the';
		$the_real_file   = WP_PLUGIN_DIR . '/' . $the_plugin_file;

		/*
		 * Create an oudated version of 'The' plugin
		 */

		// Check if 'The' plugin folder is already there.
		if ( ! file_exists( $the_real_folder ) ) {
			mkdir( $the_real_folder );
		}
		file_put_contents(
			$the_real_file,
			'<?php
			/*
			 * Plugin Name: The
			 * Version: 1.0
			 */'
		);
	}

	private function remove_the_plugin() {
		$the_real_folder = WP_PLUGIN_DIR . '/the';
		if ( file_exists( $the_real_folder ) ) {
			static::rmdir( $the_real_folder );
		}

		if ( $this->the_plugin_lock ) {
			fclose( $this->the_plugin_lock );
			$this->the_plugin_lock = null;
		}
	}

	/**
	 * @author lezama
	 * @group external-http
	 */
	#[Group( 'external-http' )]
	public function test_Jetpack_JSON_API_Plugins_Modify_Endpoint() {
		$endpoint = new Jetpack_JSON_API_Plugins_Modify_Endpoint(
			array(
				'description'          => 'Update a Plugin on your Jetpack Site',
				'group'                => 'plugins',
				'stat'                 => 'plugins:1:update',
				'method'               => 'GET',
				'path'                 => '/sites/%s/plugins/%s/update/',
				'path_labels'          => array(
					'$site'   => '(int|string) The site ID, The site domain',
					'$plugin' => '(string) The plugin file name',
				),
				'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
				'example_request_data' => array(
					'headers' => array(
						'authorization' => 'Bearer YOUR_API_TOKEN',
					),
				),
				'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello/update',
			)
		);

		/**
		 * Changes the Accessibility of the protected upgrade_plugin method.
		 */
		$class                = new ReflectionClass( 'Jetpack_JSON_API_Plugins_Modify_Endpoint' );
		$update_plugin_method = $class->getMethod( 'update' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$update_plugin_method->setAccessible( true );
		}

		$plugin_property = $class->getProperty( 'plugins' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$plugin_property->setAccessible( true );
		}
		$plugin_property->setValue( $endpoint, array( 'the/the.php' ) );

		$this->install_the_plugin();

		// Invoke the upgrade_plugin method.
		$result = $update_plugin_method->invoke( $endpoint );

		$this->remove_the_plugin();

		$this->assertTrue( $result );
	}

	/**
	 * Verify plugin update endpoint adheres to lock.
	 *
	 * @author mdbitz
	 * @group external-http
	 */
	#[Group( 'external-http' )]
	public function test_Jetpack_JSON_API_Plugins_Modify_Endpoint_locked() {
		$endpoint = new Jetpack_JSON_API_Plugins_Modify_Endpoint(
			array(
				'description'          => 'Update a Plugin on your Jetpack Site',
				'group'                => 'plugins',
				'stat'                 => 'plugins:1:update',
				'method'               => 'GET',
				'path'                 => '/sites/%s/plugins/%s/update/',
				'path_labels'          => array(
					'$site'   => '(int|string) The site ID, The site domain',
					'$plugin' => '(string) The plugin file name',
				),
				'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
				'example_request_data' => array(
					'headers' => array(
						'authorization' => 'Bearer YOUR_API_TOKEN',
					),
				),
				'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello/update',
			)
		);

		/**
		 * Changes the Accessibility of the protected upgrade_plugin method.
		 */
		$class                = new ReflectionClass( 'Jetpack_JSON_API_Plugins_Modify_Endpoint' );
		$update_plugin_method = $class->getMethod( 'update' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$update_plugin_method->setAccessible( true );
		}

		$plugin_property = $class->getProperty( 'plugins' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$plugin_property->setAccessible( true );
		}
		$plugin_property->setValue( $endpoint, array( 'the/the.php' ) );

		$this->install_the_plugin();

		// Obtain lock.
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		Constants::set_constant( 'JETPACK_PLUGIN_AUTOUPDATE', true );
		WP_Upgrader::create_lock( 'auto_updater' );

		// Invoke the upgrade_plugin method.
		$result = $update_plugin_method->invoke( $endpoint );

		// Release lock.
		WP_Upgrader::release_lock( 'auto_updater' );
		Constants::set_constant( 'JETPACK_PLUGIN_AUTOUPDATE', false );
		// clean up.
		$this->remove_the_plugin();

		$this->assertTrue( is_wp_error( $result ) );
	}

	/**
	 * Verify plugin update endpoint ignores auto_updater lock if not an autoupdate request.
	 *
	 * @author mdbitz
	 * @group external-http
	 */
	#[Group( 'external-http' )]
	public function test_Jetpack_JSON_API_Plugins_Modify_Endpoint_locked_not_autoupdate() {
		$endpoint = new Jetpack_JSON_API_Plugins_Modify_Endpoint(
			array(
				'description'          => 'Update a Plugin on your Jetpack Site',
				'group'                => 'plugins',
				'stat'                 => 'plugins:1:update',
				'method'               => 'GET',
				'path'                 => '/sites/%s/plugins/%s/update/',
				'path_labels'          => array(
					'$site'   => '(int|string) The site ID, The site domain',
					'$plugin' => '(string) The plugin file name',
				),
				'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
				'example_request_data' => array(
					'headers' => array(
						'authorization' => 'Bearer YOUR_API_TOKEN',
					),
				),
				'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello/update',
			)
		);

		/**
		 * Changes the Accessibility of the protected upgrade_plugin method.
		 */
		$class                = new ReflectionClass( 'Jetpack_JSON_API_Plugins_Modify_Endpoint' );
		$update_plugin_method = $class->getMethod( 'update' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$update_plugin_method->setAccessible( true );
		}

		$plugin_property = $class->getProperty( 'plugins' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$plugin_property->setAccessible( true );
		}
		$plugin_property->setValue( $endpoint, array( 'the/the.php' ) );

		$this->install_the_plugin();

		// Obtain lock.
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		Constants::set_constant( 'JETPACK_PLUGIN_AUTOUPDATE', false );
		WP_Upgrader::create_lock( 'auto_updater' );

		// Invoke the upgrade_plugin method.
		$result = $update_plugin_method->invoke( $endpoint );

		// Release lock.
		WP_Upgrader::release_lock( 'auto_updater' );

		// clean up.
		$this->remove_the_plugin();

		$this->assertTrue( $result );
	}

	/**
	 * @author tonykova
	 * @group external-http
	 */
	#[Group( 'external-http' )]
	public function test_Jetpack_JSON_API_Plugins_Install_Endpoint() {
		if ( is_multisite() ) {
			wp_set_current_user( self::$super_admin_user_id );
		}

		$endpoint = new Jetpack_JSON_API_Plugins_Install_Endpoint(
			array(
				'stat'                 => 'plugins:1:new',
				'method'               => 'POST',
				'path'                 => '/sites/%s/plugins/new',
				'path_labels'          => array(
					'$site' => '(int|string) The site ID, The site domain',
				),
				'request_format'       => array(
					'plugin' => '(string) The plugin slug.',
				),
				'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
				'example_request_data' => array(
					'headers' => array(
						'authorization' => 'Bearer YOUR_API_TOKEN',
					),
					'body'    => array(
						'plugin' => 'buddypress',
					),
				),
				'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/new',
			)
		);

		$the_real_folder = WP_PLUGIN_DIR . '/the';
		$the_plugin_slug = 'the';

		// Check if 'The' plugin folder is already there.
		if ( file_exists( $the_real_folder ) ) {
			$this->markTestSkipped( 'The plugin the test tries to install (the) is already installed. Skipping.' );
		}

		$class = new ReflectionClass( 'Jetpack_JSON_API_Plugins_Install_Endpoint' );

		$plugins_property = $class->getProperty( 'plugins' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$plugins_property->setAccessible( true );
		}
		$plugins_property->setValue( $endpoint, array( $the_plugin_slug ) );

		$validate_plugins_method = $class->getMethod( 'validate_plugins' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$validate_plugins_method->setAccessible( true );
		}
		$result = $validate_plugins_method->invoke( $endpoint );
		$this->assertTrue( $result );

		$install_plugin_method = $class->getMethod( 'install' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$install_plugin_method->setAccessible( true );
		}

		$result = $install_plugin_method->invoke( $endpoint );

		$this->assertTrue( $result );
		$this->assertTrue( file_exists( $the_real_folder ) );

		// Clean up
		$this->rmdir( $the_real_folder );
	}

	public function filesystem_method_direct() {
		return 'direct';
	}

	public function rmdir( $dir ) {
		foreach ( scandir( $dir ) as $file ) {
			if ( is_dir( $file ) ) {
				continue;
			} else {
				unlink( "$dir/$file" );
			}
		}
		rmdir( $dir );
	}

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'Get';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}
}
