<?php
/**
 * Test class for Verbum_Comments.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/verbum-comments/class-verbum-comments.php';

/**
 * Test class for Verbum_Comments.
 *
 * @coversDefaultClass Verbum_Comments
 */
class Verbum_Comments_Test extends \WorDBless\BaseTestCase {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		remove_all_filters( 'comment_text' );
		remove_all_filters( 'pre_comment_content' );
		new \Automattic\Jetpack\Verbum_Comments();
	}

	/**
	 * Ensure string comments are not modified when 'render_verbum_blocks' is applied
	 *
	 * @covers Verbum_Comments::render_verbum_blocks
	 */
	public function test_comment_text_string_comment() {
		$comment_content  = 'This is a test comment';
		$filtered_content = apply_filters( 'comment_text', $comment_content );
		$this->assertEquals( $comment_content, $filtered_content );
	}

	/**
	 * Ensure blocks are filtered when 'render_verbum_blocks' is applied
	 *
	 * @covers Verbum_Comments::render_verbum_blocks
	 */
	public function test_comment_text_block_sanitization() {
		$comment_content  = '<!-- wp:paragraph -->Testing<!-- /wp:paragraph --><!-- wp:latest-posts -->';
		$filtered_content = apply_filters( 'comment_text', $comment_content );
		$this->assertEquals( 'Testing', $filtered_content );
	}

	/**
	 * Ensure innerBlocks are filtered when 'render_verbum_blocks' is applied
	 *
	 * @covers Verbum_Comments::render_verbum_blocks
	 */
	public function test_comment_text_block_sanitization_inner_blocks() {
		$comment_content  = '<!-- wp:paragraph {} --><!-- wp:latest-posts --><!-- /wp:paragraph -->';
		$filtered_content = apply_filters( 'comment_text', $comment_content );
		$this->assertSame( '', $filtered_content );
	}

	/**
	 * Ensure string comments are not modified when 'pre_comment_content' is applied
	 *
	 * @covers Verbum_Comments::remove_blocks
	 */
	public function test_pre_comment_content_string_comment() {
		$comment_content  = 'This is a test comment';
		$filtered_content = apply_filters( 'pre_comment_content', $comment_content );

		$this->assertEquals( $comment_content, $filtered_content );
	}

	/**
	 * Ensure blocks are filtered when 'pre_comment_content' is applied
	 *
	 * @covers Verbum_Comments::remove_blocks
	 */
	public function test_pre_comment_content__block_sanitization() {
		$comment_content  = '<!-- wp:paragraph -->Testing<!-- /wp:paragraph --><!-- wp:latest-posts -->';
		$filtered_content = apply_filters( 'pre_comment_content', $comment_content );
		$this->assertEquals( '<!-- wp:paragraph -->Testing<!-- /wp:paragraph -->', $filtered_content );
	}

	/**
	 * Ensure innerBlocks are filtered when 'pre_comment_content' is applied
	 *
	 * @covers Verbum_Comments::remove_blocks
	 */
	public function test_pre_comment_content_block_sanitization_inner_blocks() {
		$comment_content  = '<!-- wp:paragraph {} --><!-- wp:latest-posts --><!-- /wp:paragraph -->';
		$filtered_content = apply_filters( 'pre_comment_content', $comment_content );
		$this->assertEquals( '<!-- wp:paragraph /-->', $filtered_content );
	}
}
