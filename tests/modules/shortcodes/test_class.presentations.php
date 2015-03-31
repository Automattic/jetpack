<?php

class WP_Test_Jetpack_Shortcodes_Presentations extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers Presentations::presentation_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_presentations_presentation_exists() {
		$this->assertEquals( shortcode_exists( 'presentation' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers Presentations::slide_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_presentations_slide_exists() {
		$this->assertEquals( shortcode_exists( 'slide' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers Presentations::presentation_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_presentations_presentation() {
		$content = '[presentation]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
