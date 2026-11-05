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
require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-currencies.php';
require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';

/**
 * Donations block tests.
 *
 * @covers ::Automattic\Jetpack\Extensions\Donations\build_custom_styles
 * @covers ::Automattic\Jetpack\Extensions\Donations\sanitize_css_value
 * @covers ::Automattic\Jetpack\Extensions\Donations\build_security_data_attrs
 * @covers ::Automattic\Jetpack\Extensions\Donations\render_block
 */
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Donations\\sanitize_css_value' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Donations\\build_custom_styles' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Donations\\build_security_data_attrs' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Donations\\render_block' )]
class Donations_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Clean up the front-end render state.
	 */
	public function tear_down() {
		unset( $GLOBALS['post'] );
		delete_option( 'jetpack-memberships-has-connected-account' );
		WP_Block_Supports::$block_to_render = null;
		parent::tear_down();
	}

	/**
	 * Render the block on the front end of a page, with a connected Stripe account.
	 *
	 * @param array $attr Block attributes.
	 * @return string
	 */
	private function render_on_page( $attr ) {
		update_option( 'jetpack-memberships-has-connected-account', true );
		$GLOBALS['post'] = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		// WordPress sets this while rendering blocks; older versions warn from get_block_wrapper_attributes() without it.
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'jetpack/donations',
			'attrs'     => $attr,
		);

		return Donations\render_block(
			array_merge(
				array(
					'currency'         => 'USD',
					'showCustomAmount' => false,
					'oneTimeDonation'  => array( 'show' => false ),
					'monthlyDonation'  => array( 'show' => false ),
					'annualDonation'   => array( 'show' => false ),
				),
				$attr
			),
			''
		);
	}

	/**
	 * An interval whose plan ID doesn't point at a payment plan is left out, instead of linking to a broken checkout.
	 *
	 * @dataProvider invalid_plan_id_provider
	 *
	 * @param string $invalid_plan Which kind of invalid plan ID the monthly interval gets.
	 */
	#[DataProvider( 'invalid_plan_id_provider' )]
	public function test_render_block_leaves_out_intervals_without_a_plan( $invalid_plan ) {
		$plan_id    = self::factory()->post->create( array( 'post_type' => Jetpack_Memberships::$post_type_plan ) );
		$regular_id = self::factory()->post->create();

		$html = $this->render_on_page(
			array(
				'oneTimeDonation' => array(
					'show'    => true,
					'planId'  => $plan_id,
					'amounts' => array( 5 ),
				),
				'monthlyDonation' => array(
					'show'    => true,
					'planId'  => 'regular post' === $invalid_plan ? $regular_id : null,
					'amounts' => array( 5 ),
				),
			)
		);

		$this->assertStringContainsString( 'plan=' . $plan_id . '&', html_entity_decode( $html ) );
		$this->assertStringNotContainsString( 'donations__monthly-item', $html );
	}

	/**
	 * Invalid plan IDs for test_render_block_leaves_out_intervals_without_a_plan.
	 *
	 * @return array
	 */
	public static function invalid_plan_id_provider() {
		return array(
			'missing plan ID'      => array( 'missing' ),
			'ID of a regular post' => array( 'regular post' ),
		);
	}

	/**
	 * A block with no valid plan at all renders nothing, rather than a button that opens an empty form.
	 */
	public function test_render_block_renders_nothing_without_any_plan() {
		$html = $this->render_on_page(
			array(
				'displayMode'     => 'modal',
				'oneTimeDonation' => array(
					'show'    => true,
					'planId'  => null,
					'amounts' => array( 3, 5, 8 ),
				),
				'monthlyDonation' => array(
					'show'    => true,
					'planId'  => null,
					'amounts' => array( 3, 5, 8 ),
				),
			)
		);

		$this->assertSame( '', $html );
	}

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
	 * User-set tab padding only affects the pill interior; it must not also push
	 * the buttons-style nav container's vertical padding (which controls the
	 * space between the form border and the top of the pill row).
	 */
	public function test_build_custom_styles_tab_padding_does_not_touch_buttons_nav() {
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
			'.jp-donations-1 .donations__nav-item{padding-top:8px;padding-right:20px;padding-bottom:8px;padding-left:20px}',
			$css
		);
		$this->assertStringNotContainsString( 'is-style-buttons', $css );
	}

	/**
	 * Amount tile styling with a uniform BorderBoxControl value plus a uniform
	 * radius emits one combined rule on `.donations__amount`.
	 */
	public function test_build_custom_styles_emits_amount_uniform_border() {
		$attr = array(
			'amountFontSize'     => '18px',
			'amountBorder'       => array(
				'color' => '#abc',
				'style' => 'solid',
				'width' => '2px',
			),
			'amountBorderRadius' => '8px',
		);

		$css = Donations\build_custom_styles( $attr, '.jp-donations-1' );

		$this->assertStringContainsString(
			'.jp-donations-1 .donations__amount{font-size:18px;border-color:#abc;border-style:solid;border-width:2px;border-radius:8px}',
			$css
		);
	}

	/**
	 * Split (per-side) BorderBoxControl values emit individual side declarations.
	 */
	public function test_build_custom_styles_emits_amount_split_border() {
		$attr = array(
			'amountBorder' => array(
				'top'    => array(
					'color' => '#000',
					'style' => 'solid',
					'width' => '2px',
				),
				'bottom' => array(
					'color' => '#fff',
					'style' => 'dashed',
					'width' => '1px',
				),
			),
		);

		$css = Donations\build_custom_styles( $attr, '.jp-donations-1' );

		$this->assertStringContainsString( 'border-top-color:#000', $css );
		$this->assertStringContainsString( 'border-top-style:solid', $css );
		$this->assertStringContainsString( 'border-top-width:2px', $css );
		$this->assertStringContainsString( 'border-bottom-color:#fff', $css );
		$this->assertStringContainsString( 'border-bottom-style:dashed', $css );
		$this->assertStringContainsString( 'border-bottom-width:1px', $css );
	}

	/**
	 * Per-corner radius values emit individual corner declarations.
	 */
	public function test_build_custom_styles_emits_amount_per_corner_radius() {
		$attr = array(
			'amountBorderRadius' => array(
				'topLeft'     => '8px',
				'topRight'    => '8px',
				'bottomRight' => '0',
				'bottomLeft'  => '0',
			),
		);

		$css = Donations\build_custom_styles( $attr, '.jp-donations-1' );

		$this->assertStringContainsString( 'border-top-left-radius:8px', $css );
		$this->assertStringContainsString( 'border-top-right-radius:8px', $css );
		$this->assertStringContainsString( 'border-bottom-right-radius:0', $css );
		$this->assertStringContainsString( 'border-bottom-left-radius:0', $css );
	}

	/**
	 * Tab border color applies to both the nav (default-style divider line) and
	 * the nav items (default-style per-tab dividers and buttons-style pill borders).
	 */
	public function test_build_custom_styles_emits_tab_border_color() {
		$css = Donations\build_custom_styles( array( 'tabBorderColor' => '#abc' ), '.jp-donations-1' );
		// The user-set Tab Border color also applies to the active pill in the
		// Buttons appearance, so the rule's selector list includes
		// `.donations__nav-item.is-active`.
		$this->assertStringContainsString(
			'.jp-donations-1 .donations__nav,.jp-donations-1 .donations__nav-item,.jp-donations-1 .donations__nav-item.is-active{border-color:#abc}',
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

	/**
	 * No min/max set: only data-stripe-min-error is present.
	 */
	public function test_build_security_data_attrs_no_limits() {
		$attrs = Donations\build_security_data_attrs( array(), 'USD' );

		$this->assertArrayNotHasKey( 'data-min-amount', $attrs );
		$this->assertArrayNotHasKey( 'data-min-error', $attrs );
		$this->assertArrayNotHasKey( 'data-max-amount', $attrs );
		$this->assertArrayNotHasKey( 'data-max-error', $attrs );
		$this->assertArrayHasKey( 'data-stripe-min-error', $attrs );
		$this->assertStringContainsString( '$0.50', $attrs['data-stripe-min-error'] );
	}

	/**
	 * Minimum set: data-min-amount and data-min-error are present with correct values.
	 */
	public function test_build_security_data_attrs_with_minimum() {
		$attrs = Donations\build_security_data_attrs( array( 'minimumAmount' => 10 ), 'USD' );

		$this->assertSame( 10.0, $attrs['data-min-amount'] );
		$this->assertStringContainsString( '$10.00', $attrs['data-min-error'] );
		$this->assertArrayNotHasKey( 'data-max-amount', $attrs );
	}

	/**
	 * Maximum set: data-max-amount and data-max-error are present with correct values.
	 */
	public function test_build_security_data_attrs_with_maximum() {
		$attrs = Donations\build_security_data_attrs( array( 'maximumAmount' => 500 ), 'USD' );

		$this->assertSame( 500.0, $attrs['data-max-amount'] );
		$this->assertStringContainsString( '$500.00', $attrs['data-max-error'] );
		$this->assertArrayNotHasKey( 'data-min-amount', $attrs );
	}

	/**
	 * Stripe floor message reflects the currency — GBP minimum is £0.30, not $0.50.
	 */
	public function test_build_security_data_attrs_stripe_min_is_currency_aware() {
		$usd_attrs = Donations\build_security_data_attrs( array(), 'USD' );
		$gbp_attrs = Donations\build_security_data_attrs( array(), 'GBP' );

		$this->assertStringContainsString( '$0.50', $usd_attrs['data-stripe-min-error'] );
		// GBP symbol is stored as an HTML entity in CURRENCIES, so format_price returns '&#163;'.
		$this->assertStringContainsString( '&#163;0.30', $gbp_attrs['data-stripe-min-error'] );
	}

	/**
	 * Both min and max set: all four data attributes are present with correct values.
	 */
	public function test_build_security_data_attrs_with_both_limits() {
		$attrs = Donations\build_security_data_attrs(
			array(
				'minimumAmount' => 5,
				'maximumAmount' => 250,
			),
			'USD'
		);

		$this->assertSame( 5.0, $attrs['data-min-amount'] );
		$this->assertStringContainsString( '$5.00', $attrs['data-min-error'] );
		$this->assertSame( 250.0, $attrs['data-max-amount'] );
		$this->assertStringContainsString( '$250.00', $attrs['data-max-error'] );
		$this->assertArrayHasKey( 'data-stripe-min-error', $attrs );
	}

	/**
	 * Inverted config (max < min): both data attributes are still emitted.
	 * The editor shows a warning; the PHP layer does not silently discard either value.
	 */
	public function test_build_security_data_attrs_inverted_limits_both_emitted() {
		$attrs = Donations\build_security_data_attrs(
			array(
				'minimumAmount' => 100,
				'maximumAmount' => 10,
			),
			'USD'
		);

		$this->assertSame( 100.0, $attrs['data-min-amount'] );
		$this->assertSame( 10.0, $attrs['data-max-amount'] );
	}
}
