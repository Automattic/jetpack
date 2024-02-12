<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0002;

use WorDBless\BaseTestCase;
use WP_Error;
use function get_site_url;

/**
 * Unit tests for the Helper_Script_Manager_Impl class.
 *
 * @package automattic/jetpack-backup
 */
class Test_Helper_Script_Manager_Impl extends BaseTestCase {

	/**
	 * Temporary directory where "jetpack-temp" will get created.
	 *
	 * @var string
	 */
	private $temp_dir;

	/**
	 * Website's URL for testing.
	 *
	 * @var string
	 */
	private $url = 'https://www.example.com';

	/**
	 * Custom install locations that point to the temporary directory.
	 *
	 * @var array
	 */
	private $install_locations;

	/**
	 * Set up.
	 */
	public function set_up() {
		$this->temp_dir = tempnam( sys_get_temp_dir(), 'jetpack' );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $this->temp_dir );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		mkdir( $this->temp_dir );

		$this->install_locations = array( $this->temp_dir => $this->url );
	}

	/**
	 * Tear down.
	 *
	 * @throws Exception When unable to clean up the temporary directory.
	 */
	public function tear_down() {
		if ( ! static::rm_rf( $this->temp_dir ) ) {
			throw new Exception( 'Clean up of ' . $this->temp_dir . ' has failed' );
		}
	}

	/**
	 * Remove a directory and its contents recursively.
	 *
	 * @param string $dir Path to directory.
	 *
	 * @return bool True if removal succeeded, false otherwise.
	 */
	private static function rm_rf( $dir ) {
		if ( ! file_exists( $dir ) ) {
			return true;
		}

		if ( ! is_dir( $dir ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			return unlink( $dir );
		}

		foreach ( scandir( $dir ) as $item ) {
			if ( in_array( $item, array( '.', '..' ), true ) ) {
				continue;
			}

			if ( ! static::rm_rf( $dir . DIRECTORY_SEPARATOR . $item ) ) {
				return false;
			}
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		return rmdir( $dir );
	}

	/**
	 * Make sure the temporary directory exists.
	 */
	public function test_temp_dir_exists() {
		$this->assertNotNull( $this->temp_dir );
		$this->assertTrue( is_dir( $this->temp_dir ) );
	}

	/**
	 * Test default install locations set by the constructor.
	 */
	public function test_default_install_locations() {
		$helper_script_manager     = new Helper_Script_Manager_Impl();
		$default_install_locations = $helper_script_manager->install_locations();

		$this->assertCount( 3, $default_install_locations );

		$paths = array_keys( $default_install_locations );
		$this->assertStringEndsWith( '/wordpress', $paths[0] );
		$this->assertStringEndsWith( '/wordpress/wp-content', $paths[1] );
		$this->assertStringEndsWith( '/wordpress/wp-content/uploads', $paths[2] );

		$site_url = get_site_url();
		$urls     = array_values( $default_install_locations );
		$this->assertSame(
			array(
				$site_url,
				"$site_url/wp-content",
				"$site_url/wp-content/uploads",
			),
			$urls
		);
	}

	/**
	 * Test constructor with custom install locations.
	 */
	public function test_custom_install_locations() {
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );
		$install_locations     = $helper_script_manager->install_locations();

		$this->assertSame( $this->install_locations, $install_locations );
	}

	/**
	 * Test install_helper_script().
	 */
	public function test_install_helper_script() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );
		$install_result        = $helper_script_manager->install_helper_script( $script_body );

		$this->assertIsArray( $install_result );

		$this->assertArrayHasKey( 'path', $install_result );
		$this->assertStringStartsWith( $this->temp_dir . '/jetpack-temp/jp-helper-', $install_result['path'] );
		$this->assertSame( strlen( 'jp-helper-0123456789.php' ), strlen( basename( $install_result['path'] ) ) );

		$this->assertArrayHasKey( 'url', $install_result );
		$this->assertStringStartsWith( $this->url . '/jetpack-temp/jp-helper-', $install_result['url'] );
		$this->assertSame( strlen( 'jp-helper-0123456789.php' ), strlen( basename( $install_result['url'] ) ) );

		$this->assertFileExists( $install_result['path'] );
		$this->assertSame(
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $install_result['path'] ),
			str_replace( '[wp_path]', realpath( ABSPATH ), $script_body )
		);

		$readme_path = dirname( $install_result['path'] ) . '/README';
		$this->assertFileExists( $readme_path );

		$this->assertSame(
			implode( "\n\n", Helper_Script_Manager_Impl::README_LINES ),
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $readme_path )
		);

		$index_php_path = dirname( $install_result['path'] ) . '/index.php';
		$this->assertFileExists( $index_php_path );

		$this->assertSame(
			Helper_Script_Manager_Impl::INDEX_FILE,
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $index_php_path )
		);
	}

	/**
	 * Test install_helper_script() with a bad helper script header.
	 */
	public function test_install_helper_script_bad_header() {
		$script_body           = 'foobarbaz';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );
		$install_result        = $helper_script_manager->install_helper_script( $script_body );
		$this->assertInstanceOf( WP_Error::class, $install_result );
		$this->assertSame( 'bad_header', $install_result->get_error_code() );
		$this->assertSame(
			'Bad helper script header: 0x' . bin2hex( $script_body ),
			$install_result->get_error_message()
		);
	}

	/**
	 * Test install_helper_script() with a script body that's too big.
	 */
	public function test_install_helper_script_too_big() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER .
								str_repeat( str_repeat( 'a', 1024 ), 1024 );
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );
		$install_result        = $helper_script_manager->install_helper_script( $script_body );
		$this->assertInstanceOf( WP_Error::class, $install_result );
		$this->assertSame( 'too_big', $install_result->get_error_code() );
		$this->assertSame(
			'Helper script is bigger (' . strlen( $script_body ) . ' bytes) ' .
			'than the max. size (' . Helper_Script_Manager_Impl::MAX_FILESIZE . ' bytes)',
			$install_result->get_error_message()
		);
	}

	/**
	 * Test install_helper_script() with a script body that has the "[wp_path]" marker missing.
	 */
	public function test_install_helper_script_no_wp_path() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . 'hello';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );
		$install_result        = $helper_script_manager->install_helper_script( $script_body );
		$this->assertInstanceOf( WP_Error::class, $install_result );
		$this->assertSame( 'no_wp_path_marker', $install_result->get_error_code() );
		$this->assertSame(
			"Helper script does not have the '[wp_path]' marker",
			$install_result->get_error_message()
		);
	}

	/**
	 * Test install_helper_script() to a location that we can't write to.
	 */
	public function test_install_helper_script_bad_location() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );

		$first_install_dir = array_keys( $this->install_locations )[0];
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_chmod
		chmod( $first_install_dir, 0000 );
		$install_result = $helper_script_manager->install_helper_script( $script_body );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_chmod
		chmod( $first_install_dir, 0777 );

		$this->assertInstanceOf( WP_Error::class, $install_result );
		$this->assertSame( 'all_locations_failed', $install_result->get_error_code() );
		$this->assertStringContainsString(
			'Unable to write the helper script to any install locations; tried: ',
			$install_result->get_error_message()
		);
		$this->assertStringContainsString(
			"directory '$first_install_dir'",
			$install_result->get_error_message()
		);
		$this->assertStringContainsString(
			'is not writable',
			$install_result->get_error_message()
		);
	}

	/**
	 * Test delete_helper_script().
	 */
	public function test_delete_helper_script() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );
		$install_result        = $helper_script_manager->install_helper_script( $script_body );

		$this->assertIsArray( $install_result );

		$this->assertArrayHasKey( 'path', $install_result );
		$this->assertFileExists( $install_result['path'] );

		$jetpack_temp_dir = dirname( $install_result['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		$delete_result = $helper_script_manager->delete_helper_script( $install_result['path'] );
		$this->assertNotInstanceOf( WP_Error::class, $delete_result );
		$this->assertSame( true, $delete_result );
		$this->assertFileDoesNotExist( $install_result['path'] );
		$this->assertDirectoryDoesNotExist( $jetpack_temp_dir );
	}

	/**
	 * Test delete_helper_script(), but make the helper script into an invalid one first.
	 */
	public function test_delete_helper_script_bad_contents() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );
		$result                = $helper_script_manager->install_helper_script( $script_body );

		$this->assertIsArray( $result );

		$this->assertArrayHasKey( 'path', $result );
		$this->assertFileExists( $result['path'] );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $result['path'], str_repeat( 'a', strlen( $script_body ) ) );

		$delete_result = $helper_script_manager->delete_helper_script( $result['path'] );
		$this->assertInstanceOf( WP_Error::class, $delete_result );
		$this->assertStringStartsWith( 'Unable to delete helper script', $delete_result->get_error_message() );
		$this->assertStringContainsString( 'Bad helper script header', $delete_result->get_error_message() );
		$this->assertFileExists( $result['path'] );
	}

	/**
	 * Test cleanup_expired_helper_scripts() when only some of them have expired.
	 */
	public function test_cleanup_expired_helper_scripts() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );

		$install_results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$install_results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $install_results as $install_result ) {
			$this->assertIsArray( $install_result );
			$this->assertArrayHasKey( 'path', $install_result );
			$this->assertFileExists( $install_result['path'] );
		}

		$jetpack_temp_dir = dirname( $install_results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );
		$this->assertFileExists( "$jetpack_temp_dir/README" );
		$this->assertFileExists( "$jetpack_temp_dir/index.php" );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
		touch( $install_results[0]['path'], time() - 60 * 60 * 24 * 7 );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
		touch( $install_results[1]['path'], time() + 60 * 60 );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
		touch( $install_results[2]['path'], time() - 60 * 60 * 24 * 7 );

		$cleanup_result = $helper_script_manager->cleanup_expired_helper_scripts();
		$this->assertNotInstanceOf( WP_Error::class, $cleanup_result );
		$this->assertSame( true, $cleanup_result );

		$this->assertFileDoesNotExist( $install_results[0]['path'] );
		$this->assertFileExists( $install_results[1]['path'] );
		$this->assertFileDoesNotExist( $install_results[2]['path'] );

		$this->assertFileExists( "$jetpack_temp_dir/README" );
		$this->assertFileExists( "$jetpack_temp_dir/index.php" );
		$this->assertDirectoryExists( $jetpack_temp_dir );
	}

	/**
	 * Test cleanup_expired_helper_scripts() when all of them have expired.
	 */
	public function test_cleanup_expired_helper_scripts_all_expired() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );

		$install_results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$install_results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $install_results as $install_result ) {
			$this->assertIsArray( $install_result );
			$this->assertArrayHasKey( 'path', $install_result );
			$this->assertFileExists( $install_result['path'] );

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
			touch( $install_result['path'], time() - 60 * 60 * 24 * 7 );
		}

		$jetpack_temp_dir = dirname( $install_results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		$cleanup_result = $helper_script_manager->cleanup_expired_helper_scripts();
		$this->assertNotInstanceOf( WP_Error::class, $cleanup_result );
		$this->assertSame( true, $cleanup_result );

		foreach ( $install_results as $install_result ) {
			$this->assertFileDoesNotExist( $install_result['path'] );
		}

		$this->assertDirectoryDoesNotExist( $jetpack_temp_dir );
	}

	/**
	 * Test cleanup_expired_helper_scripts(), but make one of the helper scripts into an invalid one first.
	 */
	public function test_cleanup_expired_helper_scripts_bad_contents() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );

		$install_results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$install_results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $install_results as $install_result ) {
			$this->assertNotInstanceOf( WP_Error::class, $install_result );
			$this->assertIsArray( $install_result );
			$this->assertArrayHasKey( 'path', $install_result );
			$this->assertFileExists( $install_result['path'] );
		}

		$jetpack_temp_dir = dirname( $install_results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $install_results[1]['path'], str_repeat( 'a', strlen( $script_body ) ) );

		foreach ( $install_results as $install_result ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
			touch( $install_result['path'], time() - 60 * 60 * 24 * 7 );
		}

		$cleanup_result = $helper_script_manager->cleanup_expired_helper_scripts();
		$this->assertInstanceOf( WP_Error::class, $cleanup_result );
		$this->assertStringStartsWith(
			'Unable to clean up expired helper scripts',
			$cleanup_result->get_error_message()
		);
		$this->assertStringContainsString(
			'Bad helper script header',
			$cleanup_result->get_error_message()
		);

		$this->assertFileDoesNotExist( $install_results[0]['path'] );
		$this->assertFileExists( $install_results[1]['path'] );
		$this->assertFileDoesNotExist( $install_results[2]['path'] );

		$this->assertFileExists( "$jetpack_temp_dir/README" );
		$this->assertFileExists( "$jetpack_temp_dir/index.php" );
		$this->assertDirectoryExists( $jetpack_temp_dir );
	}

	/**
	 * Test delete_all_helper_scripts().
	 */
	public function test_delete_all_helper_scripts() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );

		$install_results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$install_results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $install_results as $install_result ) {
			$this->assertNotInstanceOf( WP_Error::class, $install_result );
			$this->assertIsArray( $install_result );
			$this->assertArrayHasKey( 'path', $install_result );
			$this->assertFileExists( $install_result['path'] );
		}

		$jetpack_temp_dir = dirname( $install_results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		$delete_result = $helper_script_manager->delete_all_helper_scripts();
		$this->assertNotInstanceOf( WP_Error::class, $delete_result );
		$this->assertSame( true, $delete_result );

		foreach ( $install_results as $install_result ) {
			$this->assertFileDoesNotExist( $install_result['path'] );
		}

		$this->assertDirectoryDoesNotExist( $jetpack_temp_dir );
	}

	/**
	 * Test delete_all_helper_scripts(), but make one of the helper scripts into an invalid one first.
	 */
	public function test_delete_all_helper_scripts_bad_contents() {
		$script_body           = Helper_Script_Manager_Impl::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager_Impl( $this->install_locations );

		$install_results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$install_results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $install_results as $install_result ) {
			$this->assertNotInstanceOf( WP_Error::class, $install_result );
			$this->assertIsArray( $install_result );
			$this->assertArrayHasKey( 'path', $install_result );
			$this->assertFileExists( $install_result['path'] );
		}

		$jetpack_temp_dir = dirname( $install_results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $install_results[1]['path'], str_repeat( 'a', strlen( $script_body ) ) );

		$delete_result = $helper_script_manager->delete_all_helper_scripts();
		$this->assertInstanceOf( WP_Error::class, $delete_result );
		$this->assertStringStartsWith(
			'Unable to clean up all helper scripts',
			$delete_result->get_error_message()
		);
		$this->assertStringContainsString(
			'Bad helper script header',
			$delete_result->get_error_message()
		);

		$this->assertFileDoesNotExist( $install_results[0]['path'] );
		$this->assertFileExists( $install_results[1]['path'] );
		$this->assertFileDoesNotExist( $install_results[2]['path'] );

		$this->assertFileExists( "$jetpack_temp_dir/README" );
		$this->assertFileExists( "$jetpack_temp_dir/index.php" );
		$this->assertDirectoryExists( $jetpack_temp_dir );
	}
}
