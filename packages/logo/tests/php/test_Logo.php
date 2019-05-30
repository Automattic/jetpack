<?php

use Automattic\Jetpack\Assets\Logo;
use WP_Mock\Tools\TestCase;

class WP_Test_Logo extends TestCase {
	var $logo_url = 'https://yourjetpack.blog/wp-content/plugins/jetpack/packages/logo/assets/logo.svg';

	public function setUp(): void {
		\WP_Mock::setUp();
	}

	public function tearDown(): void {
		\WP_Mock::tearDown();
	}

	public function test_constructor_default_logo() {
		$this->mock_plugins_url();

		$logo = new Logo();
		$this->assertContains( $this->logo_url, $logo->render() );
	}

	public function test_constructor_custom_logo() {
		$example_logo = 'https://wordpress.com/logo.png';
		$logo = new Logo( $example_logo );
		$this->assertContains( $example_logo, $logo->render() );
	}

	public function test_render_img_tag() {
		$this->mock_plugins_url();

		$logo = new Logo();
		$output = $logo->render();

		// Contains only a valid img tag.
		$this->assertRegExp( '/^<img.*\/>$/', $output );

		// Contains the expected src attribute.
		$this->assertRegExp( '/.+src="' . preg_quote( $this->logo_url, '/' ) . '".+/', $output );

		// Contains the expected class attribute.
		$this->assertRegExp( '/.+class="jetpack-logo".+/', $output );

		// Contains an alt attribute.
		$this->assertRegExp( '/.+alt="[^"]+".+/', $output );
	}

	protected function mock_plugins_url() {
		\WP_Mock::userFunction( 'plugins_url', array(
			'times' => 1,
			'args' => array(
				'assets/logo.svg',
				dirname( dirname( __DIR__ ) ) . DIRECTORY_SEPARATOR . 'src'
			),
			'return' => $this->logo_url,
		) );
	}
}
