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
	 * Original registered admin color schemes.
	 *
	 * @var mixed
	 */
	private $admin_color_schemes;

	/**
	 * Save the registered admin color schemes before each test.
	 */
	protected function setUp(): void {
		parent::setUp();

		$this->admin_color_schemes = $GLOBALS['_wp_admin_css_colors'] ?? null;
	}

	/**
	 * Restore the registered admin color schemes after each test.
	 */
	protected function tearDown(): void {
		if ( null === $this->admin_color_schemes ) {
			unset( $GLOBALS['_wp_admin_css_colors'] );
		} else {
			$GLOBALS['_wp_admin_css_colors'] = $this->admin_color_schemes;
		}

		parent::tearDown();
	}

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

	/**
	 * Ensure the admin menu logo uses the same base color as WordPress's SVG painter.
	 */
	public function test_get_base64_admin_menu_logo_uses_registered_scheme_color() {
		$GLOBALS['_wp_admin_css_colors'] = array(
			'coffee' => (object) array(
				'icon_colors' => array( 'base' => '#c7a589' ),
			),
			'modern' => (object) array(
				'icon_colors' => array( 'base' => '#f0f0f1' ),
			),
		);

		$logo   = new Logo();
		$result = $logo->get_base64_admin_menu_logo( 'coffee' );
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Decoding a generated SVG for assertions.
		$decoded = base64_decode( substr( $result, strlen( 'data:image/svg+xml;base64,' ) ) );
		$this->assertStringContainsString( '#c7a589', $decoded );
		$this->assertStringNotContainsString( '#f0f0f1', $decoded );
	}

	/**
	 * Ensure the admin menu logo uses WordPress's default base color without a registered scheme.
	 */
	public function test_get_base64_admin_menu_logo_default_color() {
		$GLOBALS['_wp_admin_css_colors'] = array();

		$logo   = new Logo();
		$result = $logo->get_base64_admin_menu_logo();
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Decoding a generated SVG for assertions.
		$decoded = base64_decode( substr( $result, strlen( 'data:image/svg+xml;base64,' ) ) );
		$this->assertStringContainsString( '#a7aaad', $decoded );
	}
}
