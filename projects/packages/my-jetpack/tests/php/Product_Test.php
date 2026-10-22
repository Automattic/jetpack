<?php
/**
 * Product base class testing.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/class-sample-plain-product.php';

/**
 * Unit tests for the Product base class.
 */
class Product_Test extends TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		$plugin_dir = WP_PLUGIN_DIR . '/' . Sample_Plain_Product::$plugin_slug;
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}
		copy( __DIR__ . '/assets/backup-mock-plugin.txt', WP_PLUGIN_DIR . '/' . Sample_Plain_Product::$plugin_filename );
		wp_cache_delete( 'plugins', 'plugins' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		deactivate_plugins( Sample_Plain_Product::$plugin_filename );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Tests that the base is_activated() follows the plugin, with no plan check of its own.
	 */
	public function test_is_activated_follows_the_plugin() {
		deactivate_plugins( Sample_Plain_Product::$plugin_filename );
		$this->assertFalse( Sample_Plain_Product::is_activated() );

		activate_plugins( Sample_Plain_Product::$plugin_filename );
		$this->assertTrue( Sample_Plain_Product::is_activated() );
	}

	/**
	 * @dataProvider provide_installed_copies
	 * @param string $plugin Plugin lookup type.
	 * @param bool   $active Whether the development copy is active.
	 * @param bool   $installed Whether either copy is installed.
	 */
	#[DataProvider( 'provide_installed_copies' )]
	public function test_installed_filename_prefers_active_copy( $plugin, $active, $installed = true ) {
		$product_class = 'jetpack' === $plugin ? Product::class : Products\Backup::class;
		$filenames     = 'jetpack' === $plugin ? Product::JETPACK_PLUGIN_FILENAME : array( 'jetpack-backup/jetpack-backup.php', 'jetpack-backup-dev/jetpack-backup.php' );
		$plugins       = static function () use ( $filenames, $installed ) {
			return $installed ? array_fill_keys( $filenames, array( 'Name' => 'Test plugin' ) ) : array();
		};
		add_filter( 'all_plugins', $plugins );
		update_option( 'active_plugins', $active ? array( $filenames[1] ) : array() );
		try {
			$this->assertSame( $installed ? $filenames[ $active ? 1 : 0 ] : null, $product_class::get_installed_plugin_filename( $plugin ) );
		} finally {
			remove_filter( 'all_plugins', $plugins );
		}
	}

	/**
	 * @return array
	 */
	public static function provide_installed_copies() {
		return array(
			'active product copy'     => array( 'product', true ),
			'inactive product copies' => array( 'product', false ),
			'no product copy'         => array( 'product', false, false ),
			'active Jetpack copy'     => array( 'jetpack', true ),
			'inactive Jetpack copies' => array( 'jetpack', false ),
			'no Jetpack copy'         => array( 'jetpack', false, false ),
		);
	}
}
