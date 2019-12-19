<?php

class WP_Test_Jetpack_Shortcodes_Scribd extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::scribd_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_scribd_exists() {
		$this->assertEquals( shortcode_exists( 'scribd' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::scribd_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_scribd() {
		$content = '[scribd]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
