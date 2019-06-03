<?php
namespace Automattic\Jetpack\Assets;

use PHPUnit\Framework\TestCase;
use phpmock\phpunit\PHPMock;

class Test_Logo extends TestCase {
	use PHPMock;

	protected $logo_url = 'https://yourjetpack.blog/wp-content/plugins/jetpack/packages/logo/assets/logo.svg';

	public function setUp() {
		parent::setUp();

		$this->mock_with_identity( 'esc_url' );
		$this->mock_with_identity( 'esc_attr' );
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
		$this->getFunctionMock( __NAMESPACE__, 'plugins_url' )
			->expects( $this->once() )
			->with(
				'assets/logo.svg',
				dirname( dirname( __DIR__ ) ) . DIRECTORY_SEPARATOR . 'src'
			)
			->willReturn( $this->logo_url );
	}

	public function mock_with_identity( $function_name ) {
		$this->getFunctionMock( __NAMESPACE__, $function_name )
			->expects( $this->any() )
			->willReturnCallback( array( $this, 'identity' ) );
	}

	public function identity( $value ) {
		return $value;
	}
}
