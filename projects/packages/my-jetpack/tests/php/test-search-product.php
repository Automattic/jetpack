<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\My_Jetpack\Products\Search;
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
class Test_Search_Product extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
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
	 * Installs the mock plugin present in the test assets folder as if it was the Boost plugin
	 *
	 * @return void
	 */
	public function install_mock_plugins() {
		$plugin_dir = WP_PLUGIN_DIR . '/' . Search::$plugin_slug;
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/search-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack-search/jetpack-search.php' );
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
	 * Tests with Jetpack active
	 */
	public function test_if_jetpack_active_return_false() {
		activate_plugin( 'jetpack/jetpack.php' );
		$this->assertTrue( Search::is_plugin_active() );
	}

	/**
	 * Tests with Search active
	 */
	public function test_if_jetpack_inactive_and_search_active_return_true() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Search::get_installed_plugin_filename() );
		$this->assertTrue( Search::is_plugin_active() );
	}

	/**
	 * Tests with both inactive
	 */
	public function test_if_jetpack_inactive_and_search_inactive_return_false() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Search::get_installed_plugin_filename() );
		$this->assertFalse( Search::is_active() );
	}

	/**
	 * Tests Search Manage URL with Search plugin
	 */
	public function test_search_manage_url_with_search() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-search' ), Search::get_manage_url() );
	}

	/**
	 * Tests Search Manage URL with Jetpack plugin
	 */
	public function test_search_manage_url_with_jetpack() {
		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-search' ), Search::get_manage_url() );
	}

	/**
	 * Tests Search Post Activation URL with Jetpack disconected
	 */
	public function test_search_post_activation_url_with_jetpack_disconnected() {
		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( '', Search::get_post_activation_url() );
	}

	/**
	 * Tests Search Post Activation URL with Search disconected
	 */
	public function test_search_post_activation_url_with_search_disconnected() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( '', Search::get_post_activation_url() );
	}

	/**
	 * Tests Search Post Activation URL with Jetpack conected
	 */
	public function test_search_post_activation_url_with_jetpack_connected() {
		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );

		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( '', Search::get_post_activation_url() );
	}

	/**
	 * Tests Search Post Activation URL with Search conected
	 */
	public function test_search_post_activation_url_with_search_connected() {
		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );

		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( '', Search::get_post_activation_url() );
	}
}
