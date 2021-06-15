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
	public function tearDown() {
		wp_reset_postdata();
		parent::tearDown();
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
		$post     = $this->factory()->post->create_and_get( array( 'post_content' => $url ) );

		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();

		$this->assertContains(
			sprintf(
				'<p><object data="%1$s" type="application/pdf" width="100%%" height="800" style="height: 800px;"><p><a href="%1$s">Click to access %2$s</a></p></object></p>' . "\n",
				$url,
				$filename
			),
			$actual
		);
	}

	/**
	 * Test Inline PDFs on AMP views.
	 *
	 * @covers ::jetpack_inline_pdf_embed_handler
	 * @since 8.4.0
	 */
	public function test_shortcodes_inline_pdf_amp() {
		global $post;

		$url  = 'https://jetpackme.files.wordpress.com/2017/08/jetpack-tips-for-hosts.pdf';
		$post = $this->factory()->post->create_and_get( array( 'post_content' => $url ) );

		setup_postdata( $post );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		ob_start();
		the_content();
		$actual = ob_get_clean();

		$this->assertContains(
			sprintf(
				'<p><a href="%1$s">PDF Document</a></p>',
				$url
			),
			$actual
		);
	}
}
