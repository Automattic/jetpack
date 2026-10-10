<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\My_Jetpack\Products\Security;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/class-sample-module-product.php';

/**
 * Unit tests for Module Product class.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Rest_Products
 */
class Module_Product_Test extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * The secondary user id.
	 *
	 * @var int
	 */
	private static $secondary_user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );

		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		Jetpack_Options::update_option( 'available_modules', array( JETPACK__VERSION => array( Sample_Module_Product::$module_name => '1.0' ) ) );

		Initializer::init();

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
	 * Installs the mock plugin present in the test assets folder as if it was the Boost plugin
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
		if ( class_exists( 'Jetpack' ) ) {
			// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock from ./assets/jetpack-mock-plugin.txt.
			\Jetpack::$return_false = false;
			// @phan-suppress-next-line PhanUndeclaredStaticProperty
			\Jetpack::$forced_on = array();
			// @phan-suppress-next-line PhanUndeclaredStaticProperty
			\Jetpack::$forced_off = array();
		}

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Tests exception module name missing
	 */
	public function test_throws_if_module_name_is_missing() {
		$this->expectException( \Exception::class );
		require_once __DIR__ . '/class-broken-product.php';
		Broken_Product::is_module_active();
	}

	/**
	 * Test plugin slug and filename are overriden
	 */
	public function test_plugin_slug_and_filename() {
		$this->assertSame( Sample_Module_Product::JETPACK_PLUGIN_SLUG, Sample_Module_Product::get_plugin_slug() );
		$this->assertSame( Sample_Module_Product::JETPACK_PLUGIN_FILENAME, Sample_Module_Product::get_plugin_filename() );
	}

	/**
	 * Tests activating/deactivating and checking active
	 */
	public function test_activate_and_check() {
		$this->assertFalse( Sample_Module_Product::is_active() );
		$this->assertTrue( Sample_Module_Product::activate() );
		$this->assertTrue( Sample_Module_Product::is_active() );
		$this->assertTrue( Sample_Module_Product::deactivate() );
		$this->assertFalse( Sample_Module_Product::is_active() );
		$this->assertFalse( Sample_Module_Product::is_module_active() );
		$this->assertTrue( Sample_Module_Product::is_plugin_active() );
	}

	/**
	 * Tests that is_activated() follows the module, like is_active() but without a plan check.
	 */
	public function test_is_activated_follows_the_module() {
		$this->assertFalse( Sample_Module_Product::is_activated() );
		$this->assertTrue( Sample_Module_Product::activate() );
		$this->assertTrue( Sample_Module_Product::is_activated() );
		$this->assertTrue( Sample_Module_Product::deactivate() );
		$this->assertFalse( Sample_Module_Product::is_activated() );
	}

	/**
	 * Assert WP Error is returned if Jetpack fails to activate the module
	 */
	public function test_return_error_on_activation_failure() {
		activate_plugins( 'jetpack/jetpack.php' );
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- It's declared on the mock from ./assets/jetpack-mock-plugin.txt
		\Jetpack::$return_false = true;
		$this->assertTrue( is_wp_error( Sample_Module_Product::activate() ) );

		// also check deactivate returns false.
		$this->assertFalse( Sample_Module_Product::deactivate() );
	}

	/**
	 * Deactivating a module a host forces on says so, instead of reporting success.
	 */
	public function test_deactivating_a_forced_module_says_it_stays_on() {
		activate_plugins( 'jetpack/jetpack.php' );
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock from ./assets/jetpack-mock-plugin.txt.
		\Jetpack::$forced_on = array( Sample_Module_Product::$module_name );

		$result = Sample_Module_Product::deactivate();

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'module_forced', $result->get_error_code() );
		$this->assertStringContainsString( 'enabled by your host or site administrator', $result->get_error_message() );
	}

	/**
	 * Activating a module a host forces off says so, instead of reporting success.
	 */
	public function test_activating_a_forced_off_module_says_it_stays_off() {
		activate_plugins( 'jetpack/jetpack.php' );
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock from ./assets/jetpack-mock-plugin.txt.
		\Jetpack::$forced_off = array( Sample_Module_Product::$module_name );

		$result = Sample_Module_Product::activate();

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'module_forced', $result->get_error_code() );
		$this->assertStringContainsString( 'disabled by your host or site administrator', $result->get_error_message() );
	}

	/**
	 * A bundle has no module of its own, so without a plan it needs one, whatever the connection.
	 *
	 * @param array  $purchases      The site's purchases.
	 * @param bool   $has_owner      Whether the site has a connection owner.
	 * @param bool   $jetpack_active Whether the Jetpack plugin is active.
	 * @param string $expected       The Security bundle's expected status.
	 * @dataProvider provide_bundle_status_cases
	 */
	#[DataProvider( 'provide_bundle_status_cases' )]
	public function test_bundle_status( $purchases, $has_owner, $jetpack_active, $expected ) {
		if ( $jetpack_active ) {
			activate_plugins( 'jetpack/jetpack.php' );
		}
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, $purchases, HOUR_IN_SECONDS );
		if ( $has_owner ) {
			( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		}

		$this->assertSame( $expected, Security::get_status() );

		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
	}

	/**
	 * Purchases, connection owner, Jetpack, and the status a Security bundle reports with them.
	 *
	 * @return array[]
	 */
	public static function provide_bundle_status_cases() {
		return array(
			'no plan, no owner'                     => array( array(), false, true, Products::STATUS_NEEDS_PLAN ),
			'no plan, owner connected'              => array( array(), true, true, Products::STATUS_NEEDS_PLAN ),
			'own plan, no owner'                    => array(
				array(
					(object) array(
						'product_slug'  => 'jetpack_security_t1_yearly',
						'expiry_status' => 'active',
						'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
					),
				),
				false,
				true,
				Products::STATUS_USER_CONNECTION_ERROR,
			),
			'covered by Complete, no owner'         => array(
				array(
					(object) array(
						'product_slug'  => 'jetpack_complete_yearly',
						'expiry_status' => 'active',
						'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
					),
				),
				false,
				true,
				Products::STATUS_USER_CONNECTION_ERROR,
			),
			// Only its own plan slugs count as a plan for the bundle, so Complete doesn't.
			'covered by Complete, Jetpack inactive' => array(
				array(
					(object) array(
						'product_slug'  => 'jetpack_complete_yearly',
						'expiry_status' => 'active',
						'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
					),
				),
				false,
				false,
				Products::STATUS_NEEDS_PLAN,
			),
		);
	}

	/**
	 * A bundle whose plan lapsed leaves the historically active list, as it did when it reported module_disabled.
	 */
	public function test_lapsed_bundle_leaves_historically_active_modules() {
		activate_plugins( 'jetpack/jetpack.php' );
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, array(), HOUR_IN_SECONDS );
		Jetpack_Options::update_option( 'historically_active_modules', array( Security::$slug ) );

		Historically_Active_Modules::update_historically_active_jetpack_modules();

		$this->assertNotContains( Security::$slug, Jetpack_Options::get_option( 'historically_active_modules' ) );

		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
	}
}
