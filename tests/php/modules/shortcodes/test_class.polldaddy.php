<?php

class WP_Test_Jetpack_Shortcodes_Polldaddy extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers PolldaddyShortcode::polldaddy_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_polldaddy_exists() {
		$this->assertEquals( shortcode_exists( 'polldaddy' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers PolldaddyShortcode::polldaddy_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_polldaddy() {
		$content = '[polldaddy]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
