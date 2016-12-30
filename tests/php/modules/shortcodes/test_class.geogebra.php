<?php

class WP_Test_Jetpack_Shortcodes_GeoGebra extends WP_UnitTestCase {

	/**
	 * Verify that [geogebra] exists.
	 *
	 * @since TODO
	 */
	public function test_shortcodes_geogebra_exists() {
		$this->assertEquals( shortcode_exists( 'geogebra' ), true );
	}

	/**
	 * Verify that rendering a geogebra shortcode with no ID attribute
	 * returns an error comment.
	 *
	 * @since TODO
	 */
	public function test_shortcodes_geogebra_no_id() {
		$content = '[geogebra]';

		$rendered_shortcode = do_shortcode( $content );

		$this->assertEquals(
			'<!-- Missing GeoGebra Applet ID -->',
			$rendered_shortcode
		);
	}

	/**
	 * Verify that rendering the shortcode returns a GeoGebra iframe.
	 *
	 * @since TODO
	 */
	public function test_shortcodes_geogebra_widget_url() {
		$widget_id = '1234567';
		$content = "[geogebra id='$widget_id']";

		$rendered_shortcode = do_shortcode( $content );

		$this->assertContains(
			'<iframe',
			$rendered_shortcode
		);
		$this->assertContains(
			'src="https://www.geogebra.org/material/iframe',
			$rendered_shortcode
		);
		$this->assertContains(
			'/id/' . $widget_id,
			$rendered_shortcode
		);
	}

	/**
	 * Verify that optional shortcode attributes are rendered.
	 *
	 * @since TODO
	 */
	public function test_shortcodes_geogebra_optional_attributes() {
		$this->assertContains(
			'/height/100',
			do_shortcode( '[geogebra id="0" height="100"]' )
		);
		$this->assertContains(
			'/width/100',
			do_shortcode( '[geogebra id="0" width="100"]' )
		);
		$this->assertContains(
			'/ai/true',
			do_shortcode( '[geogebra id="0" input-bar="true"]' )
		);
		$this->assertContains(
			'/asb/true',
			do_shortcode( '[geogebra id="0" style-bar="true"]' )
		);
		$this->assertContains(
			'/smb/true',
			do_shortcode( '[geogebra id="0" menu-bar="true"]' )
		);
		$this->assertContains(
			'/stb/true',
			do_shortcode( '[geogebra id="0" tool-bar="true"]' )
		);
		$this->assertContains(
			'/sri/true',
			do_shortcode( '[geogebra id="0" reset-icon="true"]' )
		);
		$this->assertContains(
			'/rc/true',
			do_shortcode( '[geogebra id="0" right-click="true"]' )
		);
		$this->assertContains(
			'/ld/true',
			do_shortcode( '[geogebra id="0" drag-labels="true"]' )
		);
		$this->assertContains(
			'/sdz/true',
			do_shortcode( '[geogebra id="0" pan-zoom="true"]' )
		);
	}
}