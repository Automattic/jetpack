<?php

class WP_Test_Jetpack_Shortcodes_Facebook extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::jetpack_facebook_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_facebook_exists() {
		$this->assertEquals( shortcode_exists( 'facebook' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::jetpack_facebook_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_facebook() {
		$content = '[facebook]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
