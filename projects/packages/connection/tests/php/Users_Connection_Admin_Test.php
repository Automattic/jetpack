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
		remove_all_actions( 'restrict_manage_users' );
		remove_all_filters( 'users_pre_query' );

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
	 * Answer the count's WP_User_Query with the given IDs.
	 *
	 * WorDBless runs no user query, so the count would always be zero and every assertion
	 * below would pass for the wrong reason. `users_pre_query` is WordPress's own
	 * short-circuit, so the counting code still runs exactly as it does in production.
	 *
	 * @param int[] $ids IDs the query should return.
	 */
	private function answer_user_query_with( array $ids ) {
		add_filter(
			'users_pre_query',
			static function () use ( $ids ) {
				return $ids;
			}
		);
	}

	/**
	 * Render the view with the count query answered by the given IDs.
	 *
	 * @param int[] $ids   IDs the count query should return.
	 * @param array $views Views to filter.
	 * @return array
	 */
	private function views_counting( array $ids, $views = array() ) {
		$this->answer_user_query_with( $ids );

		return Users_Connection_Admin::add_connected_view( $views );
	}

	/**
	 * The view's hooks are registered alongside the column's.
	 */
	public function test_init_registers_the_connected_view_hooks() {
		$admin = $this->create_admin();

		$admin->init();

		$this->assertIsInt( has_filter( 'views_users', array( Users_Connection_Admin::class, 'add_connected_view' ) ) );
		$this->assertIsInt( has_filter( 'users_list_table_query_args', array( Users_Connection_Admin::class, 'filter_query_to_connected_users' ) ) );
		$this->assertIsInt( has_action( 'restrict_manage_users', array( Users_Connection_Admin::class, 'keep_connected_view_on_submit' ) ) );
	}

	/**
	 * Searching from the connected view keeps the view, rather than silently searching everybody.
	 */
	public function test_connected_view_survives_a_form_submission() {
		$this->activate_connected_view();

		ob_start();
		Users_Connection_Admin::keep_connected_view_on_submit( 'top' );
		$field = ob_get_clean();

		$this->assertStringContainsString( 'type="hidden"', $field );
		$this->assertStringContainsString( 'name="' . Users_Connection_Admin::VIEW_QUERY_ARG . '"', $field );
		$this->assertStringContainsString( 'value="' . Users_Connection_Admin::VIEW_CONNECTED . '"', $field );
	}

	/**
	 * Both tablenavs share one form, so the field is rendered once.
	 */
	public function test_connected_view_field_is_not_repeated_in_the_second_tablenav() {
		$this->activate_connected_view();

		ob_start();
		Users_Connection_Admin::keep_connected_view_on_submit( 'bottom' );

		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * Nothing is carried when the view is not active.
	 */
	public function test_no_hidden_field_without_the_connected_view() {
		ob_start();
		Users_Connection_Admin::keep_connected_view_on_submit( 'top' );

		$this->assertSame( '', ob_get_clean() );
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
		$first  = $this->connect_user( 'connected_one' );
		$second = $this->connect_user( 'connected_two' );

		$views = $this->views_counting( array( $first, $second ), array( 'all' => '<a href="users.php">All</a>' ) );

		$this->assertArrayHasKey( Users_Connection_Admin::VIEW_CONNECTED, $views );
		$this->assertStringContainsString( 'Connected', $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
		$this->assertStringContainsString( '<span class="count">(2)</span>', $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
		$this->assertStringContainsString( Users_Connection_Admin::VIEW_QUERY_ARG, $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
	}

	/**
	 * Nobody connected is a member of this site, so the view would only ever be empty.
	 */
	public function test_connected_view_is_absent_without_connected_users() {
		$this->connect_user( 'removed_from_this_site' );

		$views = $this->views_counting( array(), array( 'all' => '<a href="users.php">All</a>' ) );

		$this->assertArrayNotHasKey( Users_Connection_Admin::VIEW_CONNECTED, $views );
	}

	/**
	 * The count asks only for the token holders, and only for their IDs.
	 */
	public function test_the_count_query_is_scoped_to_token_holders() {
		$first  = $this->connect_user( 'connected_one' );
		$second = $this->connect_user( 'connected_two' );

		$query_vars = null;
		add_filter(
			'users_pre_query',
			static function ( $results, $query ) use ( &$query_vars ) {
				$query_vars = $query->query_vars;

				return array();
			},
			10,
			2
		);

		Users_Connection_Admin::add_connected_view( array() );

		$this->assertSame( array( $first, $second ), $query_vars['include'] );
		$this->assertSame( 'ID', $query_vars['fields'] );
	}

	/**
	 * No tokens means no count, and no reason to ask the database.
	 */
	public function test_connected_view_is_absent_without_tokens() {
		$views = Users_Connection_Admin::add_connected_view( array() );

		$this->assertArrayNotHasKey( Users_Connection_Admin::VIEW_CONNECTED, $views );
	}

	/**
	 * A token can outlive the user it belonged to. The filter still passes the ID on — it
	 * simply matches no row — and the count query is what leaves it out.
	 */
	public function test_an_orphaned_token_still_reaches_the_query() {
		$connected = $this->connect_user( 'connected_one' );

		$tokens         = (array) \Jetpack_Options::get_option( 'user_tokens' );
		$tokens[999999] = 'key.secret.999999';
		\Jetpack_Options::update_option( 'user_tokens', $tokens );
		$this->activate_connected_view();

		$args = Users_Connection_Admin::filter_query_to_connected_users( array() );

		$this->assertSame( array( $connected, 999999 ), $args['include'] );
	}

	/**
	 * While the view is active it is the current one, and core's "All" gives up the highlight.
	 */
	public function test_connected_view_takes_the_current_highlight_from_all() {
		$this->activate_connected_view();
		$connected = $this->connect_user( 'connected_one' );

		$views = $this->views_counting( array( $connected ), array( 'all' => '<a href="users.php" class="current" aria-current="page">All</a>' ) );

		$this->assertStringContainsString( 'class="current"', $views[ Users_Connection_Admin::VIEW_CONNECTED ] );
		$this->assertStringNotContainsString( 'class="current"', $views['all'] );
		$this->assertStringNotContainsString( 'aria-current', $views['all'] );
	}

	/**
	 * The view is just one of the links until it is selected.
	 */
	public function test_connected_view_is_not_current_by_default() {
		$connected = $this->connect_user( 'connected_one' );

		$views = $this->views_counting( array( $connected ), array( 'all' => '<a href="users.php" class="current" aria-current="page">All</a>' ) );

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

		$args = Users_Connection_Admin::filter_query_to_connected_users( array( 'number' => 20 ) );

		$this->assertSame( array( $first, $second ), $args['include'] );
		$this->assertSame( 20, $args['number'] );
	}

	/**
	 * Every other users list is left alone.
	 */
	public function test_query_is_untouched_when_the_view_is_not_active() {
		$this->connect_user( 'connected_one' );

		$args = Users_Connection_Admin::filter_query_to_connected_users( array( 'number' => 20 ) );

		$this->assertArrayNotHasKey( 'include', $args );
	}

	/**
	 * Another plugin's `include` is narrowed, not replaced.
	 */
	public function test_query_intersects_an_existing_include() {
		$first = $this->connect_user( 'connected_one' );
		$this->connect_user( 'connected_two' );
		$this->activate_connected_view();

		$args = Users_Connection_Admin::filter_query_to_connected_users(
			array( 'include' => array( $first, $this->admin_id ) )
		);

		$this->assertSame( array( $first ), $args['include'] );
	}

	/**
	 * An empty `include` would list everybody, so an impossible ID is used instead.
	 */
	public function test_query_matches_nobody_when_no_user_is_connected() {
		$this->activate_connected_view();

		$args = Users_Connection_Admin::filter_query_to_connected_users( array() );

		$this->assertSame( array( 0 ), $args['include'] );
	}

	/**
	 * The same holds when the intersection with an existing `include` is empty.
	 */
	public function test_query_matches_nobody_when_the_intersection_is_empty() {
		$this->connect_user( 'connected_one' );
		$this->activate_connected_view();

		$args = Users_Connection_Admin::filter_query_to_connected_users(
			array( 'include' => array( $this->admin_id ) )
		);

		$this->assertSame( array( 0 ), $args['include'] );
	}
}
