<?php

require dirname( __FILE__ ) . '/../../../modules/shortcodes/audio.php';

class WP_Test_Jetpack_Shortcodes_Audio extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers AudioShortcode::__construct
	 * @since 3.2
	 */
	public function test_shortcodes_audio_exists() {
		$this->assertEquals( shortcode_exists( 'audio' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers AudioShortcode::audio_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_audio() {
		$content = '[audio]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers AudioShortcode::audio_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_audio_single_file() {
		$content = '[audio http://' . WP_TESTS_DOMAIN . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}