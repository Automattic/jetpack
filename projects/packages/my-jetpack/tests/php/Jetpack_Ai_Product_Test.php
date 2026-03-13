<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Jetpack_Ai;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the Jetpack AI product.
 *
 * @package automattic/my-jetpack
 */
class Jetpack_Ai_Product_Test extends TestCase {

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
	 * Installs the mock Jetpack plugin
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
		// Remove all filters to avoid interference between tests.
		remove_all_filters( 'jetpack_ai_enabled' );
	}

	/**
	 * Tests that Jetpack AI is active when the plugin is active
	 */
	public function test_jetpack_ai_is_active_when_plugin_active() {
		activate_plugins( 'jetpack/jetpack.php' );
		$this->assertTrue( Jetpack_Ai::is_plugin_active() );
	}

	/**
	 * Tests that Jetpack AI respects the jetpack_ai_enabled filter when set to false
	 */
	public function test_jetpack_ai_respects_filter_when_disabled() {
		activate_plugins( 'jetpack/jetpack.php' );

		// Add filter to disable AI
		add_filter( 'jetpack_ai_enabled', '__return_false', 99 );

		// is_active() should return false when the filter is false
		$this->assertFalse( Jetpack_Ai::is_active() );
	}

	/**
	 * Tests that Jetpack AI is active when the filter returns true
	 */
	public function test_jetpack_ai_respects_filter_when_enabled() {
		activate_plugins( 'jetpack/jetpack.php' );

		// Add filter to enable AI (default behavior)
		add_filter( 'jetpack_ai_enabled', '__return_true', 99 );

		// Since AI has free offering and doesn't require a plan, is_active() should return true
		$this->assertTrue( Jetpack_Ai::is_active() );
	}
}
