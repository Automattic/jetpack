<?php
/**
 * Tests for the commenter's identity.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use WorDBless\BaseTestCase;

/**
 * Tests for the Identity class.
 */
class Identity_Test extends BaseTestCase {

	/**
	 * A logged-out reader gets no user, and whatever core remembers about them.
	 */
	public function test_logged_out_reader_has_no_user() {
		$settings = Identity::settings( 0 );

		$this->assertFalse( $settings['isLoggedIn'] );
		$this->assertNull( $settings['user'] );
		$this->assertSame( array( 'author', 'email', 'url' ), array_keys( $settings['commenter'] ) );
	}

	/**
	 * A returning guest's details are handed back so the fields can prefill.
	 */
	public function test_returning_guest_details_are_passed_through() {
		$_COOKIE[ 'comment_author_' . COOKIEHASH ]       = 'Ada Lovelace';
		$_COOKIE[ 'comment_author_email_' . COOKIEHASH ] = 'ada@example.com';
		$_COOKIE[ 'comment_author_url_' . COOKIEHASH ]   = 'https://example.com';

		$settings = Identity::settings( 0 );

		$this->assertSame( 'Ada Lovelace', $settings['commenter']['author'] );
		$this->assertSame( 'ada@example.com', $settings['commenter']['email'] );
		$this->assertSame( 'https://example.com', $settings['commenter']['url'] );

		unset(
			$_COOKIE[ 'comment_author_' . COOKIEHASH ],
			$_COOKIE[ 'comment_author_email_' . COOKIEHASH ],
			$_COOKIE[ 'comment_author_url_' . COOKIEHASH ]
		);
	}

	/**
	 * A reader logged in to this site gets a name, an avatar and a logout URL.
	 */
	public function test_logged_in_user_gets_an_identity() {
		$user_id = wp_insert_user(
			array(
				'user_login'   => 'grace',
				'user_email'   => 'grace@example.com',
				'user_pass'    => 'nope',
				'display_name' => 'Grace Hopper',
			)
		);
		wp_set_current_user( $user_id );

		$settings = Identity::settings( 0 );

		$this->assertTrue( $settings['isLoggedIn'] );
		$this->assertSame( 'Grace Hopper', $settings['user']['displayName'] );
		$this->assertNotEmpty( $settings['user']['logoutUrl'] );

		wp_set_current_user( 0 );
	}

	/**
	 * The logout URL reaches JavaScript usable, not HTML-escaped.
	 *
	 * Escaped output from wp_nonce_url() assigned straight onto an href turns
	 * _wpnonce into amp;_wpnonce.
	 */
	public function test_logout_url_is_not_html_escaped() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'katherine',
				'user_email' => 'katherine@example.com',
				'user_pass'  => 'nope',
			)
		);
		wp_set_current_user( $user_id );

		$settings = Identity::settings( 0 );

		$this->assertStringNotContainsString( '&amp;', $settings['user']['logoutUrl'] );
		$this->assertStringContainsString( '_wpnonce=', $settings['user']['logoutUrl'] );

		wp_set_current_user( 0 );
	}
}
