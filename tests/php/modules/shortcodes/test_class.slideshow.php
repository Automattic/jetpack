<?php

class WP_Test_Jetpack_Shortcodes_Slideshow extends WP_UnitTestCase {

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
		switch_to_blog( 104104364 ); // test.wordpress.com

		$content = '[gallery type="slideshow" ids="161,162"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( 0, strpos( $shortcode_content, '<p class="jetpack-slideshow-noscript robots-nocontent">This slideshow requires JavaScript.</p>' ) );
	}

	public function test_shortcodes_slideshow_html() {
		switch_to_blog( 104104364 ); // test.wordpress.com

		$content = '[gallery type="slideshow" ids="161,162"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'class="slideshow-window jetpack-slideshow' ) );
	}

	public function test_shortcodes_slideshow_autostart_off() {
		switch_to_blog( 104104364 ); // test.wordpress.com

		$content = '[gallery type="slideshow" ids="161,162" autostart="false"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'data-autostart="false"' ) );
	}

	public function test_shortcodes_slideshow_autostart_on() {
		switch_to_blog( 104104364 ); // test.wordpress.com

		$content = '[gallery type="slideshow" ids="161,162" autostart="true"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'data-autostart="true"' ) );
	}
}
