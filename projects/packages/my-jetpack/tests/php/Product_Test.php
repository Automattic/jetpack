<?php
/**
 * Product base class testing.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

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
}
