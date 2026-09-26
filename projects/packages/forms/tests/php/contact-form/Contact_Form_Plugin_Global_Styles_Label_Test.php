<?php
/**
 * Unit tests for the Global Styles `label` element CSS emitted by Contact_Form_Plugin.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Covers Contact_Form_Plugin::build_global_styles_label_css() and its enqueue glue.
 *
 * Global Styles emits `label { ... }` at specificity (0,0,1). The form's own defaults in
 * grunion.css sit at (0,1,0) and would win, so `font-weight` and `margin` are re-asserted
 * at our specificity when -- and only when -- the site has set label styles. The full style
 * object is also mirrored onto `legend.grunion-field-label`, which `label { ... }` can never
 * match because a grouped field's label is a `<legend>`.
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
 */
#[CoversClass( Contact_Form_Plugin::class )]
class Contact_Form_Plugin_Global_Styles_Label_Test extends BaseTestCase {

	/**
	 * Invoke the private CSS builder.
	 *
	 * @param mixed $label Style object for the label element.
	 * @return string
	 */
	private function build( $label ) {
		$method = new \ReflectionMethod( Contact_Form_Plugin::class, 'build_global_styles_label_css' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( null, $label );
	}

	/**
	 * Style objects that must produce no CSS at all.
	 *
	 * The empty case is the zero-regression contract: nearly every site has no label styles
	 * set, and those sites must render byte-identically to before this feature existed.
	 */
	public static function emptyStyleObjects() {
		return array(
			'empty array'       => array( array() ),
			'null'              => array( null ),
			'not an array'      => array( 'nonsense' ),
			'pseudo state only' => array( array( ':hover' => array( 'color' => array( 'text' => 'red' ) ) ) ),
			'unknown keys only' => array( array( 'somethingElse' => array( 'nope' => '1' ) ) ),
		);
	}

	/**
	 * A site with no label styles must get no inline CSS whatsoever.
	 *
	 * @param mixed $label Style object.
	 * @dataProvider emptyStyleObjects
	 */
	#[DataProvider( 'emptyStyleObjects' )]
	public function test_emits_nothing_when_there_are_no_label_styles( $label ) {
		$this->assertSame( '', $this->build( $label ) );
	}

	/**
	 * The font-weight property is contested by grunion.scss, so it is re-asserted and mirrored.
	 */
	public function test_contested_font_weight_is_reasserted_and_mirrored() {
		$css = $this->build( array( 'typography' => array( 'fontWeight' => '900' ) ) );

		$this->assertStringContainsString( 'font-weight:900', $css, 'the re-assert rule should carry the value' );
		$this->assertStringContainsString( 'legend.grunion-field-label', $css, 'the legend mirror should be emitted' );
		$this->assertSame( 2, substr_count( $css, 'font-weight' ), 'font-weight belongs in both rules' );
	}

	/**
	 * A theme.json `spacing.margin` may be a string, which the style engine emits as a
	 * single `margin` declaration rather than longhands. If the re-assert list only looked
	 * for longhands it would match nothing, leaving the label on grunion's margin while the
	 * legend took the Global Styles one -- the exact label/legend split this feature exists
	 * to remove, inverted.
	 */
	public function test_shorthand_margin_reaches_both_the_label_and_the_legend() {
		$css = $this->build( array( 'spacing' => array( 'margin' => '2rem' ) ) );

		$this->assertStringContainsString( 'margin:2rem', $css );
		$this->assertSame( 2, substr_count( $css, 'margin:2rem' ), 'shorthand margin belongs in both rules' );
	}

	/**
	 * The longhand form has to work the same way.
	 */
	public function test_longhand_margin_bottom_reaches_both_the_label_and_the_legend() {
		$css = $this->build( array( 'spacing' => array( 'margin' => array( 'bottom' => '40px' ) ) ) );

		$this->assertSame( 2, substr_count( $css, 'margin-bottom:40px' ), 'margin-bottom belongs in both rules' );
	}

	/**
	 * Properties grunion.scss does not set on labels are already reachable by Global Styles
	 * at (0,0,1), so re-asserting them would be pointless breadth. Only the legend, which
	 * `label { ... }` cannot match, needs them.
	 */
	public function test_uncontested_properties_are_mirrored_but_not_reasserted() {
		$css = $this->build( array( 'color' => array( 'text' => '#1d4ed8' ) ) );

		$this->assertStringContainsString( 'legend.grunion-field-label', $css );
		$this->assertStringNotContainsString( ':where(label.grunion-field-label', $css, 'no re-assert rule is needed' );
		$this->assertSame( 1, substr_count( $css, '#1d4ed8' ) );
	}

	/**
	 * The re-assert rule sits at the same specificity as several deliberate exemptions in
	 * grunion.scss and prints after them, so it must not sweep them up. Consent text and
	 * checkbox option labels carry their own classes; the Outlined and Animated inset labels
	 * carry no `grunion-field-label` class at all.
	 */
	public function test_reassert_selector_excludes_the_deliberate_exemptions() {
		$css = $this->build( array( 'typography' => array( 'fontWeight' => '900' ) ) );

		$this->assertStringContainsString( ':where(label.grunion-field-label:not(.consent)', $css );
		$this->assertStringContainsString( ':not(.checkbox)', $css );
	}

	/**
	 * The safecss_filter_attr() helper is an allowlist plus a character blocklist; it does not
	 * strip HTML. Without wp_strip_all_tags() first, `600</style>` survives intact and closes
	 * the inline style element early.
	 */
	public function test_style_tag_in_a_value_cannot_escape_the_style_element() {
		$css = $this->build( array( 'typography' => array( 'fontWeight' => '600</style><script>alert`1`</script>' ) ) );

		$this->assertStringNotContainsString( '</style>', $css );
		$this->assertStringNotContainsString( '<script', $css );
	}

	/**
	 * A value carrying `}` would close the rule and admit arbitrary selectors after it.
	 */
	public function test_brace_in_a_value_cannot_break_out_of_the_rule() {
		$css = $this->build( array( 'typography' => array( 'fontWeight' => '600; } body { display: none' ) ) );

		$this->assertStringNotContainsString( 'body', $css, 'no smuggled selector should survive' );
	}

	/**
	 * The enqueue glue must attach nothing when the resolver reports no label styles. On any
	 * WordPress before 7.1 the `label` element is not in WP_Theme_JSON::ELEMENTS, so it is
	 * sanitized away and this is the state every site is in today.
	 */
	public function test_enqueue_attaches_nothing_when_the_resolver_has_no_label_styles() {
		wp_register_style( 'grunion.css', 'https://example.org/grunion.css', array(), '1.0' );

		Contact_Form_Plugin::add_global_styles_label_css();

		$this->assertEmpty( wp_styles()->get_data( 'grunion.css', 'after' ) );
	}
}
