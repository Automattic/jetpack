<?php

class WP_Test_Jetpack_Shortcodes_Slideshow extends WP_UnitTestCase {

	public function setUp() {
		if ( ! defined( 'TESTING_IN_JETPACK' ) || ! TESTING_IN_JETPACK ) {
			switch_to_blog( 104104364 ); // test.wordpress.com
			$this->IDs = '161,162';
			return;
		}

		// Otherwise, create the two images we're going to be using ourselves!
		$a1 = self::factory()->attachment->create_object( 'image1.jpg', 0, array(
			'file'           => 'image1.jpg',
			'post_mime_type' => 'image/jpeg',
			'post_type'      => 'attachment',
		) );

		$a2 = self::factory()->attachment->create_object( 'image1.jpg', 0, array(
			'file'           => 'image2.jpg',
			'post_mime_type' => 'image/jpeg',
			'post_type'      => 'attachment',
		) );

		$this->IDs = "{$a1},{$a2}";
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Slideshow_Shortcode::shortcode_callback
	 * @since 3.2
	 */
	public function test_shortcodes_slideshow_exists() {
		$this->assertEquals( shortcode_exists( 'slideshow' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Slideshow_Shortcode::shortcode_callback
	 * @since 3.2
	 */
	public function test_shortcodes_slideshow() {
		$content = '[slideshow]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	public function test_shortcodes_slideshow_no_js() {
		$content = '[gallery type="slideshow" ids="' . $this->IDs . '"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( 0, strpos( $shortcode_content, '<p class="jetpack-slideshow-noscript robots-nocontent">This slideshow requires JavaScript.</p>' ) );
	}

	public function test_shortcodes_slideshow_html() {
		$content = '[gallery type="slideshow" ids="' . $this->IDs . '"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'class="slideshow-window jetpack-slideshow' ) );
	}

	public function test_shortcodes_slideshow_autostart_off() {
		$content = '[gallery type="slideshow" ids="' . $this->IDs . '" autostart="false"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'data-autostart="false"' ) );
	}

	public function test_shortcodes_slideshow_autostart_on() {
		$content = '[gallery type="slideshow" ids="' . $this->IDs . '" autostart="true"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'data-autostart="true"' ) );
	}
}
