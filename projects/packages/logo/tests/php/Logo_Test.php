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
}
