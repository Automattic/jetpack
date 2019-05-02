<?php

class WP_Test_Jetpack_Shortcodes_Ted extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted_exists() {
		$this->assertEquals( shortcode_exists( 'ted' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted() {
		$content = '[ted]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}
}
