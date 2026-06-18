<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Jetpack_Forms;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the Jetpack Forms product.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Jetpack_Forms
 */
class Jetpack_Forms_Product_Test extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Installs the Jetpack mock plugin from the test assets folder.
	 *
	 * @return void
	 */
	public function install_mock_plugins() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Forms is a free Growth feature backed by the contact-form module.
	 */
	public function test_product_metadata() {
		$this->assertSame( 'jetpack-forms', Jetpack_Forms::$slug );
		$this->assertSame( 'growth', Jetpack_Forms::$category );
		$this->assertSame( 'contact-form', Jetpack_Forms::$module_name );
		$this->assertTrue( Jetpack_Forms::$is_feature );
		$this->assertTrue( Jetpack_Forms::$has_free_offering );
		$this->assertFalse( Jetpack_Forms::$has_standalone_plugin );
		$this->assertFalse( Jetpack_Forms::$requires_user_connection );
	}

	/**
	 * Tests the product name and title.
	 */
	public function test_name_and_title() {
		$this->assertSame( 'Forms', Jetpack_Forms::get_name() );
		$this->assertSame( 'Jetpack Forms', Jetpack_Forms::get_title() );
	}

	/**
	 * Tests the product descriptions and feature list.
	 */
	public function test_descriptions_and_features() {
		$this->assertNotEmpty( Jetpack_Forms::get_description() );
		$this->assertNotEmpty( Jetpack_Forms::get_long_description() );

		$features = Jetpack_Forms::get_features();
		$this->assertIsArray( $features );
		$this->assertNotEmpty( $features );
	}

	/**
	 * Forms is free.
	 */
	public function test_pricing_is_free() {
		$pricing = Jetpack_Forms::get_pricing_for_ui();
		$this->assertTrue( $pricing['available'] );
		$this->assertTrue( $pricing['is_free'] );
	}

	/**
	 * Tests the manage URL: falls back to the legacy slug when the Forms package is
	 * absent, and defers to its canonical helper when present.
	 */
	public function test_manage_url() {
		// The Forms package isn't a my-jetpack dependency, so it's absent here first.
		$this->assertSame( admin_url( 'admin.php?page=jetpack-forms-admin' ), Jetpack_Forms::get_manage_url() );

		// Once the Forms Dashboard is available, defer to its canonical URL helper.
		require_once __DIR__ . '/stubs/class-dashboard.php';
		$this->assertSame(
			'https://example.org/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin',
			Jetpack_Forms::get_manage_url()
		);
	}

	/**
	 * Forms uses the Jetpack plugin.
	 */
	public function test_plugin_installed_and_active() {
		$this->assertTrue( Jetpack_Forms::is_plugin_installed() );

		activate_plugins( 'jetpack/jetpack.php' );
		$this->assertTrue( Jetpack_Forms::is_plugin_active() );
	}

	/**
	 * Activating the product activates the Jetpack plugin.
	 */
	public function test_activate_plugin() {
		deactivate_plugins( 'jetpack/jetpack.php' );

		$result = Jetpack_Forms::activate_plugin();

		$this->assertNull( $result );
		$this->assertTrue( Jetpack_Forms::is_plugin_active() );
	}
}
