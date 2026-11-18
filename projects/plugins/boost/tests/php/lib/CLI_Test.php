<?php

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Jetpack_Boost;
use Automattic\Jetpack_Boost\Lib\CLI;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Error;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

class CLI_Test extends Base_TestCase {

	/**
	 * @dataProvider drop_in_states
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'drop_in_states' )]
	public function test_deactivating_page_cache_stops_caching( $drop_in_signature, $drop_in_remains, $initially_enabled = true, $read_only_settings = false ) {
		define( 'WP_CONTENT_DIR', sys_get_temp_dir() . '/boost-cli-' . uniqid() );
		mkdir( WP_CONTENT_DIR . '/boost-cache', 0755, true );
		$drop_in = WP_CONTENT_DIR . '/advanced-cache.php';
		if ( null !== $drop_in_signature ) {
			file_put_contents( $drop_in, '<?php // ' . $drop_in_signature );
		}

		try {
			$settings = Boost_Cache_Settings::get_instance();
			$this->assertTrue( $settings->set( array( 'enabled' => $initially_enabled ) ) );
			if ( $read_only_settings ) {
				chmod( WP_CONTENT_DIR . '/boost-cache', 0555 );
				// Reject writes even when filesystem privileges bypass the read-only mode.
				\Patchwork\redefine( Filesystem_Utils::class . '::write_to_file', \Patchwork\always( new Boost_Cache_Error( 'could-not-write', 'Settings file is not writable.' ) ) );
			}
			$cli = $this->create_cli();
			Mockery::mock( 'alias:WP_CLI' )->shouldReceive( 'success' )->once()->with( "'page_cache' has been deactivated." );

			$cli->module( array( 'deactivate', 'page_cache' ) );

			$this->assertSame(
				array( false, $drop_in_remains ),
				array( $settings->get_enabled(), file_exists( $drop_in ) )
			);
			if ( $drop_in_remains ) {
				$this->assertSame( '<?php // ' . (string) $drop_in_signature, file_get_contents( $drop_in ) );
			}
		} finally {
			if ( $read_only_settings ) {
				chmod( WP_CONTENT_DIR . '/boost-cache', 0755 );
			}
			foreach ( array( $drop_in, WP_CONTENT_DIR . '/boost-cache/config.php' ) as $file ) {
				if ( file_exists( $file ) ) {
					unlink( $file );
				}
			}
			rmdir( WP_CONTENT_DIR . '/boost-cache' );
			rmdir( WP_CONTENT_DIR );
		}
	}

	public static function drop_in_states() {
		return array(
			'installed'                            => array( Page_Cache::ADVANCED_CACHE_SIGNATURE, false ),
			'already missing'                      => array( null, false ),
			'another plugin'                       => array( 'Another Cache Plugin', true ),
			'already disabled, read-only settings' => array( null, false, false, true ),
		);
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_deactivating_unconfigured_page_cache_with_read_only_content_directory_succeeds() {
		define( 'WP_CONTENT_DIR', sys_get_temp_dir() . '/boost-cli-' . uniqid() );
		mkdir( WP_CONTENT_DIR, 0555, true );

		try {
			$cli = $this->create_cli();
			// Reject directory creation even when tests run with elevated filesystem permissions.
			\Patchwork\redefine( Filesystem_Utils::class . '::create_directory', \Patchwork\always( false ) );
			Mockery::mock( 'alias:WP_CLI' )->shouldReceive( 'success' )->once()->with( "'page_cache' has been deactivated." );

			$cli->module( array( 'deactivate', 'page_cache' ) );

			$this->assertDirectoryDoesNotExist( WP_CONTENT_DIR . '/boost-cache' );
			$this->assertFileDoesNotExist( WP_CONTENT_DIR . '/advanced-cache.php' );
		} finally {
			chmod( WP_CONTENT_DIR, 0755 );
			rmdir( WP_CONTENT_DIR );
		}
	}

	/**
	 * @dataProvider teardown_failures
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'teardown_failures' )]
	public function test_deactivating_page_cache_reports_failure( $settings_write_fails, $drop_in_delete_fails ) {
		define( 'WP_CONTENT_DIR', sys_get_temp_dir() . '/boost-cli-' . uniqid() );
		mkdir( WP_CONTENT_DIR . '/boost-cache', 0755, true );
		$drop_in = WP_CONTENT_DIR . '/advanced-cache.php';
		file_put_contents( $drop_in, '<?php // ' . Page_Cache::ADVANCED_CACHE_SIGNATURE );

		try {
			$settings = Boost_Cache_Settings::get_instance();
			$this->assertTrue( $settings->set( array( 'enabled' => true ) ) );
			$cli = $this->create_cli();
			if ( $settings_write_fails ) {
				\Patchwork\redefine(
					Filesystem_Utils::class . '::write_to_file',
					\Patchwork\always( new Boost_Cache_Error( 'could-not-write', 'Settings file is not writable.' ) )
				);
			}
			if ( $drop_in_delete_fails ) {
				Functions\when( 'wp_delete_file' )->justReturn( null );
			}
			$message = $settings_write_fails ? 'Failed to write settings file: Settings file is not writable.' : 'Could not remove the Boost Page Cache drop-in.';
			$wp_cli  = Mockery::mock( 'alias:WP_CLI' );
			$wp_cli->shouldReceive( 'error' )->once()->with( $message )->andThrow( new \RuntimeException( $message, 1 ) );
			$wp_cli->shouldNotReceive( 'success' );
			$this->expectException( \RuntimeException::class );
			$this->expectExceptionCode( 1 );

			$cli->module( array( 'deactivate', 'page_cache' ) );
		} finally {
			foreach ( array( $drop_in, WP_CONTENT_DIR . '/boost-cache/config.php' ) as $file ) {
				if ( file_exists( $file ) ) {
					unlink( $file );
				}
			}
			rmdir( WP_CONTENT_DIR . '/boost-cache' );
			rmdir( WP_CONTENT_DIR );
		}
	}

	public static function teardown_failures() {
		return array(
			'settings write'       => array( true, false ),
			'drop-in removal'      => array( false, true ),
			'both storage actions' => array( true, true ),
		);
	}

	private function create_cli() {
		$module = new Module( new Page_Cache() );
		\Patchwork\redefine( Modules_Setup::class . '::get_available_modules', \Patchwork\always( array( Page_Cache::get_slug() => $module ) ) );
		\Patchwork\redefine( Modules_Setup::class . '::get_available_submodules', \Patchwork\always( array() ) );
		Functions\expect( 'update_option' )->once()->with( 'jetpack_boost_status_page-cache', false )->andReturn( true );
		Functions\when( 'wp_clear_scheduled_hook' )->justReturn( 1 );
		Functions\when( 'wp_delete_file' )->alias( 'unlink' );
		Functions\stubTranslationFunctions();

		/** @var Jetpack_Boost $boost */
		$boost = Mockery::mock( Jetpack_Boost::class );
		// @phan-suppress-next-line PhanTypeMismatchArgument -- The mock stands in for Jetpack_Boost in this test.
		return new CLI( $boost );
	}
}
