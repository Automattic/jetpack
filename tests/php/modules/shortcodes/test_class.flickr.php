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
		$user     = 'chaddles';
		$video_id = '2402990826';
		$content  = '[flickr video=http://flickr.com/photos/' . $user . '/' . $video_id . '/]';

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
		$content  = '[flickr video=' . $video_id . ']';

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
		$content  = '[flickr video=' . $video_id . ' show_info=no]';

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
		$width    = 200;
		$height   = 150;
		$content  = '[flickr video=' . $video_id . ' w=' . $width . ' h=' . $height . ']';

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
		$secret   = '846d9c1be9';
		$content  = '[flickr video=' . $video_id . ' secret=' . $secret . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
		$this->assertContains( 'secret=' . $secret, $shortcode_content );
	}

	/**
	 * Shortcode reversals.
	 */
	public function test_shortcodes_flickr_reversal_iframe_to_link() {
		if ( defined( 'TESTING_IN_JETPACK' ) && TESTING_IN_JETPACK ) {
			self::markTestSkipped( 'This test only runs on WPCOM' );
		}
		$content = '<iframe src="http://www.flickr.com/photos/batmoo/5265478228/player/" height="500" width="375"  frameborder="0" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>';

		$shortcode_content = wp_kses_post( $content );

		$this->assertEquals( $shortcode_content, '<a href="http://www.flickr.com/photos/batmoo/5265478228/player/">http://www.flickr.com/photos/batmoo/5265478228/player/</a>' );
	}

	public function test_shortcodes_flickr_reversal_embed_to_shortcode() {
		$content = '<object type="application/x-shockwave-flash" width="400" height="300" data="http://www.flickr.com/apps/video/stewart.swf?v=71377" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"> <param name="flashvars" value="intl_lang=en-us&photo_secret=846d9c1be9&photo_id=2345938910"></param> <param name="movie" value="http://www.flickr.com/apps/video/stewart.swf?v=71377"></param> <param name="bgcolor" value="#000000"></param> <param name="allowFullScreen" value="true"></param><embed type="application/x-shockwave-flash" src="http://www.flickr.com/apps/video/stewart.swf?v=71377" bgcolor="#000000" allowfullscreen="true" flashvars="intl_lang=en-us&photo_secret=846d9c1be9&photo_id=2345938910" height="300" width="400"></embed></object>';

		$shortcode_content = wp_kses_post( $content );

		$this->assertEquals( $shortcode_content, '[flickr video=2345938910 secret=846d9c1be9 w=400 h=300]' );
	}
}