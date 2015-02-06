<?php

class WP_Test_Jetpack_Shortcodes_Flickr extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_exists() {
		$this->assertEquals( shortcode_exists( 'flickr' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr() {
		$content = '[flickr]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_video_http() {
		$user = 'chaddles';
		$video_id = '2402990826';
		$content = '[flickr video=http://flickr.com/photos/' . $user . '/' . $video_id . '/]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_video_id() {
		$video_id = '2402990826';
		$content = '[flickr video=' . $video_id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_video_id_show_info() {
		$video_id = '2402990826';
		$content = '[flickr video=' . $video_id . ' show_info=no]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
		$this->assertContains( 'flickr_show_info_box=false', $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_video_id_width_height() {
		$video_id = '2402990826';
		$width = 200;
		$height = 150;
		$content = '[flickr video=' . $video_id . ' w=' . $width . ' h=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
		$this->assertContains( 'width="' . $width . '"', $shortcode_content );
		$this->assertContains( 'height="' . $height . '"', $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_video_id_show_info_secret() {
		$video_id = '2402990826';
		$secret = '846d9c1be9';
		$content = '[flickr video=' . $video_id . ' secret=' . $secret . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
		$this->assertContains( 'secret=' . $secret, $shortcode_content );
	}

}