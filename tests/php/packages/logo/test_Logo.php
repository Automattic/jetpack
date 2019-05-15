<?php

use Jetpack\Assets\Logo;

class WP_Test_Logo extends WP_UnitTestCase {
	function test_constructor_default_logo() {
		$logo = new Logo();
		$expected = home_url( '/wp-content/plugins/jetpack/packages/logo/assets/logo.svg' );
		$this->assertContains( $expected, $logo->get_image() );
	}

	function test_constructor_custom_logo() {
		$example_logo = 'https://wordpress.com/logo.png';
		$logo = new Logo( $example_logo );
		$this->assertContains( $example_logo, $logo->get_image() );
	}

	function test_render_default_logo() {
		$output = Logo::render();
		$expected = home_url( '/wp-content/plugins/jetpack/packages/logo/assets/logo.svg' );
		$this->assertContains( $expected, $output );
	}

	function test_render_custom_logo() {
		$example_logo = 'https://wordpress.com/logo.png';
		$output = Logo::render( $example_logo );
		$this->assertContains( $example_logo, $output );
	}

	function test_render_img_tag() {
		$output = Logo::render();
		$url = home_url( '/wp-content/plugins/jetpack/packages/logo/assets/logo.svg' );
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
