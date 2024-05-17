<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * The nonce handler tests.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;

/**
 * The nonce handler tests.
 */
class Test_Connection_Notice extends TestCase {

	/**
	 * Database query filter.
	 *
	 * @var callable
	 */
	private $users_query_filter;

	/**
	 * Fake users created by the tests.
	 *
	 * @var array
	 */
	private $fake_users = array();

	/**
	 * Testing the "need to connect first" notice.
	 */
	public function test_delete_user_connect_notice() {
		$tokens = \Jetpack_Options::get_option( 'user_tokens' );
		\Jetpack_Options::update_option( 'user_tokens', array_slice( $tokens, 0, 1, true ) );

		$notice = new Connection_Notice();

		$this->expectOutputRegex( '#Connect to WordPress.com#i' );

		$this->expectOutputRegex( '#https:\/\/jetpack\.wordpress\.com\/jetpack\.authorize\/1\/\?response_type=code#i' ); // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText

		$notice->delete_user_update_connection_owner_notice();

		\Jetpack_Options::update_option( 'user_tokens', $tokens );
	}

	/**
	 * Testing the "choose new owner" notice.
	 */
	public function test_delete_user_change_owner_notice() {
		$notice = new Connection_Notice();

		$this->expectOutputRegex( '#Set new connection owner#i' );
		$this->expectOutputRegex( '#' . preg_quote( 'http:\/\/example.org\/index.php?rest_route=\/jetpack\/v4\/connection\/owner', '#' ) . '#i' );

		$notice->delete_user_update_connection_owner_notice();
	}

	/**
	 * Set up the environment.
	 *
	 * @before
	 *
	 * @return void
	 */
	protected function set_up() {
		global $current_screen;

		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', '12345' );

		$id_admin           = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		$this->fake_users[] = $id_admin;

		$id_admin2          = wp_insert_user(
			array(
				'user_login' => 'admin2',
				'user_pass'  => 'pass2',
				'role'       => 'administrator',
			)
		);
		$this->fake_users[] = $id_admin2;
		wp_set_current_user( $id_admin2 );

		set_transient( 'jetpack_connected_user_data_' . $id_admin2, array( 'ID' => '12345' ) );

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$current_screen       = \WP_Screen::get();
		$current_screen->base = 'users';

		$_REQUEST['action'] = 'delete';
		$_REQUEST['user']   = $id_admin;

		$admin_role = get_role( 'administrator' );
		$admin_role->add_cap( 'jetpack_disconnect', true );

		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
		Constants::set_constant( 'JETPACK__API_VERSION', '1' );

		\Jetpack_Options::update_option(
			'user_tokens',
			array(
				$id_admin  => 'asd123.asd123.' . $id_admin,
				$id_admin2 => 'asd123.asd123.' . $id_admin2,
			)
		);
		\Jetpack_Options::update_option( 'master_user', $id_admin );

		$this->users_query_filter = function ( $result, $query ) {
			if ( str_starts_with( trim( $query ), 'SELECT wp_users.user_registered' )
				&& preg_match( '#wp_usermeta\.meta_value LIKE \'\{.*?\}"administrator"\{.*?\}\'#i', $query )
			) {
				return array( (object) array( 'user_registered' => '2012-03-19 00:00:00' ) );
			}

			return $result;
		};

		add_filter( 'wordbless_wpdb_query_results', $this->users_query_filter, 10, 2 );
	}

	/**
	 * Clean up.
	 *
	 * @after
	 *
	 * @return void
	 */
	protected function tear_down() {
		global $current_screen;

		delete_transient( 'jetpack_connected_user_data_' . get_current_user_id() );

		unset( $current_screen );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		unset( $_REQUEST['action'] );

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		unset( $_REQUEST['user'] );

		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'user_tokens' );
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'master_user' );

		remove_filter( 'wordbless_wpdb_query_results', $this->users_query_filter, 10 );

		Constants::clear_constants();

		wp_destroy_current_session();

		foreach ( $this->fake_users as $user_id ) {
			wp_delete_user( $user_id );
		}

		$admin_role = get_role( 'administrator' );
		$admin_role->remove_cap( 'jetpack_disconnect' );
	}
}
