<?php

class WP_Test_Jetpack_Shortcodes_Googlemaps extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::jetpack_googlemaps_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_googlemaps_exists() {
		$this->assertEquals( shortcode_exists( 'googlemaps' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::jetpack_googlemaps_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_googlemaps() {
		$content = '[googlemaps]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
