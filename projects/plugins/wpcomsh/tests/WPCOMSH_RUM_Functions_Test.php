<?php
/**
 * Wpcomsh Test file.
 *
 * @package wpcomsh
 */

/**
 * Class Test_WPCOMSH_RUM_Functions
 */
// phpcs:disable Squiz.Commenting.FunctionComment.WrongStyle
class WPCOMSH_RUM_Functions_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that the script function is hooked correctly
	 */
	public function test_wpcomsh_footer_rum_js_hooks() {
		// Check if the function is hooked to wp_footer and admin_footer
		$this->assertEquals(
			10,
			has_action( 'wp_footer', 'wpcomsh_footer_rum_js' ),
			'wpcomsh_footer_rum_js is not properly hooked to wp_footer'
		);

		$this->assertEquals(
			10,
			has_action( 'admin_footer', 'wpcomsh_footer_rum_js' ),
			'wpcomsh_footer_rum_js is not properly hooked to admin_footer'
		);
	}

	/**
	 * Test the output of wpcomsh_head_rum_meta
	 */
	public function test_wpcomsh_head_rum_meta_output() {
		// Start output buffering
		ob_start();
		wpcomsh_footer_rum_js();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<meta id="bilmur"', $output );
		$this->assertStringContainsString( 'property="bilmur:data"', $output );
		$this->assertStringContainsString( 'data-provider="wordpress.com"', $output );
		$this->assertStringContainsString( 'data-service="atomic"', $output );
		$this->assertStringContainsString( 'bilmur.min.js', $output );
	}
}
