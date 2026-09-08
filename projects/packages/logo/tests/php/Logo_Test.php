<?php
/**
 * Tests the logo package
 *
 * @package automattic/jetpack-logo
 */

use Automattic\Jetpack\Assets\Logo;
use PHPUnit\Framework\TestCase;

/**
 * Class Logo_Test
 */
class Logo_Test extends TestCase {

	/**
	 * Ensure the rendered logo has all the CSS classes needed for styling.
	 */
	public function test_constructor_default_logo() {
		$logo        = new Logo();
		$logo_render = $logo->render();
		$this->assertStringContainsString( '<svg xmlns="http://www.w3.org/2000/svg"', $logo_render );
		$this->assertStringContainsString( 'class="jetpack-logo"', $logo_render );
		$this->assertStringContainsString( 'class="jetpack-logo__icon-circle"', $logo_render );
		$this->assertEquals( 2, preg_match_all( '/class="jetpack-logo__icon-triangle"/', $logo_render ) );
		$this->assertStringContainsString( 'class="jetpack-logo__text"', $logo_render );
	}

	/**
	 * Ensure get_base64_logo retains its white default color.
	 */
	public function test_get_base64_logo_default_color() {
		$logo   = new Logo();
		$result = $logo->get_base64_logo();
		$this->assertStringStartsWith( 'data:image/svg+xml;base64,', $result );
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Decoding a generated SVG for assertions.
		$decoded = base64_decode( substr( $result, strlen( 'data:image/svg+xml;base64,' ) ) );
		$this->assertStringContainsString( '#ffffff', $decoded );
	}

	/**
	 * Ensure get_base64_logo respects a custom color argument.
	 */
	public function test_get_base64_logo_custom_color() {
		$logo   = new Logo();
		$result = $logo->get_base64_logo( '#a7aaad' );
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Decoding a generated SVG for assertions.
		$decoded = base64_decode( substr( $result, strlen( 'data:image/svg+xml;base64,' ) ) );
		$this->assertStringContainsString( '#a7aaad', $decoded );
		$this->assertStringNotContainsString( '#ffffff', $decoded );
	}
}
