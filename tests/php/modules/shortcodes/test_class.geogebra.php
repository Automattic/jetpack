<?php

class WP_Test_Jetpack_Shortcodes_GeoGebra extends WP_UnitTestCase {

	/**
	 * Check that [geogebra] shortcode exists.
	 *
	 * @since TODO
	 */
	public function test_shortcodes_geogebra_exists() {
		$this->assertEquals( shortcode_exists( 'geogebra' ), true );
	}

	/**
	 * Check that rendering a geogebra shortcode with no ID attribute
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
	 * Check that rendering the shortcode returns a GeoGebra iframe.
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
	 * Check that optional shortcode attributes are rendered.
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

	/**
	 * Check that toolbar help only renders if toolbar also renders.
	 *
	 * @since TODO
	 */
	public function test_shortcodes_geogebra_tool_bar_help() {
		$this->assertNotContains(
			'/stbh/true',
			do_shortcode( '[geogebra id="0" tool-help="true"]' )
		);
		$this->assertContains(
			'/stbh/true',
			do_shortcode( '[geogebra id="0" tool-bar="true" tool-help="true"]' )
		);
	}

	/**
	 * Check that plain geogebra iframes are converted to shortcodes.
	 *
	 * @covers geogebra_embed_to_shortcode
	 * @since TODO
	 */
	public function test_shortcodes_geogebra_from_isolated_iframe() {
		$iframe = '<iframe scrolling="no" src="https://www.geogebra.org/material/iframe/id/m3Zgkq9g/width/567/height/496/border/888888" width="567px" height="496px" style="border:0px;"> </iframe>';

		$shortcode = '[geogebra id="m3Zgkq9g" height="496" width="567"]';

		$this->assertEquals( $shortcode, geogebra_embed_to_shortcode( $iframe ) );
	}

	/**
	 * Check that geogebra iframes with path parameters are converted to shortcodes.
	 *
	 * @covers geogebra_embed_to_shortcode
	 * @since TODO
	 */
	public function test_shortcodes_geogebra_from_isolated_iframe_with_params() {
		// Check some parameters.
		$iframe_1 = '<iframe scrolling="no" src="https://www.geogebra.org/material/iframe/id/DpseMPzu/width/662/height/394/border/888888/smb/true/ai/true" width="662px" height="394px" style="border:0px;"> </iframe>';

		$shortcode_1 = '[geogebra id="DpseMPzu" height="394" width="662" input-bar="true" menu-bar="true"]';

		$this->assertEquals( $shortcode_1, geogebra_embed_to_shortcode( $iframe_1 ) );

		// Check some more parameters.
		$iframe_2 = '<iframe scrolling="no" src="https://www.geogebra.org/material/iframe/id/DpseMPzu/width/662/height/394/border/888888/stb/true/sri/true/ld/true" width="662px" height="394px" style="border:0px;"> </iframe>';

		$shortcode_2 = '[geogebra id="DpseMPzu" height="394" width="662" tool-bar="true" reset-icon="true" drag-labels="true"]';

		$this->assertEquals( $shortcode_2, geogebra_embed_to_shortcode( $iframe_2 ) );
	}
}
