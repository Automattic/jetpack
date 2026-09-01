<?php
/**
 * Tests for the Jetpack Comments module (JETPACK-2407 hardening).
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/../../../../modules/comments/comments.php';

/**
 * @covers Jetpack_Comments
 */
class Jetpack_Comments_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The XSS payload from HackerOne #3955911: a stored `$1` that the old sink expanded
	 * into the captured quote, breaking out of the avatar src attribute.
	 */
	const XSS_AVATAR = 'https://graph.facebook.com/x?$1onerror=alert(document.domain)//';

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		update_option( 'show_avatars', 1 );
		// Registering the singleton wires the get_avatar filter under test.
		Jetpack_Comments::init();
		$_POST = array();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		$_POST = array();
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		parent::tear_down();
	}

	/**
	 * A stored Facebook avatar must never inject an event handler into the rendered <img>.
	 */
	public function test_get_avatar_does_not_break_out_of_the_src_attribute() {
		$post_id    = self::factory()->post->create();
		$comment_id = self::factory()->comment->create( array( 'comment_post_ID' => $post_id ) );
		add_comment_meta( $comment_id, 'hc_avatar', self::XSS_AVATAR, true );

		$html = get_avatar( get_comment( $comment_id ) );

		$this->assertStringContainsString( '<img', $html );
		$this->assertStringNotContainsString( "'onerror", $html );
		$this->assertStringNotContainsString( '"onerror', $html );
		$this->assertStringNotContainsString( ' onerror=', $html );
	}

	/**
	 * An unsigned Highlander request (e.g. Carousel's nopriv AJAX) must not store identity meta.
	 */
	public function test_add_comment_meta_skips_unsigned_highlander_request() {
		$post_id    = self::factory()->post->create();
		$comment_id = self::factory()->comment->create( array( 'comment_post_ID' => $post_id ) );

		$_POST = array(
			'hc_post_as' => 'facebook',
			'hc_avatar'  => self::XSS_AVATAR,
			'hc_userid'  => '12345',
		);

		Jetpack_Comments::init()->add_comment_meta( $comment_id );

		$this->assertSame( '', get_comment_meta( $comment_id, 'hc_avatar', true ) );
		$this->assertSame( '', get_comment_meta( $comment_id, 'hc_post_as', true ) );
	}

	/**
	 * A validly signed Highlander request still stores its identity meta, sanitized.
	 */
	public function test_add_comment_meta_stores_signed_highlander_request() {
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'testkey.testsecret' );

		$post_id    = self::factory()->post->create();
		$comment_id = self::factory()->comment->create( array( 'comment_post_ID' => $post_id ) );

		$_POST = array(
			'hc_post_as'      => 'facebook',
			'hc_avatar'       => 'https://graph.facebook.com/12345/picture',
			'hc_userid'       => '12345',
			'token_key'       => 'testkey',
			'comment_post_ID' => (string) $post_id,
		);
		$_POST['sig'] = Jetpack_Comments::sign_remote_comment_parameters( $_POST, 'testkey.testsecret' );

		Jetpack_Comments::init()->add_comment_meta( $comment_id );

		$this->assertSame( 'https://graph.facebook.com/12345/picture', get_comment_meta( $comment_id, 'hc_avatar', true ) );
		$this->assertSame( '12345', get_comment_meta( $comment_id, 'hc_foreign_user_id', true ) );
		$this->assertSame( 'facebook', get_comment_meta( $comment_id, 'hc_post_as', true ) );
	}
}
