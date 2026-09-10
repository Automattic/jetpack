<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Products\Jetpack_Ai;
use Automattic\Jetpack\Status\Cache as StatusCache;
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
		Constants::clear_constants();
		StatusCache::clear();
		( new Connection_Manager() )->reset_connection_status();
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
		( new Connection_Manager() )->reset_connection_status();
		// Remove all filters to avoid interference between tests.
		remove_all_filters( 'jetpack_ai_enabled' );
		unset( $GLOBALS['jetpack_mock_internal_testing_environment'] );
		Constants::clear_constants();
		StatusCache::clear();
		// Reset the mock Jetpack module state so it doesn't leak between tests.
		if ( class_exists( 'Jetpack' ) && property_exists( 'Jetpack', 'active_modules' ) ) {
			// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock in ./assets/jetpack-mock-plugin.txt
			\Jetpack::$active_modules = array();
			// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock in ./assets/jetpack-mock-plugin.txt
			\Jetpack::$return_false = false;
			// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock in ./assets/jetpack-mock-plugin.txt
			\Jetpack::$available_modules = array( 'ai' );
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
	 * Atomic keeps the pre-launch card state, so an inactive module stays masked.
	 */
	public function test_jetpack_ai_ignores_the_module_on_atomic() {
		$this->set_atomic_site();
		Jetpack_Options::update_option( 'id', 123 );
		activate_plugins( 'jetpack/jetpack.php' );
		\Jetpack::deactivate_module( 'ai' );

		$this->assertTrue( Jetpack_Ai::is_module_active() );
		$this->assertNotSame( Products::STATUS_MODULE_DISABLED, Jetpack_Ai::get_status() );
	}

	/**
	 * Self-hosted sites manage AI on the Jetpack AI page.
	 */
	public function test_manage_url_points_at_the_jetpack_ai_page_on_self_hosted() {
		activate_plugins( 'jetpack/jetpack.php' );
		$this->connect_site_and_owner();

		$manage_url = Jetpack_Ai::get_manage_url();

		$this->assertTrue( Initializer::get_my_jetpack_flags()['showAiModuleToggle'] );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-ai' ), $manage_url );
		$this->assertStringNotContainsString( 'page=my-jetpack', (string) $manage_url );
	}

	/**
	 * A disconnected site keeps the existing connection action.
	 */
	public function test_feature_ui_stays_hidden_without_a_connection() {
		activate_plugins( 'jetpack/jetpack.php' );

		$this->assertFalse( Jetpack_Ai::is_feature_ui_enabled() );
		$this->assertFalse( Initializer::get_my_jetpack_flags()['showAiModuleToggle'] );
		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_manage_url() );
	}

	/**
	 * A site connection without an owner keeps the account connection action.
	 */
	public function test_feature_ui_stays_hidden_without_a_connected_owner() {
		activate_plugins( 'jetpack/jetpack.php' );
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		$this->assertFalse( Jetpack_Ai::is_feature_ui_enabled() );
		$this->assertFalse( Initializer::get_my_jetpack_flags()['showAiModuleToggle'] );
		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_manage_url() );
	}

	/**
	 * An older Jetpack cannot expose controls supplied by a newer shared package.
	 */
	public function test_feature_ui_stays_hidden_when_active_jetpack_lacks_the_ai_module() {
		activate_plugins( 'jetpack/jetpack.php' );
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock in ./assets/jetpack-mock-plugin.txt
		\Jetpack::$available_modules = array();

		$this->assertFalse( Jetpack_Ai::is_feature_ui_enabled() );
		$this->assertFalse( Initializer::get_my_jetpack_flags()['showAiModuleToggle'] );
		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_manage_url() );
	}

	/**
	 * Atomic sites keep managing AI on the My Jetpack product page.
	 */
	public function test_manage_url_stays_on_the_my_jetpack_product_page_on_atomic() {
		$this->set_atomic_site();
		activate_plugins( 'jetpack/jetpack.php' );

		$this->assertFalse( Initializer::get_my_jetpack_flags()['showAiModuleToggle'] );
		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_manage_url() );
	}

	/**
	 * WordPress.com Simple keeps the existing My Jetpack card action even for
	 * internal requests.
	 */
	public function test_manage_url_stays_on_the_my_jetpack_product_page_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$GLOBALS['jetpack_mock_internal_testing_environment'] = true;
		activate_plugins( 'jetpack/jetpack.php' );

		$this->assertFalse( Jetpack_Ai::is_feature_ui_enabled() );
		$this->assertFalse( Initializer::get_my_jetpack_flags()['showAiModuleToggle'] );
		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_manage_url() );
	}

	/**
	 * Internal Atomic requests retain the pre-release feature UI.
	 */
	public function test_internal_atomic_request_gets_the_feature_ui() {
		$this->set_atomic_site();
		$GLOBALS['jetpack_mock_internal_testing_environment'] = true;
		activate_plugins( 'jetpack/jetpack.php' );
		$this->connect_site_and_owner();

		$this->assertTrue( Jetpack_Ai::is_feature_ui_enabled() );
		$this->assertTrue( Initializer::get_my_jetpack_flags()['showAiModuleToggle'] );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-ai' ), Jetpack_Ai::get_manage_url() );
	}

	/**
	 * Post-checkout landing on self-hosted sites is the Jetpack AI page.
	 */
	public function test_post_checkout_lands_on_the_jetpack_ai_page_on_self_hosted() {
		activate_plugins( 'jetpack/jetpack.php' );
		$this->connect_site_and_owner();

		$this->assertSame( admin_url( 'admin.php?page=jetpack-ai' ), Jetpack_Ai::get_post_checkout_url() );
	}

	/**
	 * Post-checkout landing on Atomic stays on the My Jetpack product page.
	 */
	public function test_post_checkout_stays_on_the_my_jetpack_product_page_on_atomic() {
		$this->set_atomic_site();
		activate_plugins( 'jetpack/jetpack.php' );

		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_post_checkout_url() );
	}

	/**
	 * Post-activation landing on self-hosted sites is the Jetpack AI page.
	 */
	public function test_post_activation_lands_on_the_jetpack_ai_page_on_self_hosted() {
		activate_plugins( 'jetpack/jetpack.php' );
		$this->connect_site_and_owner();

		$this->assertSame( admin_url( 'admin.php?page=jetpack-ai' ), Jetpack_Ai::get_post_activation_url() );
	}

	/**
	 * Post-activation landing on Atomic stays on the My Jetpack product page.
	 */
	public function test_post_activation_stays_on_the_my_jetpack_product_page_on_atomic() {
		$this->set_atomic_site();
		activate_plugins( 'jetpack/jetpack.php' );

		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_post_activation_url() );
	}

	/**
	 * Standalone plugins ship My Jetpack without the Jetpack AI page, so its
	 * manage URL must fall back to My Jetpack.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_manage_url_stays_on_the_my_jetpack_product_page_without_the_jetpack_plugin() {
		$this->assertFalse( Jetpack_Ai::is_plugin_active(), 'Precondition: the Jetpack plugin is not active.' );
		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' ), Jetpack_Ai::get_manage_url() );
	}

	/**
	 * Connect the test site and its owner to WordPress.com.
	 */
	private function connect_site_and_owner() {
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );
	}

	/**
	 * Mark the current test site as WordPress.com Atomic.
	 */
	private function set_atomic_site() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 123 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/tmp/wpcomsh/wpcomsh.php' );
		StatusCache::clear();
		$GLOBALS['jetpack_mock_internal_testing_environment'] = false;
	}
}
