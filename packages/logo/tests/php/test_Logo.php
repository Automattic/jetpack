<?php
namespace Automattic\Jetpack\Assets;

use PHPUnit\Framework\TestCase;
use phpmock\MockBuilder;

class Test_Logo extends TestCase {
	protected $logo_url = 'https://yourjetpack.blog/wp-content/plugins/jetpack/packages/logo/assets/logo.svg';

	public function setUp() {
		parent::setUp();

		$this->esc_url_mock = $this->mock_with_identity( 'esc_url' );
		$this->esc_attr_mock = $this->mock_with_identity( 'esc_attr' );
		$this->plugins_url_mock = $this->mock_plugins_url();
	}

	public function tearDown() {
		$this->esc_url_mock->disable();
		$this->esc_attr_mock->disable();
		$this->plugins_url_mock->disable();

		parent::tearDown();
	}

	public function test_constructor_default_logo() {
		$logo = new Logo();
		$this->assertContains( $this->logo_url, $logo->render() );
	}

	public function test_constructor_custom_logo() {
		$example_logo = 'https://wordpress.com/logo.png';
		$logo = new Logo( $example_logo );
		$this->assertContains( $example_logo, $logo->render() );
	}

	public function test_render_img_tag() {
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
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( 'plugins_url' )
			->setFunction(
				function () {
					return $this->logo_url;
				}
			);

		$mock = $builder->build();
		$mock->enable();

		return $mock;
	}

	protected function mock_with_identity( $function_name ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( $function_name )
			->setFunction( array( $this, 'identity' ) );

		$mock = $builder->build();
		$mock->enable();

		return $mock;
	}

	public function identity( $value ) {
		return $value;
	}
}
