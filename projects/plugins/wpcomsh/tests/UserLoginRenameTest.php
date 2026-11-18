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
	 * @param array  $extra Other fields to pass to wp_insert_user().
	 * @return int User ID.
	 */
	private function create_user( $login, $extra = array() ) {
		return wp_insert_user(
			$extra + array(
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

	/**
	 * Runs the main query for an author archive.
	 *
	 * Not go_to(): it fires `parse_request`, where private-site exits with a login page on a private test site.
	 *
	 * @param string $slug  Author slug to request.
	 * @param string $query Further query string, starting with `&`.
	 */
	private function query_author( $slug, $query = '' ) {
		$GLOBALS['wp_query']->query( 'author_name=' . $slug . $query );
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
			'no usable author slug'          => array( '...' ),
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

	public function test_moves_the_slug_and_nickname_but_not_the_display_name() {
		$user_id = $this->create_user( 'oldlogin' );

		wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );

		$user = get_userdata( $user_id );
		$this->assertSame( 'newlogin', $user->user_nicename );
		$this->assertSame( 'newlogin', $user->nickname );
		$this->assertSame( 'oldlogin', $user->display_name );
	}

	public function test_keeps_names_the_user_chose() {
		$user_id = $this->create_user(
			'oldlogin',
			array(
				'user_nicename' => 'jane',
				'nickname'      => 'JD',
			)
		);

		wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );

		$user = get_userdata( $user_id );
		$this->assertSame( 'jane', $user->user_nicename );
		$this->assertSame( 'JD', $user->nickname );
		$this->assertSame( array(), get_user_meta( $user_id, WPCOMSH_OLD_AUTHOR_SLUG_META, false ) );
	}

	/**
	 * A rename whose profile update failed reports it, and a re-run with the same arguments repairs it.
	 */
	public function test_a_failed_profile_update_is_reported_and_repaired_by_a_re_run() {
		$user_id = $this->create_user( 'oldlogin' );

		add_filter( 'pre_user_nicename', '__return_empty_string' );
		$result = wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );
		remove_filter( 'pre_user_nicename', '__return_empty_string' );

		$this->assertWPError( $result );
		$this->assertSame( 'profile_update_failed', $result->get_error_code() );
		$this->assertSame( 'newlogin', $this->stored_login( $user_id ) );

		$result = wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );

		$this->assertSame( WPCOMSH_USER_LOGIN_ALREADY_APPLIED, $result );
		$this->assertSame( 'newlogin', get_userdata( $user_id )->user_nicename );
	}

	/**
	 * Releasing the user's lock before the profile update lets an overlapping A to B rename
	 * write B's names over a B to C rename.
	 */
	public function test_the_profile_update_runs_under_the_user_lock() {
		global $wpdb;

		$user_id = $this->create_user( 'oldlogin' );
		$holder  = null;

		add_action(
			'profile_update',
			function () use ( $wpdb, $user_id, &$holder ) {
				$holder = $wpdb->get_var( $wpdb->prepare( 'SELECT IS_USED_LOCK(%s)', 'wpcomsh_rename_user_' . $user_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			}
		);

		wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );

		$this->assertNotNull( $holder );
	}

	/**
	 * Only a slug WordPress derived from the old login moves with it.
	 *
	 * @param string $slug     The user's author slug.
	 * @param string $login    The login it may derive from.
	 * @param bool   $expected Whether it is that login's default slug.
	 *
	 * @dataProvider data_author_slugs
	 */
	#[DataProvider( 'data_author_slugs' )]
	public function test_recognizes_a_default_author_slug( $slug, $login, $expected ) {
		$this->assertSame( $expected, wpcomsh_is_default_author_slug( $slug, $login ) );
	}

	/**
	 * Slugs and whether wp_insert_user() would have derived them from the login.
	 *
	 * @return array[]
	 */
	public static function data_author_slugs() {
		$long = str_repeat( 'a', 60 );

		return array(
			'same as the login'               => array( 'oldlogin', 'oldlogin', true ),
			'sanitized from the login'        => array( 'old-login', 'old.login', true ),
			'suffixed after a collision'      => array( 'oldlogin-2', 'oldlogin', true ),
			'long login, cut to 50'           => array( str_repeat( 'a', 50 ), $long, true ),
			'long login, cut for the suffix'  => array( str_repeat( 'a', 48 ) . '-2', $long, true ),
			'chosen by the user'              => array( 'jane', 'oldlogin', false ),
			'suffix on another login\'s slug' => array( 'other-2', 'oldlogin', false ),
		);
	}

	/**
	 * An old archive, feed or page link lands on the same view under the new slug.
	 *
	 * @param string $query    Query string requesting the old slug.
	 * @param string $expected Name of the URL builder the redirect must match.
	 *
	 * @dataProvider data_old_author_slug_requests
	 */
	#[DataProvider( 'data_old_author_slug_requests' )]
	public function test_redirects_an_old_author_slug( $query, $expected ) {
		$user_id = $this->create_user( 'oldlogin' );
		wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );

		$this->query_author( 'oldlogin', $query );

		$urls = array(
			'archive' => get_author_posts_url( $user_id ),
			'feed'    => get_author_feed_link( $user_id, 'atom' ),
			'paged'   => add_query_arg( 'paged', 2, get_author_posts_url( $user_id ) ),
		);
		$this->assertSame( $urls[ $expected ], wpcomsh_get_old_author_slug_redirect_url() );
	}

	/**
	 * Requests for the old slug and where each must land.
	 *
	 * @return array[]
	 */
	public static function data_old_author_slug_requests() {
		return array(
			'archive' => array( '', 'archive' ),
			'feed'    => array( '&feed=atom', 'feed' ),
			'paged'   => array( '&paged=2', 'paged' ),
		);
	}

	/**
	 * Someone who later takes the old slug keeps their archive.
	 */
	public function test_a_live_slug_is_not_redirected() {
		$user_id = $this->create_user( 'oldlogin' );
		wpcomsh_rename_user_login( $user_id, 'oldlogin', 'newlogin' );
		$this->create_user( 'oldlogin', array( 'user_email' => 'other@example.com' ) );

		$this->query_author( 'oldlogin' );

		$this->assertNull( wpcomsh_get_old_author_slug_redirect_url() );
	}

	/**
	 * Each rename leaves its slug behind, so a link from two renames ago still resolves.
	 */
	public function test_redirects_every_earlier_slug() {
		$user_id = $this->create_user( 'login_a' );
		wpcomsh_rename_user_login( $user_id, 'login_a', 'login_b' );
		wpcomsh_rename_user_login( $user_id, 'login_b', 'login_c' );

		$this->query_author( 'login_a' );

		$this->assertSame( get_author_posts_url( $user_id ), wpcomsh_get_old_author_slug_redirect_url() );
	}
}
