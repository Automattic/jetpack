<?php
/**
 * Tests the Google Font Provider
 *
 * @package automattic/jetpack-google-fonts-provider
 */

use Automattic\Jetpack\Fonts\Google_Fonts_Provider;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Google fonts provider test suite.
 */
class Test_Google_Fonts_Provider extends TestCase {
	/**
	 * Setup before running any of the tests.
	 *
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		if ( ! defined( 'MINUTE_IN_SECONDS' ) ) {
			define( 'MINUTE_IN_SECONDS', 60 );
		}

		if ( ! defined( 'MONTH_IN_SECONDS' ) ) {
			define( 'MONTH_IN_SECONDS', 60 * 60 * 24 * 30 );
		}
	}

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();

		Functions\stubs(
			array(
				'esc_url'                          => null,
				'get_site_transient'               => false,
				'set_site_transient'               => 'foo',
				'wp_remote_retrieve_response_code' => 200,
			)
		);
	}

	/**
	 * Test generating @font-face css for Google Fonts.
	 */
	public function test_provider_generates_font_face_css() {
		$request_url  = 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Lato:wght@300;400;500;600&display=fallback';
		$request_args = array( 'user-agent' => 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:73.0) Gecko/20100101 Firefox/73.0' );

		// This should be called twice, like `wp_remote_retrieve_body` below; Brain\Monkey bug?
		Functions\expect( 'wp_safe_remote_get' )
			->once()
			->with( $request_url, $request_args );

		Functions\expect( 'wp_remote_retrieve_body' )
			->twice()
			->andReturn( $this->api_response(), $this->api_response( 'swap' ) );

		$fonts = array(
			// Normal font with a range of weights.
			array(
				'provider'     => 'jetpack-google-fonts',
				'font-family'  => 'Roboto',
				'font-style'   => 'normal',
				'font-weight'  => '100 900',
				'font-display' => 'fallback',
			),
			// Italic font with a range of weights.
			array(
				'provider'     => 'jetpack-google-fonts',
				'font-family'  => 'Roboto',
				'font-style'   => 'italic',
				'font-weight'  => '100 900',
				'font-display' => 'fallback',
			),
			// Additional font family.
			array(
				'provider'     => 'jetpack-google-fonts',
				'font-family'  => 'Lato',
				'font-style'   => 'normal',
				'font-weight'  => '300 600',
				'font-display' => 'fallback',
			),
			// Different fallback method to test additional API request.
			array(
				'provider'     => 'jetpack-google-fonts',
				'font-family'  => 'Roboto',
				'font-style'   => 'normal',
				'font-weight'  => '200',
				'font-display' => 'swap',
			),
		);

		$provider = new Google_Fonts_Provider();
		$provider->set_webfonts( $fonts );

		$font_css = $provider->get_css();

		$this->assertEquals( $font_css, $this->api_response() . $this->api_response( 'swap' ) );
	}

		/**
		 * Test teardown.
		 *
		 * @after
		 */
	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * Mock Google Fonts API response.
	 *
	 * An actual response should have many more @font-face declarations, but a single one works fine for testing.
	 *
	 * @param string $font_display Font display value.
	 */
	private function api_response( $font_display = 'fallback' ) {
		return "
		/* latin */
		@font-face {
			font-family: \'Roboto\';
			font-style: normal;
			font-weight: 400;
			font-display: $font_display;
			src: url(https://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmYUtfBBc4.woff2) format(\'woff2\');
			unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
		}";
	}
}

// Font provider abstract class, same as in Gutenberg/Core.
//phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound, Squiz.Commenting
if ( ! class_exists( '\WP_Webfonts_Provider' ) ) {
	abstract class WP_Webfonts_Provider {
		protected $webfonts = array();

		public function set_webfonts( array $webfonts ) {
			$this->webfonts = $webfonts;
		}

		abstract public function get_css();
	}
}
//phpcs:enable
