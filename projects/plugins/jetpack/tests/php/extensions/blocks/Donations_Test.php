<?php
/**
 * Donations Block tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\Donations;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
require_once JETPACK__PLUGIN_DIR . '/extensions/blocks/donations/donations.php';

/**
 * Donations block tests.
 *
 * @covers ::Automattic\Jetpack\Extensions\Donations\build_custom_styles
 * @covers ::Automattic\Jetpack\Extensions\Donations\sanitize_color_for_css
 */
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Donations\\sanitize_color_for_css' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Donations\\build_custom_styles' )]
class Donations_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Sanitizer accepts safe color values and rejects unsafe ones.
	 *
	 * @dataProvider sanitize_color_for_css_provider
	 *
	 * @param mixed  $input    Raw value passed to the sanitizer.
	 * @param string $expected Expected sanitized return value.
	 */
	#[DataProvider( 'sanitize_color_for_css_provider' )]
	public function test_sanitize_color_for_css( $input, $expected ) {
		$this->assertSame( $expected, Donations\sanitize_color_for_css( $input ) );
	}

	/**
	 * Inputs and expected outputs for sanitize_color_for_css.
	 *
	 * @return array
	 */
	public static function sanitize_color_for_css_provider() {
		return array(
			'hex short'       => array( '#fff', '#fff' ),
			'hex long'        => array( '#ff0000', '#ff0000' ),
			'rgb'             => array( 'rgb(255, 0, 0)', 'rgb(255, 0, 0)' ),
			'rgba'            => array( 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)' ),
			'hsl'             => array( 'hsl(120, 50%, 50%)', 'hsl(120, 50%, 50%)' ),
			'named color'     => array( 'transparent', 'transparent' ),
			'css variable'    => array( 'var(--wp--preset--color--primary)', 'var(--wp--preset--color--primary)' ),
			'leading spaces'  => array( '   #abc   ', '#abc' ),
			'empty string'    => array( '', '' ),
			'whitespace only' => array( '   ', '' ),
			'null'            => array( null, '' ),
			'integer'         => array( 42, '' ),
			'array'           => array( array( '#fff' ), '' ),
			'angle bracket'   => array( '<script', '' ),
			'closing brace'   => array( 'red}body{display:none', '' ),
			'semicolon'       => array( 'red;color:blue', '' ),
			'single quote'    => array( "red'", '' ),
			'double quote'    => array( 'red"', '' ),
			'backslash'       => array( 'red\\', '' ),
			'too long'        => array( str_repeat( 'a', 101 ), '' ),
			'exactly 100'     => array( str_repeat( 'a', 100 ), str_repeat( 'a', 100 ) ),
		);
	}

	/**
	 * Build_custom_styles returns an empty string when no per-state colors are set.
	 */
	public function test_build_custom_styles_returns_empty_when_no_overrides() {
		$this->assertSame( '', Donations\build_custom_styles( array(), '.jp-donations-1' ) );
	}

	/**
	 * Build_custom_styles produces scoped CSS rules covering each set color.
	 */
	public function test_build_custom_styles_emits_rules_for_each_set_color() {
		$attr = array(
			'activeTabBackgroundColor'      => '#000',
			'activeTabTextColor'            => '#fff',
			'inactiveTabBackgroundColor'    => '#eee',
			'inactiveTabTextColor'          => '#333',
			'selectedAmountBackgroundColor' => 'red',
			'selectedAmountTextColor'       => 'white',
		);

		$css = Donations\build_custom_styles( $attr, '.jp-donations-1' );

		$this->assertStringContainsString( '.jp-donations-1 .donations__nav-item.is-active{background:#000;color:#fff}', $css );
		$this->assertStringContainsString( '.jp-donations-1 .donations__nav-item:not(.is-active){background:#eee;color:#333}', $css );
		$this->assertStringContainsString( '.jp-donations-1 .donations__amount.is-selected{background-color:red;color:white}', $css );
	}

	/**
	 * Unsafe values for per-state colors are dropped, not rendered as CSS.
	 */
	public function test_build_custom_styles_drops_unsafe_values() {
		$attr = array(
			'activeTabBackgroundColor' => 'red;background:url(javascript:alert(1))',
			'activeTabTextColor'       => '#fff',
		);

		$css = Donations\build_custom_styles( $attr, '.jp-donations-1' );

		// The unsafe background was rejected, but the safe text color still appears.
		$this->assertStringNotContainsString( 'javascript', $css );
		$this->assertStringNotContainsString( 'background:red', $css );
		$this->assertStringContainsString( 'color:#fff', $css );
	}
}
