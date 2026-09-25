<?php
/**
 * Unit tests for the Users_Connection_Admin class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests for the WordPress.com account column on the users list table.
 *
 * @covers \Automattic\Jetpack\Connection\Users_Connection_Admin
 */
#[CoversClass( Users_Connection_Admin::class )]
class Users_Connection_Admin_Test extends TestCase {

	/**
	 * Admin user ID created for the test.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Set up before each test.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->admin_id = wp_insert_user(
			array(
				'user_login'   => 'users_column_admin',
				'user_pass'    => 'password',
				'user_email'   => 'admin@example.org',
				'display_name' => 'Local Admin',
				'role'         => 'administrator',
			)
		);

		wp_set_current_user( $this->admin_id );
		set_current_screen( 'users' );

		$GLOBALS['wp_styles']  = null;
		$GLOBALS['wp_scripts'] = null;
	}

	/**
	 * Tear down after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_all_actions( 'admin_enqueue_scripts' );
		remove_all_actions( 'admin_print_styles-users.php' );
		remove_all_filters( 'manage_users_columns' );
		remove_all_filters( 'manage_users_custom_column' );

		$GLOBALS['wp_styles']  = null;
		$GLOBALS['wp_scripts'] = null;
		unset( $GLOBALS['current_screen'] );

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		wp_set_current_user( 0 );
	}

	/**
	 * Build an instance without leaving its `init` callback on the global hook.
	 *
	 * @return Users_Connection_Admin
	 */
	private function create_admin() {
		$admin = new Users_Connection_Admin();
		remove_action( 'init', array( $admin, 'init' ) );

		return $admin;
	}

	/**
	 * Count every callback attached to a hook, across all priorities.
	 *
	 * @param string $hook Hook name.
	 * @return int
	 */
	private function count_hook_callbacks( $hook ) {
		if ( ! isset( $GLOBALS['wp_filter'][ $hook ] ) ) {
			return 0;
		}

		$count = 0;
		foreach ( $GLOBALS['wp_filter'][ $hook ]->callbacks as $callbacks ) {
			$count += count( $callbacks );
		}

		return $count;
	}

	/**
	 * Check whether a hook holds a callback that belongs to the given object.
	 *
	 * @param string $hook     Hook name.
	 * @param object $instance Object to look for.
	 * @return bool
	 */
	private function hook_has_callback_from( $hook, $instance ) {
		if ( ! isset( $GLOBALS['wp_filter'][ $hook ] ) ) {
			return false;
		}

		foreach ( $GLOBALS['wp_filter'][ $hook ]->callbacks as $callbacks ) {
			foreach ( $callbacks as $callback ) {
				if ( is_array( $callback['function'] ) && isset( $callback['function'][0] ) && $callback['function'][0] === $instance ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Get the inline CSS attached to the column style handle.
	 *
	 * @return array
	 */
	private function get_inline_styles() {
		$data = wp_styles()->get_data( Users_Connection_Admin::STYLE_HANDLE, 'after' );

		return is_array( $data ) ? $data : array();
	}

	/**
	 * The column CSS must reach the page through the style queue, not through a printed style element.
	 */
	public function test_init_does_not_print_styles_directly() {
		$admin = $this->create_admin();

		// SSO's User_Admin hooks this action as well, so the hook is occupied here to keep the assertions specific to this class.
		add_action( 'admin_print_styles-users.php', '__return_false' );
		$callbacks_before = $this->count_hook_callbacks( 'admin_print_styles-users.php' );

		$admin->init();

		$this->assertIsInt( has_action( 'admin_enqueue_scripts', array( $admin, 'enqueue_scripts' ) ) );
		$this->assertSame( $callbacks_before, $this->count_hook_callbacks( 'admin_print_styles-users.php' ) );
		$this->assertFalse( $this->hook_has_callback_from( 'admin_print_styles-users.php', $admin ) );
	}

	/**
	 * The column CSS is registered as an inline style on a source-less handle.
	 */
	public function test_enqueue_scripts_adds_the_column_css_as_an_inline_style() {
		$this->create_admin()->enqueue_scripts( 'users.php' );

		$this->assertTrue( wp_style_is( Users_Connection_Admin::STYLE_HANDLE, 'enqueued' ) );
		$this->assertFalse( wp_styles()->registered[ Users_Connection_Admin::STYLE_HANDLE ]->src );

		$css = implode( '', $this->get_inline_styles() );
		$this->assertStringContainsString( '.column-user_jetpack', $css );
		$this->assertStringContainsString( '.jetpack-connection-tooltip', $css );
		$this->assertStringContainsString( '.jetpack-connection-status__logo', $css );
		$this->assertStringNotContainsString( '<style', $css );
	}

	/**
	 * The column CSS is limited to the users list table.
	 */
	public function test_enqueue_scripts_skips_other_admin_screens() {
		$this->create_admin()->enqueue_scripts( 'index.php' );

		$this->assertFalse( wp_style_is( Users_Connection_Admin::STYLE_HANDLE, 'registered' ) );
		$this->assertFalse( wp_style_is( Users_Connection_Admin::STYLE_HANDLE, 'enqueued' ) );
	}

	/**
	 * One request can run several instances, but the CSS must be printed only once.
	 */
	public function test_column_css_is_printed_once_when_several_instances_run() {
		$first_instance  = $this->create_admin();
		$second_instance = $this->create_admin();

		$first_instance->enqueue_scripts( 'users.php' );
		$second_instance->enqueue_scripts( 'users.php' );

		$this->assertCount( 1, $this->get_inline_styles() );

		ob_start();
		wp_styles()->do_items( array( Users_Connection_Admin::STYLE_HANDLE ) );
		$output = ob_get_clean();

		$this->assertSame( 1, substr_count( $output, '<style' ) );
		$this->assertSame( 1, substr_count( $output, '.jetpack-connection-status__logo' ) );
	}
}
