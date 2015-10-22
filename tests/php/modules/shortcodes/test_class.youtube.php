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

}