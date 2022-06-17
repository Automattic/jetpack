<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\My_Jetpack\Products\Videopress;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Rest_Products
 */
class Test_Module_Product extends TestCase {

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
	 *
	 * @before
	 */
	public function set_up() {

		// See https://stackoverflow.com/a/41611876.
		if ( version_compare( phpversion(), '5.7', '<=' ) ) {
			$this->markTestSkipped( 'avoid bug in PHP 5.6 that throws strict mode warnings for abstract static methods.' );
		}

		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );

		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

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
	 *
	 * @after
	 */
	public function tear_down() {

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
		$this->assertSame( Videopress::JETPACK_PLUGIN_SLUG, Videopress::get_plugin_slug() );
		$this->assertSame( Videopress::JETPACK_PLUGIN_FILENAME, Videopress::get_plugin_filename() );
	}

	/**
	 * Tests activating/deactivating and checking active
	 */
	public function test_activate_and_check() {
		$this->assertFalse( Videopress::is_active() );
		$this->assertTrue( Videopress::activate() );
		$this->assertTrue( Videopress::is_active() );
		$this->assertTrue( Videopress::deactivate() );
		$this->assertFalse( Videopress::is_active() );
		$this->assertFalse( Videopress::is_module_active() );
		$this->assertTrue( Videopress::is_plugin_active() );
	}

	/**
	 * Assert WP Error is returned if Jetpack fails to activate the module
	 */
	public function test_return_error_on_activation_failure() {
		activate_plugins( 'jetpack/jetpack.php' );
		\Jetpack::$return_false = true;
		$this->assertTrue( is_wp_error( Videopress::activate() ) );

		// also check deactivate returns false.
		$this->assertFalse( Videopress::deactivate() );
	}

}
