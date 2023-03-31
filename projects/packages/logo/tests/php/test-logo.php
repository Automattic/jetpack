<?php
/**
 * Tests the logo package
 *
 * @package automattic/jetpack-logo
 */

use Automattic\Jetpack\Assets\Logo;
use PHPUnit\Framework\TestCase;

/**
 * Class Test_Logo
 */
class Test_Logo extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

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

}
