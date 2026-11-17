<?php
/**
 * User login rename test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class UserLoginRenameTest.
 */
class UserLoginRenameTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Creates a user with a known login.
	 *
	 * @param string $login Login to create the user with.
	 * @return int User ID.
	 */
	private function create_user( $login ) {
		return wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => wp_generate_password(),
				'user_email' => $login . '@example.com',
			)
		);
	}

	/**
	 * Reads user_login straight from the database, bypassing any cached user object.
	 *
	 * @param int $user_id User ID.
	 * @return string|null
	 */
	private function stored_login( $user_id ) {
		global $wpdb;

		return $wpdb->get_var( $wpdb->prepare( "SELECT user_login FROM $wpdb->users WHERE ID = %d", $user_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	}

	/**
	 * Writes user_login straight to the database, standing in for a competing worker.
	 *
	 * @param int    $user_id User ID.
	 * @param string $login   Login to set.
	 */
	private function set_login( $user_id, $login ) {
		global $wpdb;

		$wpdb->update( $wpdb->users, array( 'user_login' => $login ), array( 'ID' => $user_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		clean_user_cache( $user_id );
	}

	public function test_renames_the_login() {
		$user_id = $this->create_user( 'oldlogin' );

		$result = wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );

		$this->assertSame( WPCOMSH_USER_LOGIN_RENAMED, $result );
		$this->assertSame( 'newlogin', $this->stored_login( $user_id ) );
	}

	/**
	 * The old login must stop resolving, which is what a stale `userlogins` cache key would keep doing.
	 */
	public function test_clears_the_cache_for_both_logins() {
		$user_id = $this->create_user( 'oldlogin' );
		get_user_by( 'login', 'oldlogin' );

		wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );

		$this->assertFalse( get_user_by( 'login', 'oldlogin' ) );
		$this->assertSame( $user_id, get_user_by( 'login', 'newlogin' )->ID );
	}

	/**
	 * A re-delivery is a success, not a failure.
	 */
	public function test_repeating_an_applied_rename_reports_already_applied() {
		$user_id = $this->create_user( 'newlogin' );

		$result = wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );

		$this->assertSame( WPCOMSH_USER_LOGIN_ALREADY_APPLIED, $result );
		$this->assertSame( 'newlogin', $this->stored_login( $user_id ) );
	}

	/**
	 * A delayed A to B rename must not revert a B to C rename that already landed.
	 */
	public function test_stale_rename_does_not_revert_a_newer_one() {
		$user_id = $this->create_user( 'login_c' );

		$result = wpcomsh_rename_user_login( $user_id, 'login_a', 'login_b' );

		$this->assertSame( WPCOMSH_USER_LOGIN_SUPERSEDED, $result );
		$this->assertSame( 'login_c', $this->stored_login( $user_id ) );
	}

	public function test_reports_a_taken_login_without_changing_anything() {
		$squatter_id = $this->create_user( 'wanted' );
		$user_id     = $this->create_user( 'oldlogin' );

		$result = wpcomsh_rename_user_login( $user_id, 'oldlogin', 'wanted' );

		$this->assertWPError( $result );
		$this->assertSame( 'login_taken', $result->get_error_code() );
		$this->assertSame( $squatter_id, $result->get_error_data()['holder_user_id'] );
		$this->assertSame( 'oldlogin', $this->stored_login( $user_id ) );
		$this->assertSame( 'wanted', $this->stored_login( $squatter_id ) );
	}

	/**
	 * Two workers racing the same rename: the second must not report its own row as a collision.
	 */
	public function test_our_own_row_holding_the_target_is_already_applied() {
		$user_id = $this->create_user( 'oldlogin' );

		// Stand in for the other worker finishing between our read and our write.
		$this->set_login( $user_id, 'newlogin' );

		$result = wpcomsh_write_user_login( $user_id, 'oldlogin', 'newlogin' );

		$this->assertSame( WPCOMSH_USER_LOGIN_ALREADY_APPLIED, $result );
		$this->assertSame( 'newlogin', $this->stored_login( $user_id ) );
	}

	/**
	 * A lost compare-and-set is a superseded rename, not a database error worth retrying.
	 */
	public function test_losing_the_compare_and_set_is_superseded() {
		$user_id = $this->create_user( 'oldlogin' );

		$this->set_login( $user_id, 'login_c' );

		$result = wpcomsh_write_user_login( $user_id, 'oldlogin', 'newlogin' );

		$this->assertSame( WPCOMSH_USER_LOGIN_SUPERSEDED, $result );
		$this->assertSame( 'login_c', $this->stored_login( $user_id ) );
	}

	/**
	 * A login WordPress would refuse to create is refused here too.
	 *
	 * @param string $login Login to attempt.
	 *
	 * @dataProvider data_invalid_logins
	 */
	#[DataProvider( 'data_invalid_logins' )]
	public function test_rejects_an_invalid_login( $login ) {
		$user_id = $this->create_user( 'oldlogin' );

		$result = wpcomsh_rename_user_login( $user_id, 'oldlogin', $login );

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_login', $result->get_error_code() );
		$this->assertSame( 'oldlogin', $this->stored_login( $user_id ) );
	}

	/**
	 * Logins that sanitize_user() would alter or empty.
	 *
	 * @return array[]
	 */
	public static function data_invalid_logins() {
		return array(
			'empty'                          => array( '' ),
			'sanitize_user() would alter it' => array( '<b>bold</b>' ),
		);
	}

	/**
	 * An unknown user ID is reported rather than silently doing nothing.
	 */
	public function test_reports_a_missing_user() {
		$result = wpcomsh_rename_user_login( 999999, 'oldlogin', 'newlogin' );

		$this->assertWPError( $result );
		$this->assertSame( 'user_not_found', $result->get_error_code() );
	}

	public function test_fires_an_action_with_both_logins() {
		$user_id = $this->create_user( 'oldlogin' );
		$fired   = array();

		add_action(
			'wpcomsh_user_login_renamed',
			function ( $id, $old, $new ) use ( &$fired ) {
				$fired[] = array( $id, $old, $new );
			},
			10,
			3
		);

		wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );

		$this->assertSame( array( array( $user_id, 'oldlogin', 'newlogin' ) ), $fired );
	}
}
