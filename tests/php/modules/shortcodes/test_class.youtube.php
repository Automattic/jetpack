<?php

class WP_Test_Jetpack_Shortcodes_Youtube extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::youtube_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_youtube_exists() {
		$this->assertEquals( shortcode_exists( 'youtube' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::youtube_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_youtube() {
		$content = '[youtube]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::youtube_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_youtube_url() {
		$youtube_id = 'JaNH56Vpg-A';
		$url = 'http://www.youtube.com/watch?v=' . $youtube_id;
		$content = '[youtube=' . $url . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $youtube_id, $shortcode_content );
	}

	/**
	 * @author Toro_Unit
	 * @covers ::youtube_shortcode
	 * @since 3.9
	 */
	public function test_replace_url_with_iframe_in_the_content() {
		global $post;

		$youtube_id = 'JaNH56Vpg-A';
		$url = 'http://www.youtube.com/watch?v=' . $youtube_id;
		$post = $this->factory->post->create_and_get( array( 'post_content' => $url ) );

		do_action( 'init' );
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();
		$this->assertContains( '<span class="embed-youtube"', $actual );
		$this->assertContains( "<iframe class='youtube-player'", $actual );
		$this->assertContains( "https://www.youtube.com/embed/$youtube_id", $actual );

	}

}
