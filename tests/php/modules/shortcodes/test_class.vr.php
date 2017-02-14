<?php

class WP_Test_Jetpack_Shortcodes_VR extends WP_UnitTestCase {

	/**
	 * @author mkaz
	 * @covers ::vr_shortcode
	 * @since 4.5
	 */
	public function test_shortcodes_vr_exists() {
		$this->assertEquals( shortcode_exists( 'vr' ), true );
	}

	/**
	 * @author mkaz
	 * @covers ::vr_shortcode
	 * @since 4.5
	 */
	public function test_shortcodes_vr() {
		$content = '[vr]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author mkaz
	 * @covers ::vr_shortcode
	 * @since 4.5
	 */
	public function test_shortcodes_vr_url() {
		$img = 'https://en-blog.files.wordpress.com/2016/12/regents_park.jpg';
		$content = '[vr url=' . $img . ' view=360]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $img, $shortcode_content );
	}

	/**
	 * @author mkaz
	 * @covers ::vr_shortcode
	 * @since 4.5
	 */
	public function test_shortcodes_vr_url_missing() {
		$content = '[vr]';
		$shortcode_content = do_shortcode( $content );
		$this->assertEmpty( $shortcode_content );
	}


}