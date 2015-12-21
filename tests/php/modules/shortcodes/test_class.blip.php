<?php

class WP_Test_Jetpack_Shortcodes_Blip extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::blip_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_blip_exists() {
		$this->assertEquals( shortcode_exists( 'blip.tv' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::blip_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_blip() {
		$content = '[blip.tv]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::blip_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_blip_empty() {
		$content = '[blip.tv]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEmpty( $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::blip_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_blip_posts_id_and_dest() {
		$posts_id = '4060324';
		$dest = '-1';
		$content = '[blip.tv ?posts_id=' . $posts_id . '&dest=' . $dest . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'posts_id=' . $posts_id, $shortcode_content );
		$this->assertContains( 'cross_post_destination=' . $dest, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::blip_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_blip_http_url() {
		$url = 'http://blip.tv/play/hpZTgffqCAI%2Em4v';
		$content = '[blip.tv ' . $url . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $url, $shortcode_content );
	}

}
