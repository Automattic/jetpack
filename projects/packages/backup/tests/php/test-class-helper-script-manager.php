<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Backup;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Helper_Script_Manager class.
 *
 * @package automattic/jetpack-backup
 */
class Test_Helper_Script_Manager extends TestCase {

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
		$helper_script_manager     = new Helper_Script_Manager();
		$default_install_locations = $helper_script_manager->install_locations();

		$this->assertCount( 3, $default_install_locations );

		$paths = array_keys( $default_install_locations );
		$this->assertStringEndsWith( '/wordpress', $paths[0] );
		$this->assertStringEndsWith( '/wordpress/wp-content', $paths[1] );
		$this->assertStringEndsWith( '/wordpress/wp-content/uploads', $paths[2] );

		$site_url = \get_site_url();
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
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );
		$install_locations     = $helper_script_manager->install_locations();

		$this->assertSame( $this->install_locations, $install_locations );
	}

	/**
	 * Test install_helper_script().
	 */
	public function test_install_helper_script() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );
		$result                = $helper_script_manager->install_helper_script( $script_body );

		$this->assertIsArray( $result );

		$this->assertArrayHasKey( 'path', $result );
		$this->assertStringStartsWith( $this->temp_dir . '/jetpack-temp/jp-helper-', $result['path'] );
		$this->assertSame( strlen( 'jp-helper-0123456789.php' ), strlen( basename( $result['path'] ) ) );

		$this->assertArrayHasKey( 'url', $result );
		$this->assertStringStartsWith( $this->url . '/jetpack-temp/jp-helper-', $result['url'] );
		$this->assertSame( strlen( 'jp-helper-0123456789.php' ), strlen( basename( $result['url'] ) ) );

		$this->assertFileExists( $result['path'] );
		$this->assertSame(
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $result['path'] ),
			str_replace( '[wp_path]', realpath( ABSPATH ), $script_body )
		);

		$readme_path = dirname( $result['path'] ) . '/README';
		$this->assertFileExists( $readme_path );

		$this->assertSame(
			implode( "\n\n", Helper_Script_Manager::README_LINES ),
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $readme_path )
		);

		$index_php_path = dirname( $result['path'] ) . '/index.php';
		$this->assertFileExists( $index_php_path );

		$this->assertSame(
			Helper_Script_Manager::INDEX_FILE,
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $index_php_path )
		);
	}

	/**
	 * Test install_helper_script() with a bad helper script header.
	 */
	public function test_install_helper_script_bad_header() {
		$script_body           = 'foobarbaz';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );
		$result                = $helper_script_manager->install_helper_script( $script_body );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'bad_header', $result->get_error_code() );
		$this->assertSame( 'Bad helper script header', $result->get_error_message() );
	}

	/**
	 * Test install_helper_script() with a script body that's too big.
	 */
	public function test_install_helper_script_too_big() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER .
								str_repeat( str_repeat( 'a', 1024 ), 1024 );
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );
		$result                = $helper_script_manager->install_helper_script( $script_body );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'too_big', $result->get_error_code() );
		$this->assertSame(
			'Helper script is bigger (' . strlen( $script_body ) . ' bytes) ' .
			'than the max. size (' . Helper_Script_Manager::MAX_FILESIZE . ' bytes)',
			$result->get_error_message()
		);
	}

	/**
	 * Test install_helper_script() with a script body that has the "[wp_path]" marker missing.
	 */
	public function test_install_helper_script_no_wp_path() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER . 'hello';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );
		$result                = $helper_script_manager->install_helper_script( $script_body );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'no_wp_path_marker', $result->get_error_code() );
		$this->assertSame(
			"Helper script does not have the '[wp_path]' marker",
			$result->get_error_message()
		);
	}

	/**
	 * Test delete_helper_script().
	 */
	public function test_delete_helper_script() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );
		$result                = $helper_script_manager->install_helper_script( $script_body );

		$this->assertIsArray( $result );

		$this->assertArrayHasKey( 'path', $result );
		$this->assertFileExists( $result['path'] );

		$jetpack_temp_dir = dirname( $result['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		$this->assertTrue( $helper_script_manager->delete_helper_script( $result['path'] ) );
		$this->assertFileDoesNotExist( $result['path'] );
		$this->assertDirectoryDoesNotExist( $jetpack_temp_dir );
	}

	/**
	 * Test delete_helper_script(), but make the helper script into an invalid one first.
	 */
	public function test_delete_helper_script_bad_contents() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );
		$result                = $helper_script_manager->install_helper_script( $script_body );

		$this->assertIsArray( $result );

		$this->assertArrayHasKey( 'path', $result );
		$this->assertFileExists( $result['path'] );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $result['path'], 'not a helper script anymore' );

		$this->assertFalse( $helper_script_manager->delete_helper_script( $result['path'] ) );
		$this->assertFileExists( $result['path'] );
	}

	/**
	 * Test cleanup_expired_helper_scripts() when only some of them have expired.
	 */
	public function test_cleanup_expired_helper_scripts() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );

		$results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $results as $result ) {
			$this->assertIsArray( $result );
			$this->assertArrayHasKey( 'path', $result );
			$this->assertFileExists( $result['path'] );
		}

		$jetpack_temp_dir = dirname( $results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
		touch( $results[0]['path'], time() - 60 * 60 * 24 * 7 );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
		touch( $results[1]['path'], time() + 60 * 60 );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
		touch( $results[2]['path'], time() - 60 * 60 * 24 * 7 );

		$helper_script_manager->cleanup_expired_helper_scripts();

		$this->assertFileDoesNotExist( $results[0]['path'] );
		$this->assertFileExists( $results[1]['path'] );
		$this->assertFileDoesNotExist( $results[2]['path'] );

		$this->assertFileExists( "$jetpack_temp_dir/README" );
		$this->assertFileExists( "$jetpack_temp_dir/index.php" );
		$this->assertDirectoryExists( $jetpack_temp_dir );
	}

	/**
	 * Test cleanup_expired_helper_scripts() when all of them have expired.
	 */
	public function test_cleanup_expired_helper_scripts_all_expired() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );

		$results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $results as $result ) {
			$this->assertIsArray( $result );
			$this->assertArrayHasKey( 'path', $result );
			$this->assertFileExists( $result['path'] );

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
			touch( $result['path'], time() - 60 * 60 * 24 * 7 );
		}

		$jetpack_temp_dir = dirname( $results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		$helper_script_manager->cleanup_expired_helper_scripts();

		foreach ( $results as $result ) {
			$this->assertFileDoesNotExist( $result['path'] );
		}

		$this->assertDirectoryDoesNotExist( $jetpack_temp_dir );
	}

	/**
	 * Test cleanup_expired_helper_scripts(), but make one of the helper scripts into an invalid one first.
	 */
	public function test_cleanup_expired_helper_scripts_bad_contents() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );

		$results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $results as $result ) {
			$this->assertIsArray( $result );
			$this->assertArrayHasKey( 'path', $result );
			$this->assertFileExists( $result['path'] );
		}

		$jetpack_temp_dir = dirname( $results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $results[1]['path'], 'not a helper script anymore' );

		foreach ( $results as $result ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
			touch( $result['path'], time() - 60 * 60 * 24 * 7 );
		}

		$helper_script_manager->cleanup_expired_helper_scripts();

		$this->assertFileDoesNotExist( $results[0]['path'] );
		$this->assertFileExists( $results[1]['path'] );
		$this->assertFileDoesNotExist( $results[2]['path'] );

		$this->assertFileExists( "$jetpack_temp_dir/README" );
		$this->assertFileExists( "$jetpack_temp_dir/index.php" );
		$this->assertDirectoryExists( $jetpack_temp_dir );
	}

	/**
	 * Test delete_all_helper_scripts().
	 */
	public function test_delete_all_helper_scripts() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );

		$results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $results as $result ) {
			$this->assertIsArray( $result );
			$this->assertArrayHasKey( 'path', $result );
			$this->assertFileExists( $result['path'] );
		}

		$jetpack_temp_dir = dirname( $results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		$helper_script_manager->delete_all_helper_scripts();

		foreach ( $results as $result ) {
			$this->assertFileDoesNotExist( $result['path'] );
		}

		$this->assertDirectoryDoesNotExist( $jetpack_temp_dir );
	}

	/**
	 * Test delete_all_helper_scripts(), but make one of the helper scripts into an invalid one first.
	 */
	public function test_delete_all_helper_scripts_bad_contents() {
		$script_body           = Helper_Script_Manager::HELPER_HEADER . '$path = "[wp_path]"';
		$helper_script_manager = new Helper_Script_Manager( $this->install_locations );

		$results = array();
		for ( $x = 0; $x < 3; ++$x ) {
			$results[] = $helper_script_manager->install_helper_script( $script_body );
		}

		foreach ( $results as $result ) {
			$this->assertIsArray( $result );
			$this->assertArrayHasKey( 'path', $result );
			$this->assertFileExists( $result['path'] );
		}

		$jetpack_temp_dir = dirname( $results[0]['path'] );
		$this->assertDirectoryExists( $jetpack_temp_dir );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $results[1]['path'], 'not a helper script anymore' );

		$helper_script_manager->delete_all_helper_scripts();

		$this->assertFileDoesNotExist( $results[0]['path'] );
		$this->assertFileExists( $results[1]['path'] );
		$this->assertFileDoesNotExist( $results[2]['path'] );

		$this->assertFileExists( "$jetpack_temp_dir/README" );
		$this->assertFileExists( "$jetpack_temp_dir/index.php" );
		$this->assertDirectoryExists( $jetpack_temp_dir );
	}
}
