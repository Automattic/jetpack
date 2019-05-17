<?php

use Jetpack\Assets\Logo;
use PHPUnit\Framework\TestCase;

class WP_Test_Logo extends TestCase {

	private $logo = null;
	protected function setUp() {
		$this->logo = new Logo();
	}

	function test_render_default_logo() {
		$output = $this->logo->render();
		$expected = home_url( '/wp-content/plugins/jetpack/packages/jetpack-logo/assets/images/logo.svg' );
		$this->assertContains( $expected, $output );
	}

	function test_render_custom_logo() {
		$example_logo = 'logo2.png';
		$output = $this->logo->render( $example_logo );
		$this->assertContains( $example_logo, $output );
	}

	function test_render_img_tag() {
		$output = $this->logo->render();
		$url = home_url( '/wp-content/plugins/jetpack/packages/jetpack-logo/assets/images/logo.svg' );
		// Contains only a valid img tag.
		$this->assertRegExp( '/^<img.*\/>$/', $output );
		// Contains the expected src attribute.
		$this->assertRegExp( '/.+src="' . preg_quote( $url, '/' ) . '".+/', $output );
		// Contains the expected class attribute.
		$this->assertRegExp( '/.+class="jetpack-logo".+/', $output );
		// Contains an alt attribute.
		$this->assertRegExp( '/.+alt="[^"]+".+/', $output );
	}
}
