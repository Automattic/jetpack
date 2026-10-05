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
		remove_all_filters( 'views_users' );
		remove_all_filters( 'users_list_table_query_args' );

		unset( $_GET[ Users_Connection_Admin::VIEW_QUERY_ARG ] );

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

	/* ── Connected view ────────────────────────────────────────── */

	/**
	 * Create a user and give them a WordPress.com token.
	 *
	 * @param string $login User login.
	 * @return int The new user's ID.
	 */
	private function connect_user( $login ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'password',
				'user_email' => $login . '@example.org',
				'role'       => 'administrator',
			)
		);

		$tokens             = (array) \Jetpack_Options::get_option( 'user_tokens' );
		$tokens[ $user_id ] = 'key.secret.' . $user_id;
		\Jetpack_Options::update_option( 'user_tokens', $tokens );

		return $user_id;
	}

	/**
	 * Select the connected view for the current request.
	 */
	private function activate_connected_view() {
		$_GET[ Users_Connection_Admin::VIEW_QUERY_ARG ] = Users_Connection_Admin::VIEW_CONNECTED;
	}

	/**
	 * The view's hooks are registered alongside the column's.
	 */
	public function test_init_registers_the_connected_view_hooks() {
		$admin = $this->create_admin();

		$admin->init();

		$this->assertIsInt( has_filter( 'views_users', array( $admin, 'add_connected_view' ) ) );
		$this->assertIsInt( has_filter( 'users_list_table_query_args', array( $admin, 'filter_query_to_connected_users' ) ) );
	}

	/**
	 * Connected users are read from the token option, not from user meta.
	 */
	public function test_get_connected_user_ids_reads_the_token_option() {
		$first  = $this->connect_user( 'connected_one' );
		$second = $this->connect_user( 'connected_two' );

		$this->assertSame(
			array( $first, $second ),
			Users_Connection_Admin::get_connected_user_ids()
		);
	}

	/**
	 * A site that has never connected a user has no connected IDs.
	 */
	public function test_get_connected_user_ids_without_tokens() {
		$this->assertSame( array(), Users_Connection_Admin::get_connected_user_ids() );
	}

	/**
	 * The view is offered with a count once somebody is connected.
	 */
	public function test_connected_view_is_added_with_a_count() {
		$this->connect_user( 'connected_one' );
		$this->connect_user( 'connected_two' );

		$views = $this->create_admin()->add_connected_view( array( 'all' => '<a href="users.php">All</a>' ) );

		$this->assertArrayHasKey( Users_Connection_Admin::VIEW_CONNECTED, $views );
		$this->assertStringContainsString( 'Connected', $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
		$this->assertStringContainsString( '<span class="count">(2)</span>', $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
		$this->assertStringContainsString( Users_Connection_Admin::VIEW_QUERY_ARG, $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
	}

	/**
	 * Nothing is connected, so the view would only ever be empty.
	 */
	public function test_connected_view_is_absent_without_connected_users() {
		$views = $this->create_admin()->add_connected_view( array( 'all' => '<a href="users.php">All</a>' ) );

		$this->assertArrayNotHasKey( Users_Connection_Admin::VIEW_CONNECTED, $views );
	}

	/**
	 * A token can outlive the user it belonged to; the count follows the rows, not the tokens.
	 */
	public function test_connected_view_count_ignores_tokens_whose_user_is_gone() {
		$this->connect_user( 'connected_one' );

		$tokens         = (array) \Jetpack_Options::get_option( 'user_tokens' );
		$tokens[999999] = 'key.secret.999999';
		\Jetpack_Options::update_option( 'user_tokens', $tokens );

		$views = $this->create_admin()->add_connected_view( array() );

		// The orphaned token is still in the option, so the IDs the filter uses include it.
		$this->assertContains( 999999, Users_Connection_Admin::get_connected_user_ids() );
		$this->assertStringContainsString( '<span class="count">(1)</span>', $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
	}

	/**
	 * While the view is active it is the current one, and core's "All" gives up the highlight.
	 */
	public function test_connected_view_takes_the_current_highlight_from_all() {
		$this->connect_user( 'connected_one' );
		$this->activate_connected_view();

		$views = $this->create_admin()->add_connected_view(
			array( 'all' => '<a href="users.php" class="current" aria-current="page">All</a>' )
		);

		$this->assertStringContainsString( 'class="current"', $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
		$this->assertStringNotContainsString( 'class="current"', $views['all'] );
		$this->assertStringNotContainsString( 'aria-current', $views['all'] );
	}

	/**
	 * The view is just one of the links until it is selected.
	 */
	public function test_connected_view_is_not_current_by_default() {
		$this->connect_user( 'connected_one' );

		$views = $this->create_admin()->add_connected_view(
			array( 'all' => '<a href="users.php" class="current" aria-current="page">All</a>' )
		);

		$this->assertStringNotContainsString( 'class="current"', $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
		$this->assertStringContainsString( 'class="current"', $views['all'] );
	}

	/**
	 * Selecting the view narrows the list table to the users holding a token.
	 */
	public function test_query_is_narrowed_to_connected_users() {
		$first  = $this->connect_user( 'connected_one' );
		$second = $this->connect_user( 'connected_two' );
		$this->activate_connected_view();

		$args = $this->create_admin()->filter_query_to_connected_users( array( 'number' => 20 ) );

		$this->assertSame( array( $first, $second ), $args['include'] );
		$this->assertSame( 20, $args['number'] );
	}

	/**
	 * Every other users list is left alone.
	 */
	public function test_query_is_untouched_when_the_view_is_not_active() {
		$this->connect_user( 'connected_one' );

		$args = $this->create_admin()->filter_query_to_connected_users( array( 'number' => 20 ) );

		$this->assertArrayNotHasKey( 'include', $args );
	}

	/**
	 * Another plugin's `include` is narrowed, not replaced.
	 */
	public function test_query_intersects_an_existing_include() {
		$first = $this->connect_user( 'connected_one' );
		$this->connect_user( 'connected_two' );
		$this->activate_connected_view();

		$args = $this->create_admin()->filter_query_to_connected_users(
			array( 'include' => array( $first, $this->admin_id ) )
		);

		$this->assertSame( array( $first ), $args['include'] );
	}

	/**
	 * An empty `include` would list everybody, so an impossible ID is used instead.
	 */
	public function test_query_matches_nobody_when_no_user_is_connected() {
		$this->activate_connected_view();

		$args = $this->create_admin()->filter_query_to_connected_users( array() );

		$this->assertSame( array( 0 ), $args['include'] );
	}

	/**
	 * The same holds when the intersection with an existing `include` is empty.
	 */
	public function test_query_matches_nobody_when_the_intersection_is_empty() {
		$this->connect_user( 'connected_one' );
		$this->activate_connected_view();

		$args = $this->create_admin()->filter_query_to_connected_users(
			array( 'include' => array( $this->admin_id ) )
		);

		$this->assertSame( array( 0 ), $args['include'] );
	}
}
