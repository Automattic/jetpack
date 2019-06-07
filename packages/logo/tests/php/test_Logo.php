<?php

use Automattic\Jetpack\Assets\Logo;

use PHPUnit\Framework\TestCase;

class Test_Logo extends TestCase {

	/**
	 * Ensure the rendered logo has all the CSS classes needed for styling.
	 */
	function test_constructor_default_logo() {
		$logo = new Logo();
		$logo_render = $logo->render();
		$this->assertContains( '<svg xmlns="http://www.w3.org/2000/svg"', $logo_render );
		$this->assertContains( 'class="jetpack-logo"', $logo_render );
		$this->assertContains( 'class="jetpack-logo__icon-circle"', $logo_render );
		$this->assertEquals( 2, preg_match_all( '/class="jetpack-logo__icon-triangle"/', $logo_render ) );
		$this->assertContains( 'class="jetpack-logo__text"', $logo_render );
	}

}
