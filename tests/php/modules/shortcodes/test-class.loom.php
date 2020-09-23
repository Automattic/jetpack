<?php
/**
 * Test Suite for Loom oEmbed providers available in Jetpack.
 *
 * @package Jetpack
 */

/**
 * Test Extra embeds available.
 */
class WP_Test_Jetpack_Shortcodes_Loom extends WP_UnitTestCase {
	/**
	 * After a test method runs, reset any state in WordPress the test method might have changed.
	 */
	public function tearDown() {
		wp_reset_postdata();
		parent::tearDown();
	}

	/**
	 * Test a post including an loom link.
	 *
	 * @dataProvider get_loom_data
	 *
	 * @since 8.4.0
	 *
	 * @param string $embed_link The link we're trying to embed, as pasted in the editor.
	 * @param string $expected   The expected return value of the function.
	 */
	public function test_shortcodes_loom( $embed_link, $expected ) {
		global $post;
		$post = $this->factory()->post->create_and_get( array( 'post_content' => $embed_link ) );
		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();

		$this->assertContains( $expected['title'], $actual );
		$this->assertContains( $expected['src'], $actual );
	}

	/**
	 * Test embeds for the Loom service.
	 * Use this function is a chance to add more tests,
	 * simply filling the array with more paired  
	 *
	 * @since 9.0.0
	 */
	public function get_loom_data() {
		return array (
			'how-to-install-wordpress-plugin' => array(
				'https://www.loom.com/share/e3dcec661c37487b818b8e3b8225ec27', array(
					'title'                 => 'title="How To Install a WordPress Plugin"',
					'src'                   => 'src="https://www.loom.com/embed/e3dcec661c37487b818b8e3b8225ec27"',
					'webkitallowfullscreen' => 'webkitallowfullscreen',
					'mozallowfullscreen'    => 'mozallowfullscreen',
					'allowfullscreen'       => 'allowfullscreen',
				),
			),
		);
	}
}
