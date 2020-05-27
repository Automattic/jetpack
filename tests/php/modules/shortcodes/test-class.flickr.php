<?php

class WP_Test_Jetpack_Shortcodes_Flickr extends WP_UnitTestCase {

	/**
	 * Runs on every test.
	 */
	public function setUp() {
		parent::setUp();

		$this->pre_http_req_function = function( $preempt, $parsed_args, $url ) {
			if ( 'https://embedr.flickr.com/photos/49931239842' === $url ) {
				return array(
					'body' => '<div class="slide slide-video" data-rapid="video" data-slideshow-position="" >
					<video src="https://www.flickr.com/photos/kalakeli/49931239842/play/360p/183f75d545/" width="NaN" height="NaN" poster="https://live.staticflickr.com/31337/49931239842_183f75d545_z.jpg" controls></video>
				</div>',
				);
			}

			if ( 'http://flickr.com/photo.gne?id=49931239842' === $url ) {
				return array(
					'body' => '<meta property="og:url" content="https://www.flickr.com/photos/kalakeli/49931239842/"  data-dynamic="true">',
				);
			}

			return $preempt;
		};

		add_filter(
			'pre_http_request',
			$this->pre_http_req_function,
			10,
			3
		);
	}

	/**
	 * Runs on every test.
	 */
	public function tearDown() {
		parent::tearDown();

		remove_filter( 'pre_http_request', $this->pre_http_req_function );
	}

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

		$video_id = '49931239842';

		$content = '[flickr video="' . $video_id . '"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_video_id() {
		$video_id = '49931239842';
		$content  = '[flickr video="' . $video_id . '"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_video_id_show_info() {
		$video_id = '49931239842';
		$content  = "[flickr video='$video_id']";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_video_id_width_height() {
		$video_id = '49931239842';
		$width    = 200;
		$height   = 300;
		$content  = "[flickr video='$video_id' w=$width h=$height ]";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
		$this->assertContains( "width: $width", $shortcode_content );
		$this->assertContains( "height: $height", $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::flickr_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_flickr_video_id_show_info_secret() {
		$video_id = '49931239842';
		$content  = '[flickr video=' . $video_id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
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

		$this->assertEquals( $shortcode_content, '[flickr photo="http://www.flickr.com/photos/batmoo/5265478228" w=375 h=500]' );
	}

	public function test_shortcodes_flickr_reversal_embed_to_shortcode() {
		$content = '<div class="flickr_video" style="max-width: 100%;width: 500px;height: 300px;"><video src="https://www.flickr.com/photos/kalakeli/49931239842/play/360p/183f75d545/" controls autoplay /></div>';

		$shortcode_content = wp_kses_post( $content );

		$this->assertEquals( $shortcode_content, '[flickr video="49931239842" w=500 h=300 controls="yes" autoplay="yes"]' );
	}
}
