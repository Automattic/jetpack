<?php

namespace Automattic\Jetpack_Boost\Tests\Modules;

use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Modules\Image_Guide\Image_Guide;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;

class Image_Guide_Test extends Base_TestCase {

	public function test_enqueue_uses_manifest_or_fallback() {
		if ( ! defined( 'JETPACK_BOOST_VERSION' ) ) {
			define( 'JETPACK_BOOST_VERSION', '1.0.0' );
		}
		$asset_file = JETPACK_BOOST_DIR_PATH . '/app/modules/image-guide/dist/guide.min.asset.php';
		$original   = file_exists( $asset_file ) ? file_get_contents( $asset_file ) : false;
		$had_dir    = is_dir( dirname( $asset_file ) );
		if ( ! $had_dir ) {
			mkdir( dirname( $asset_file ), 0777, true );
		}
		Functions\when( 'plugins_url' )->returnArg();
		Functions\when( 'wp_enqueue_style' )->justReturn();
		Functions\when( 'wp_localize_script' )->justReturn();
		Functions\when( 'wp_create_nonce' )->justReturn( 'nonce' );
		Functions\when( 'admin_url' )->returnArg();
		\Patchwork\redefine( Analytics::class . '::get_tracking_data', \Patchwork\always( array() ) );
		$enqueued = array();
		Functions\when( 'wp_enqueue_script' )->alias(
			function ( ...$args ) use ( &$enqueued ) {
				$enqueued[] = $args;
			}
		);
		try {
			file_put_contents( $asset_file, '<?php return array( "dependencies" => array( "wp-data", "manifest-only" ), "version" => "build-version" );' );
			( new Image_Guide() )->enqueue_assets();
			unlink( $asset_file );
			( new Image_Guide() )->enqueue_assets();
			$this->assertSame(
				array(
					array( 'jetpack-boost-guide', 'dist/guide.min.js', array( 'wp-data', 'manifest-only' ), 'build-version', true ),
					array( 'jetpack-boost-guide', 'dist/guide.min.js', array( 'wp-data', 'wp-i18n', 'wp-polyfill' ), JETPACK_BOOST_VERSION, true ),
				),
				$enqueued
			);
		} finally {
			if ( false !== $original ) {
				file_put_contents( $asset_file, $original );
			} elseif ( file_exists( $asset_file ) ) {
				unlink( $asset_file );
			}
			if ( ! $had_dir ) {
				rmdir( dirname( $asset_file ) );
			}
		}
	}
}
