<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\My_Jetpack\Products\Jetpack_Ai;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
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
		unset( $GLOBALS['jetpack_mock_internal_testing_environment'] );
		// Reset the mock Jetpack module state so it doesn't leak between tests.
		if ( class_exists( 'Jetpack' ) && property_exists( 'Jetpack', 'active_modules' ) ) {
			// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock in ./assets/jetpack-mock-plugin.txt
			\Jetpack::$active_modules = array();
			// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock in ./assets/jetpack-mock-plugin.txt
			\Jetpack::$return_false = false;
		}
	}

	/**
	 * Tests that Jetpack AI is active when the plugin is active
	 */
	public function test_jetpack_ai_is_active_when_plugin_active() {
		activate_plugins( 'jetpack/jetpack.php' );
		$this->assertTrue( Jetpack_Ai::is_plugin_active() );
	}

	/**
	 * Tests that the product declares the 'ai' Jetpack module.
	 */
	public function test_jetpack_ai_module_name_is_ai() {
		$this->assertSame( 'ai', Jetpack_Ai::$module_name );
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

		// Now that the product extends Module_Product, is_active() also requires the
		// underlying 'ai' module to be active, so activate it for this scenario.
		\Jetpack::activate_module( 'ai' );

		// Add filter to enable AI (default behavior)
		add_filter( 'jetpack_ai_enabled', '__return_true', 99 );

		// Since AI has free offering and doesn't require a plan, is_active() should return true
		$this->assertTrue( Jetpack_Ai::is_active() );
	}

	/**
	 * Tests that is_active() stays false when the jetpack_ai_enabled filter is false
	 * even if the underlying module is active. This proves the is_active() override
	 * survived the switch to Module_Product as the base class.
	 */
	public function test_jetpack_ai_is_inactive_when_filter_off_even_if_module_active() {
		activate_plugins( 'jetpack/jetpack.php' );

		\Jetpack::activate_module( 'ai' );
		$this->assertTrue( Jetpack_Ai::is_module_active() );

		// The filter (host/master off) must override an otherwise-active module.
		add_filter( 'jetpack_ai_enabled', '__return_false', 99 );

		$this->assertFalse( Jetpack_Ai::is_active() );
	}

	/**
	 * Tests that get_status() reports the module as disabled when the 'ai' module
	 * is inactive, even with the plugin active and the site fully connected.
	 */
	public function test_jetpack_ai_status_is_module_disabled_when_module_inactive() {
		// Mock a full connection so the module-disabled status is not masked by
		// site/user connection errors in the parent get_status() flow.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );

		activate_plugins( 'jetpack/jetpack.php' );

		// Make sure the 'ai' module is not active.
		\Jetpack::deactivate_module( 'ai' );

		$this->assertFalse( Jetpack_Ai::is_module_active() );
		$this->assertSame( Products::STATUS_MODULE_DISABLED, Jetpack_Ai::get_status() );
	}

	/**
	 * Pre-release gate: outside internal testing environments the product is not
	 * module-backed at all, so an inactive module never surfaces — the status is
	 * what it was before the module existed.
	 */
	public function test_jetpack_ai_ignores_the_module_outside_internal_testing() {
		$GLOBALS['jetpack_mock_internal_testing_environment'] = false;

		Jetpack_Options::update_option( 'id', 123 );
		activate_plugins( 'jetpack/jetpack.php' );
		\Jetpack::deactivate_module( 'ai' );

		$this->assertTrue( Jetpack_Ai::is_module_active() );
		$this->assertNotSame( Products::STATUS_MODULE_DISABLED, Jetpack_Ai::get_status() );
	}

	/**
	 * In internal testing environments the manage URL points at the Jetpack AI
	 * Hub, whose Overview tab is visible behind the same gate.
	 */
	public function test_manage_url_points_at_the_jetpack_ai_hub_in_internal_testing() {
		activate_plugins( 'jetpack/jetpack.php' );
		$GLOBALS['jetpack_mock_internal_testing_environment'] = true;

		$manage_url = Jetpack_Ai::get_manage_url();

		$this->assertSame( admin_url( 'admin.php?page=jetpack-ai' ), $manage_url );
		$this->assertStringNotContainsString( 'page=my-jetpack', (string) $manage_url );
	}

	/**
	 * Outside internal testing the Jetpack AI Hub shows only MCP Settings, so
	 * the manage URL must keep landing on the My Jetpack product page.
	 */
	public function test_manage_url_stays_on_the_my_jetpack_product_page_outside_internal_testing() {
		activate_plugins( 'jetpack/jetpack.php' );
		$GLOBALS['jetpack_mock_internal_testing_environment'] = false;

		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_manage_url() );
	}

	/**
	 * Post-checkout landing in internal testing environments is the Jetpack AI Hub.
	 */
	public function test_post_checkout_lands_on_the_jetpack_ai_hub_in_internal_testing() {
		activate_plugins( 'jetpack/jetpack.php' );
		$GLOBALS['jetpack_mock_internal_testing_environment'] = true;

		$this->assertSame( admin_url( 'admin.php?page=jetpack-ai' ), Jetpack_Ai::get_post_checkout_url() );
	}

	/**
	 * Post-checkout landing outside internal testing stays on the My Jetpack product page.
	 */
	public function test_post_checkout_stays_on_the_my_jetpack_product_page_outside_internal_testing() {
		activate_plugins( 'jetpack/jetpack.php' );
		$GLOBALS['jetpack_mock_internal_testing_environment'] = false;

		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_post_checkout_url() );
	}

	/**
	 * Post-activation landing in internal testing environments is the Jetpack AI Hub.
	 */
	public function test_post_activation_lands_on_the_jetpack_ai_hub_in_internal_testing() {
		activate_plugins( 'jetpack/jetpack.php' );
		$GLOBALS['jetpack_mock_internal_testing_environment'] = true;

		$this->assertSame( admin_url( 'admin.php?page=jetpack-ai' ), Jetpack_Ai::get_post_activation_url() );
	}

	/**
	 * Post-activation landing outside internal testing stays on the My Jetpack product page.
	 */
	public function test_post_activation_stays_on_the_my_jetpack_product_page_outside_internal_testing() {
		activate_plugins( 'jetpack/jetpack.php' );
		$GLOBALS['jetpack_mock_internal_testing_environment'] = false;

		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_post_activation_url() );
	}

	/**
	 * Standalone plugins ship My Jetpack without the Jetpack plugin, so the gate
	 * helper never exists and the manage URL must fall back to My Jetpack. Separate
	 * process so no earlier activate_plugins() call has defined the helper.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_manage_url_stays_on_the_my_jetpack_product_page_without_the_jetpack_plugin() {
		$this->assertFalse( function_exists( 'jetpack_is_internal_testing_environment' ) );
		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_manage_url() );
	}
}
