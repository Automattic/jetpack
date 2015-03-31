<?php

class WP_Test_Jetpack_Shortcodes_Audio extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_shortcodes_audio_exists() {
		$this->assertEquals( shortcode_exists( 'audio' ), true );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_shortcodes_audio() {
		$content = '[audio]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_shortcodes_audio_single_file() {
		$content = '[audio http://' . WP_TESTS_DOMAIN . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
