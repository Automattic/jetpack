<?php
/**
 * Old author slug redirect test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class AuthorSlugRedirectTest.
 */
class AuthorSlugRedirectTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Creates a user with a unique login and the given author slug.
	 *
	 * @param string $slug Author slug to create the user with.
	 * @return int User ID.
	 */
	private function create_user( $slug ) {
		$login = uniqid( 'user' );

		return wp_insert_user(
			array(
				'user_login'    => $login,
				'user_nicename' => $slug,
				'user_pass'     => wp_generate_password(),
				'user_email'    => $login . '@example.com',
			)
		);
	}

	/**
	 * Changes a user's author slug the way WordPress.com's `wp user update` push does.
	 *
	 * @param int    $user_id User ID.
	 * @param string $slug    New author slug.
	 */
	private function set_slug( $user_id, $slug ) {
		wp_update_user(
			array(
				'ID'            => $user_id,
				'user_nicename' => $slug,
			)
		);
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
		$user_id = $this->create_user( 'oldslug' );
		$this->set_slug( $user_id, 'newslug' );

		$this->query_author( 'oldslug', $query );

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

	public function test_an_update_that_keeps_the_slug_records_nothing() {
		$user_id = $this->create_user( 'oldslug' );

		wp_update_user(
			array(
				'ID'           => $user_id,
				'display_name' => 'Someone Else',
			)
		);

		$this->assertSame( array(), get_user_meta( $user_id, WPCOMSH_OLD_AUTHOR_SLUG_META, false ) );
	}

	/**
	 * Someone who later takes the old slug keeps their archive.
	 */
	public function test_a_live_slug_is_not_redirected() {
		$user_id = $this->create_user( 'oldslug' );
		$this->set_slug( $user_id, 'newslug' );
		$this->create_user( 'oldslug' );

		$this->query_author( 'oldslug' );

		$this->assertNull( wpcomsh_get_old_author_slug_redirect_url() );
	}

	/**
	 * Taking a slug back must stop it redirecting, or the user's own archive would redirect away.
	 */
	public function test_taking_a_slug_back_clears_its_redirect() {
		$user_id = $this->create_user( 'oldslug' );
		$this->set_slug( $user_id, 'newslug' );
		$this->set_slug( $user_id, 'oldslug' );

		$this->assertSame( array( 'newslug' ), get_user_meta( $user_id, WPCOMSH_OLD_AUTHOR_SLUG_META, false ) );
	}

	/**
	 * Each change leaves its slug behind, so a link from two changes ago still resolves.
	 */
	public function test_redirects_every_earlier_slug() {
		$user_id = $this->create_user( 'slug_a' );
		$this->set_slug( $user_id, 'slug_b' );
		$this->set_slug( $user_id, 'slug_c' );

		$this->query_author( 'slug_a' );

		$this->assertSame( get_author_posts_url( $user_id ), wpcomsh_get_old_author_slug_redirect_url() );
	}

	/**
	 * When two users have left the same slug, it redirects to the one who left it last.
	 */
	public function test_an_old_slug_redirects_to_the_user_who_left_it_last() {
		$first_id = $this->create_user( 'shared' );
		$this->set_slug( $first_id, 'first_after' );

		$second_id = $this->create_user( 'shared' );
		$this->set_slug( $second_id, 'second_after' );

		$this->query_author( 'shared' );

		$this->assertSame( get_author_posts_url( $second_id ), wpcomsh_get_old_author_slug_redirect_url() );
	}
}
