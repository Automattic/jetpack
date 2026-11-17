<?php

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Jetpack_Boost;
use Automattic\Jetpack_Boost\Lib\CLI;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;
use Mockery;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

class CLI_Test extends Base_TestCase {

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_deactivating_page_cache_stops_caching() {
		define( 'WP_CONTENT_DIR', sys_get_temp_dir() . '/boost-cli-' . uniqid() );
		mkdir( WP_CONTENT_DIR . '/boost-cache', 0755, true );
		$drop_in = WP_CONTENT_DIR . '/advanced-cache.php';
		file_put_contents( $drop_in, '<?php // ' . Page_Cache::ADVANCED_CACHE_SIGNATURE );

		try {
			$settings = Boost_Cache_Settings::get_instance();
			$this->assertTrue( $settings->set( array( 'enabled' => true ) ) );
			$module = new Module( new Page_Cache() );
			\Patchwork\redefine( Modules_Setup::class . '::get_available_modules', \Patchwork\always( array( 'page_cache' => $module ) ) );
			\Patchwork\redefine( Modules_Setup::class . '::get_available_submodules', \Patchwork\always( array() ) );
			Functions\expect( 'update_option' )->once()->with( 'jetpack_boost_status_page-cache', false )->andReturn( true );
			Functions\when( 'wp_clear_scheduled_hook' )->justReturn( 1 );
			Functions\when( 'wp_delete_file' )->alias( 'unlink' );
			Functions\stubTranslationFunctions();
			Mockery::mock( 'alias:WP_CLI' )->shouldReceive( 'success' )->once()->with( "'page_cache' has been deactivated." );

			/** @var Jetpack_Boost $boost */
			$boost = Mockery::mock( Jetpack_Boost::class );
			// @phan-suppress-next-line PhanTypeMismatchArgument -- The mock stands in for Jetpack_Boost in this test.
			$cli = new CLI( $boost );
			$cli->module( array( 'deactivate', 'page_cache' ) );

			$this->assertSame(
				array( false, false ),
				array( $settings->get_enabled(), file_exists( $drop_in ) )
			);
			$config         = file( WP_CONTENT_DIR . '/boost-cache/config.php' );
			$saved_settings = (array) json_decode( $config[3], true );
			$this->assertFalse( $saved_settings['enabled'] );
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
}
