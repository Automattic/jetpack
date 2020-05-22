<?php

class WP_Test_Jetpack_Shortcodes_Lytro extends WP_UnitTestCase {

	/**
	 * Verify that [lytro] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_lytro_exists() {
		$this->assertEquals( shortcode_exists( 'lytro' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_lytro() {
		$content = '[lytro]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- Lytro Shortcode Error: No Photo ID/URL -->', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode with no username returns a Lytro image.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_lytro_image() {
		$image_id = '431119';
		$content = "[lytro photo=$image_id]";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe width="400" height="415" src="https://pictures.lytro.com/pictures/' . $image_id . '/embed?', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode with many attributes returns a Lytro image properly formatted.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_lytro_complete() {
		$image_id = '431119';
		$content = "[lytro username=lytroweb photo=$image_id show_arrow='false' show_border='false' show_first_time_user='false' allow_full_view='false']";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe width="400" height="415" src="https://pictures.lytro.com/lytroweb/pictures/' . $image_id . '/embed?showArrow=false&#038;showBorder=false&#038;showFTU=false&#038;allowFullView=false', $shortcode_content );
	}

	/**
	 * Verify iframe can be reversed to a shortcode.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_lytro_iframe_reverse() {
		$image_id = '431119';
		$content = '<iframe width="400" height="415" src="https://pictures.lytro.com/lytroweb/pictures/' . $image_id . '/embed?showArrow=false&#038;showBorder=true&#038;showFTU=false&#038;allowFullView=false&#038;enableHelp=true&#038;enableAttribution=true&#038;enableLogo=true&#038;enableFullscreen=true&#038;enablePlay=true" frameborder="0" allowfullscreen scrolling="no"></iframe>';

		// Trigger iframe parsing and reversion to shortcode
		$shortcode = apply_filters( 'pre_kses', $content );

		$this->assertContains( "[lytro  username='lytroweb' photo='431119' show_arrow='false' show_border='true' show_first_time_user='false' allow_full_view='false' enable_help='true' enable_attribution='true' enable_logo='true' enable_fullscreen='true' enable_play='true' width='400' height='415']", $shortcode );
	}
}