<?php
/**
 * Test Suite for extra oEmbed providers available in Jetpack.
 *
 * @package Jetpack
 */

/**
 * Test Extra embeds available.
 */
class WP_Test_Jetpack_Shortcodes_Others extends WP_UnitTestCase {
	/**
	 * After a test method runs, reset any state in WordPress the test method might have changed.
	 */
	public function tearDown() {
		wp_reset_postdata();
		parent::tearDown();
	}

	/**
	 * Test a post including a song.link link.
	 *
	 * @since 8.4.0
	 */
	public function test_shortcodes_songlink() {
		global $post;

		$url  = 'https://song.link/hu/i/1051332387';
		$post = $this->factory()->post->create_and_get( array( 'post_content' => $url ) );

		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();

		$this->assertContains(
			sprintf(
				'src="https://embed.song.link/?url=%s" frameborder="0" allowtransparency allowfullscreen sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"></iframe>',
				rawurlencode( $url )
			),
			$actual
		);
	}
}
