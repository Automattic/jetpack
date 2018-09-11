<?php

class WP_Test_Jetpack_Shortcodes_Gist extends WP_UnitTestCase {

	/**
	 * Verify that the shortcode exists.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_exists() {
		$this->assertEquals( shortcode_exists( 'gist' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist() {
		$content = '[gist]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * Verify that calling the shortcode without an argument returns the error string.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_empty_gist() {
		$content = '[gist]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( '<!-- Missing Gist ID -->', $shortcode_content );
	}

	/**
	 * Verify that a shortcode with only an ID returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_id() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist]' . $gist_id . '[/gist]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<div class="gist-oembed" data-gist="' . $gist_id . '.json"></div>', $shortcode_content );
	}

	/**
	 * Verify that a shortcode with a URL returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_full_url() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist https://gist.github.com/' . $gist_id . ' /]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<div class="gist-oembed" data-gist="' . $gist_id . '.json"></div>', $shortcode_content );
	}

	/**
	 * Verify that content with a full Gist URL on its own line gets replaced by the embed.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_oembed_to_embed() {
		global $post;

		$gist_id = '57cc50246aab776e110060926a2face2';
		$url     = 'https://gist.github.com/' . $gist_id;
		$post    = $this->factory->post->create_and_get( array( 'post_content' => $url ) );

		do_action( 'init' );
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();

		$this->assertContains( '<div class="gist-oembed" data-gist="' . $gist_id . '.json"></div>', $actual );
	}

	/**
	 * Verify that content with a Gist URL pointing to a specific file gets replaced by the embed to that file.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_file_to_embed() {
		global $post;

		$gist_id = 'jeherve/57cc50246aab776e110060926a2face2';
		$file    = 'wp-config-php';
		$url     = 'https://gist.github.com/' . $gist_id . '#file-' . $file;
		$post    = $this->factory->post->create_and_get( array( 'post_content' => $url ) );

		do_action( 'init' );
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();

		$this->assertContains( '<div class="gist-oembed" data-gist="' . $gist_id . '.json?file=wp-config.php"></div>', $actual );
	}
}
