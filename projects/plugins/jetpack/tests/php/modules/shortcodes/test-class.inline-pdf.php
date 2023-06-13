<?php
/**
 * Unit test for Inline PDF embeds.
 *
 * @package automattic/jetpack
 * @since   8.4
 */

// Dummy comment so phpcs sees the above as a file doc comment.
require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * Unit test for Inline PDF embeds.
 */
class WP_Test_Jetpack_Shortcodes_Inline_Pdfs extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * After a test method runs, reset any state in WordPress the test method might have changed.
	 */
	public function tear_down() {
		wp_reset_postdata();
		parent::tear_down();
	}

	/**
	 * Unit test for Inline PDF embeds.
	 *
	 * @author lancewillett
	 * @covers ::jetpack_inline_pdf_embed_handler
	 * @since  8.4.0
	 */
	public function test_shortcodes_inline_pdf() {
		global $post;

		$url      = 'https://jetpackme.files.wordpress.com/2017/08/jetpack-tips-for-hosts.pdf';
		$filename = 'jetpack-tips-for-hosts.pdf';
		$post     = self::factory()->post->create_and_get( array( 'post_content' => $url ) );

		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();

		$this->assertStringContainsString(
			sprintf(
				'<p><a href="%1$s" target="_blank" rel="noopener noreferrer nofollow">Click to access %2$s</a></p>' . "\n",
				$url,
				$filename
			),
			$actual
		);
	}
}
