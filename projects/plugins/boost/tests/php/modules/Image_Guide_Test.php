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
		$asset_file = tempnam( sys_get_temp_dir(), 'boost-image-guide-' );
		$this->assertNotFalse( $asset_file );
		$guide = new class( $asset_file ) extends Image_Guide {
			public function __construct( $asset_file ) {
				$this->asset_file = $asset_file;
			}
		};
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
			$guide->enqueue_assets();
			unlink( $asset_file );
			$guide->enqueue_assets();
			$this->assertSame(
				array(
					array( 'jetpack-boost-guide', 'dist/guide.min.js', array( 'wp-data', 'manifest-only' ), 'build-version', true ),
					array( 'jetpack-boost-guide', 'dist/guide.min.js', array( 'react', 'react-dom', 'react-jsx-runtime', 'wp-data', 'wp-i18n', 'wp-polyfill' ), JETPACK_BOOST_VERSION, true ),
				),
				$enqueued
			);
		} finally {
			if ( file_exists( $asset_file ) ) {
				unlink( $asset_file );
			}
		}
	}
}
