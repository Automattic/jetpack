<?php

class WP_Test_Jetpack_Shortcodes_Getty extends WP_UnitTestCase {

	/**
	 * Verify that [getty] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_getty_exists() {
		$this->assertEquals( shortcode_exists( 'getty' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_getty() {
		$content = '[getty]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- Missing Getty Source ID -->', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a Getty image.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_getty_image() {
		$image_id = '82278805';
		$content = "[getty src='$image_id']";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe src="//embed.gettyimages.com/embed/' . $image_id, $shortcode_content );
	}
}