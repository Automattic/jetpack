<?php

class WP_Test_Jetpack_Shortcodes_Slideshare extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::slideshare_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_slideshare_exists() {
		$this->assertEquals( shortcode_exists( 'slideshare' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::slideshare_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_slideshare() {
		$content = '[slideshare]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
