<?php

use Automattic\Jetpack\Assets\Logo;

class WP_Test_Logo extends WP_UnitTestCase {

	/**
	 * Ensure the rendered logo has all the CSS classes needed for styling.
	 */
	function test_constructor_default_logo() {
		$logo = new Logo();
		$logo_render = $logo->render();
		$this->assertContains( 'class="jetpack-logo"', $logo_render );
		$this->assertContains( 'class="jetpack-logo__icon-circle"', $logo_render );
		$this->assertContains( 'class="jetpack-logo__icon-triangle" points="15,19 7,19 15,3"', $logo_render );
		$this->assertContains( 'class="jetpack-logo__icon-triangle" points="17,29 17,13 25,13"', $logo_render );
		$this->assertContains( 'class="jetpack-logo__text"', $logo_render );
	}

}
