<?php
/**
 * Tests for the Jetpack Comments module.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../../../modules/comments/comments.php';

/**
 * @covers \Jetpack_Comments
 */
#[CoversClass( Jetpack_Comments::class )]
class Jetpack_Comments_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A stored `$1` that a preg_replace() sink would expand into the captured quote,
	 * breaking out of the avatar src attribute.
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
	 * comment_form_before() must not start an output buffer when comments are closed.
	 */
	public function test_comment_form_before_does_not_buffer_when_comments_closed() {
		$GLOBALS['post'] = get_post(
			self::factory()->post->create( array( 'comment_status' => 'closed' ) )
		);

		$level_before = ob_get_level();
		Jetpack_Comments::init()->comment_form_before();
		$level_after = ob_get_level();

		unset( $GLOBALS['post'] );
		$this->assertSame( $level_before, $level_after );
	}

	/**
	 * comment_form_after() must not clean an output buffer when comments are closed.
	 */
	public function test_comment_form_after_does_not_clean_buffer_when_comments_closed() {
		$GLOBALS['post'] = get_post(
			self::factory()->post->create( array( 'comment_status' => 'closed' ) )
		);

		ob_start();
		$level_before = ob_get_level();
		Jetpack_Comments::init()->comment_form_after();
		$level_after  = ob_get_level();
		$buffered     = ob_get_clean();

		unset( $GLOBALS['post'] );
		$this->assertSame( $level_before, $level_after );
		$this->assertSame( '', $buffered );
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
}
