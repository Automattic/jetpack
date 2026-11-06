<?php
/**
 * CoBlocks Mods Test file.
 *
 * @package wpcomsh
 */

/**
 * Class CoblocksModsTest.
 */
class CoblocksModsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tests that only CoBlocks' has-custom-font wrapper gets its slug pointed at the preset variable.
	 */
	public function test_font_preset_variable() {
		$block    = array( 'attrs' => array( 'fontFamily' => 'heading' ) );
		$inner    = '><a class="wp-block-button__link has-heading-font-family wp-element-button">Go</a></div>';
		$coblocks = '<div class="wp-block-button has-custom-font" style="font-family:heading"' . $inner;
		$plain    = '<div class="wp-block-button" style="font-family:heading"' . $inner;

		$this->assertStringContainsString(
			'style="font-family:var(--wp--preset--font-family--heading, heading)"',
			wpcomsh_coblocks_font_preset_variable( $coblocks, $block )
		);
		$this->assertSame( $plain, wpcomsh_coblocks_font_preset_variable( $plain, $block ) );
	}
}
