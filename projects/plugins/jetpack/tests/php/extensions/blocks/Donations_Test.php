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
 * @covers ::Automattic\Jetpack\Extensions\Donations\sanitize_css_value
 */
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Donations\\sanitize_css_value' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Donations\\build_custom_styles' )]
class Donations_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Sanitizer accepts safe color values and rejects unsafe ones.
	 *
	 * @dataProvider sanitize_css_value_provider
	 *
	 * @param mixed  $input    Raw value passed to the sanitizer.
	 * @param string $expected Expected sanitized return value.
	 */
	#[DataProvider( 'sanitize_css_value_provider' )]
	public function test_sanitize_css_value( $input, $expected ) {
		$this->assertSame( $expected, Donations\sanitize_css_value( $input ) );
	}

	/**
	 * Inputs and expected outputs for sanitize_css_value.
	 *
	 * @return array
	 */
	public static function sanitize_css_value_provider() {
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

	/**
	 * Build_custom_styles emits font-size and per-side padding for tabs.
	 */
	public function test_build_custom_styles_emits_tab_dimensions() {
		$attr = array(
			'tabFontSize' => '18px',
			'tabPadding'  => array(
				'top'    => '12px',
				'right'  => '20px',
				'bottom' => '12px',
				'left'   => '20px',
			),
		);

		$css = Donations\build_custom_styles( $attr, '.jp-donations-1' );

		$this->assertStringContainsString(
			'.jp-donations-1 .donations__nav-item{font-size:18px;padding-top:12px;padding-right:20px;padding-bottom:12px;padding-left:20px}',
			$css
		);
	}

	/**
	 * Partial tab padding emits only the sides the user specified.
	 */
	public function test_build_custom_styles_partial_tab_padding() {
		$attr = array(
			'tabPadding' => array(
				'top'    => '8px',
				'bottom' => '8px',
			),
		);

		$css = Donations\build_custom_styles( $attr, '.jp-donations-1' );

		$this->assertStringContainsString(
			'.jp-donations-1 .donations__nav-item{padding-top:8px;padding-bottom:8px}',
			$css
		);
		$this->assertStringNotContainsString( 'padding-left', $css );
		$this->assertStringNotContainsString( 'padding-right', $css );
	}

	/**
	 * Build_custom_styles emits font-size and padding for the donate button.
	 */
	public function test_build_custom_styles_emits_button_dimensions() {
		$attr = array(
			'buttonFontSize' => '20px',
			'buttonPadding'  => array(
				'top'    => '10px',
				'right'  => '24px',
				'bottom' => '10px',
				'left'   => '24px',
			),
		);

		$css = Donations\build_custom_styles( $attr, '.jp-donations-1' );

		$this->assertStringContainsString(
			'.jp-donations-1 .donations__donate-button{font-size:20px;padding-top:10px;padding-right:24px;padding-bottom:10px;padding-left:24px}',
			$css
		);
	}

	/**
	 * Build_custom_styles emits text-align rule for left/center/right alignment.
	 *
	 * @dataProvider button_alignment_provider
	 *
	 * @param string $alignment Alignment value.
	 */
	#[DataProvider( 'button_alignment_provider' )]
	public function test_build_custom_styles_emits_text_align( $alignment ) {
		$attr = array( 'buttonAlignment' => $alignment );
		$css  = Donations\build_custom_styles( $attr, '.jp-donations-1' );
		$this->assertStringContainsString(
			'.jp-donations-1 .donations__donate-button-wrapper{text-align:' . $alignment . '}',
			$css
		);
	}

	/**
	 * Alignment values that map to a text-align rule.
	 *
	 * @return array
	 */
	public static function button_alignment_provider() {
		return array(
			'left'   => array( 'left' ),
			'center' => array( 'center' ),
			'right'  => array( 'right' ),
		);
	}

	/**
	 * Full-width alignment emits block-level width 100% rules instead of text-align on
	 * the wrapper, and centers the text inside the now-block-level button.
	 */
	public function test_build_custom_styles_emits_full_width() {
		$css = Donations\build_custom_styles( array( 'buttonAlignment' => 'full' ), '.jp-donations-1' );
		$this->assertStringContainsString(
			'.jp-donations-1 .donations__donate-button-wrapper{display:block;width:100%}',
			$css
		);
		$this->assertStringContainsString(
			'.jp-donations-1 .donations__donate-button{display:block;width:100%;box-sizing:border-box;text-align:center}',
			$css
		);
		$this->assertStringNotContainsString( 'donate-button-wrapper{text-align', $css );
	}

	/**
	 * Buttons-style nav inherits user-set tab padding-top/bottom so the row scales
	 * with the pill interior padding.
	 */
	public function test_build_custom_styles_buttons_nav_mirrors_tab_padding() {
		$attr = array(
			'tabPadding' => array(
				'top'    => '8px',
				'bottom' => '8px',
				'left'   => '20px',
				'right'  => '20px',
			),
		);

		$css = Donations\build_custom_styles( $attr, '.jp-donations-1' );

		$this->assertStringContainsString(
			'.jp-donations-1.is-style-buttons .donations__nav{padding-top:8px;padding-bottom:8px}',
			$css
		);
	}

	/**
	 * Without a top or bottom user value, no buttons-style nav rule is emitted.
	 */
	public function test_build_custom_styles_no_buttons_nav_rule_without_user_padding() {
		$css = Donations\build_custom_styles( array(), '.jp-donations-1' );
		$this->assertStringNotContainsString( 'is-style-buttons', $css );
	}

	/**
	 * Tab border color applies to both the nav (default-style divider line) and
	 * the nav items (default-style per-tab dividers and buttons-style pill borders).
	 */
	public function test_build_custom_styles_emits_tab_border_color() {
		$css = Donations\build_custom_styles( array( 'tabBorderColor' => '#abc' ), '.jp-donations-1' );
		$this->assertStringContainsString(
			'.jp-donations-1 .donations__nav,.jp-donations-1 .donations__nav-item{border-color:#abc}',
			$css
		);
	}

	/**
	 * Unknown alignment values are dropped.
	 */
	public function test_build_custom_styles_drops_unknown_alignment() {
		$css = Donations\build_custom_styles( array( 'buttonAlignment' => 'wat' ), '.jp-donations-1' );
		$this->assertStringNotContainsString( 'donate-button-wrapper', $css );
	}
}
