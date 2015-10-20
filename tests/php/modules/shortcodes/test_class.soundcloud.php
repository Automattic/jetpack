<?php

class WP_Test_Jetpack_Shortcodes_Soundcloud extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::soundcloud_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_soundcloud_exists() {
		$this->assertEquals( shortcode_exists( 'soundcloud' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::soundcloud_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_soundcloud() {
		$content = '[soundcloud]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
