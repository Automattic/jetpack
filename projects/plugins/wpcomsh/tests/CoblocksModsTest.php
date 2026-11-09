<?php
/**
 * CoBlocks Mods Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class CoblocksModsTest.
 */
class CoblocksModsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Data provider for the font preset rewrite.
	 *
	 * @return array<string, array{0: string, 1: string, 2?: string}>
	 */
	public static function provide_font_markup() {
		$inner = '><a class="wp-block-button__link has-heading-font-family wp-element-button">Go</a></div>';

		return array(
			'coblocks wrapper'   => array(
				'<div class="wp-block-button has-custom-font" style="font-family:heading"' . $inner,
				'<div class="wp-block-button has-custom-font" style="font-family:var(--wp--preset--font-family--heading, heading)"' . $inner,
			),
			'no has-custom-font' => array(
				'<div class="wp-block-button" style="font-family:heading"' . $inner,
				'<div class="wp-block-button" style="font-family:heading"' . $inner,
			),
			'slug is a prefix'   => array(
				'<p class="has-custom-font" style="font-family:heading-alt">x</p>',
				'<p class="has-custom-font" style="font-family:heading-alt">x</p>',
			),
			'other font value'   => array(
				'<p class="has-custom-font" style="font-family:Raleway">x</p>',
				'<p class="has-custom-font" style="font-family:Raleway">x</p>',
			),
			'2.x font name'      => array(
				'<p class="has-custom-font" style="font-family:Raleway">x</p>',
				'<p class="has-custom-font" style="font-family:var(--wp--preset--font-family--raleway, Raleway)">x</p>',
				'Raleway',
			),
		);
	}

	/**
	 * Tests that only CoBlocks' has-custom-font wrapper gets its exact slug pointed at the preset variable.
	 *
	 * @dataProvider provide_font_markup
	 *
	 * @param string $html     Rendered block HTML.
	 * @param string $expected Expected HTML after the filter.
	 * @param string $font     The block's fontFamily attribute.
	 */
	#[DataProvider( 'provide_font_markup' )]
	public function test_font_preset_variable( $html, $expected, $font = 'heading' ) {
		$block = array( 'attrs' => array( 'fontFamily' => $font ) );

		$this->assertSame( $expected, wpcomsh_coblocks_font_preset_variable( $html, $block ) );
	}
}
