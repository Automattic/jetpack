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
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
 */
#[CoversClass( Contact_Form_Plugin::class )]
class Contact_Form_Plugin_Global_Styles_Label_Test extends BaseTestCase {

	/**
	 * Drop the stylesheet so inline CSS from one test cannot leak into the next.
	 */
	public function tear_down() {
		wp_deregister_style( 'grunion.css' );
		parent::tear_down();
	}

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
	 * Style objects that must produce no CSS at all, so sites without label styles are unchanged.
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

	public function test_contested_font_weight_is_reasserted_and_mirrored() {
		$css = $this->build( array( 'typography' => array( 'fontWeight' => '900' ) ) );

		$this->assertSame( 2, substr_count( $css, 'font-weight:900' ), 'font-weight belongs in the re-assert and the mirror' );
		$this->assertStringContainsString( 'label.below-label__label', $css, 'Below-style labels must match the legends' );
	}

	public function test_outlined_and_animated_keep_their_own_weight_after_the_reassert() {
		$css = $this->build( array( 'typography' => array( 'fontWeight' => '900' ) ) );

		$outlined = strpos( $css, '.is-style-outlined :is(label.grunion-field-label' );
		$animated = strpos( $css, '.is-style-animated :is(label.grunion-field-label' );
		$this->assertNotFalse( $outlined );
		$this->assertNotFalse( $animated );
		$this->assertGreaterThan( strrpos( $css, 'font-weight:900' ), $outlined, 'the guard must print after the rules it overrides' );
		$this->assertStringContainsString( '){font-weight:300}', substr( $css, $outlined, strpos( $css, '}', $outlined ) - $outlined + 1 ) );
		$this->assertStringContainsString( '){font-weight:700}', substr( $css, $animated ) );
	}

	/**
	 * A string `spacing.margin` comes out of the style engine as the `margin` shorthand.
	 */
	public function test_shorthand_margin_reaches_both_the_label_and_the_legend() {
		$css = $this->build( array( 'spacing' => array( 'margin' => '2rem' ) ) );

		$this->assertSame( 2, substr_count( $css, 'margin:2rem' ), 'shorthand margin belongs in both rules' );
		$this->assertStringNotContainsString( 'is-style-outlined', $css, 'weight guards only follow a font-weight' );
	}

	public function test_longhand_margin_bottom_reaches_both_the_label_and_the_legend() {
		$css = $this->build( array( 'spacing' => array( 'margin' => array( 'bottom' => '40px' ) ) ) );

		$this->assertSame( 2, substr_count( $css, 'margin-bottom:40px' ), 'margin-bottom belongs in both rules' );
	}

	public function test_unresolved_ref_margin_is_dropped_quietly() {
		$css = $this->build(
			array(
				'spacing' => array( 'margin' => array( 'bottom' => array( 'ref' => 'styles.spacing.blockGap' ) ) ),
				'color'   => array( 'text' => '#1d4ed8' ),
			)
		);

		$this->assertStringContainsString( '#1d4ed8', $css );
		$this->assertStringNotContainsString( 'margin', $css );
	}

	public function test_uncontested_properties_are_mirrored_but_not_reasserted() {
		$css = $this->build( array( 'color' => array( 'text' => '#1d4ed8' ) ) );

		$this->assertStringContainsString( 'legend.grunion-field-label', $css );
		$this->assertStringNotContainsString( 'label.grunion-field-label', $css, 'no re-assert rule is needed' );
		$this->assertSame( 1, substr_count( $css, '#1d4ed8' ) );
	}

	public function test_reassert_selector_excludes_the_deliberate_exemptions() {
		$css = $this->build( array( 'typography' => array( 'fontWeight' => '900' ) ) );

		$this->assertStringContainsString( 'label.grunion-field-label:not(.consent)', $css );
		$this->assertStringContainsString( ':not(.checkbox)', $css );
	}

	public function test_style_tag_in_a_value_cannot_escape_the_style_element() {
		$css = $this->build( array( 'typography' => array( 'fontWeight' => '600</style><script>alert`1`</script>' ) ) );

		$this->assertNotSame( '', $css, 'the field must still be processed, not silently dropped' );
		$this->assertStringNotContainsString( '</style>', $css );
		$this->assertStringNotContainsString( '<script', $css );
	}

	public function test_brace_in_a_value_cannot_break_out_of_the_rule() {
		$css = $this->build(
			array(
				'typography' => array( 'fontWeight' => '600; } body { display: none' ),
				'color'      => array( 'text' => '#1d4ed8' ),
			)
		);

		$this->assertStringContainsString( '#1d4ed8', $css, 'the rest of the style object must still be emitted' );
		$this->assertStringNotContainsString( 'body', $css, 'no smuggled selector should survive' );
		$this->assertSame( substr_count( $css, '{' ), substr_count( $css, '}' ), 'braces must stay balanced' );
	}

	/**
	 * Before WP 7.1 core sanitizes the `label` element away, so this is every site's state today.
	 */
	public function test_enqueue_attaches_nothing_when_the_resolver_has_no_label_styles() {
		wp_register_style( 'grunion.css', 'https://example.org/grunion.css', array(), '1.0' );

		Contact_Form_Plugin::add_global_styles_label_css();

		$this->assertEmpty( wp_styles()->get_data( 'grunion.css', 'after' ) );
	}

	/**
	 * Core's resolver drops `label` before WP 7.1, so stand in for the Gutenberg one, which is preferred.
	 */
	public function test_enqueue_attaches_the_mirror_when_the_site_has_label_styles() {
		if ( class_exists( 'WP_Theme_JSON_Resolver_Gutenberg' ) ) {
			$this->markTestSkipped( 'Needs the stub resolver, but Gutenberg\'s is loaded.' );
		}
		$stub = new class() {
			/**
			 * Raw merged theme.json data to return.
			 *
			 * @var array
			 */
			public static $raw = array();

			/**
			 * Mimic the resolver's merged data object.
			 *
			 * @return object
			 */
			public static function get_merged_data() {
				return new class( self::$raw ) {
					/**
					 * Raw data.
					 *
					 * @var array
					 */
					private $raw;

					/**
					 * Constructor.
					 *
					 * @param array $raw Raw data.
					 */
					public function __construct( $raw ) {
						$this->raw = $raw;
					}

					/**
					 * Raw data accessor.
					 *
					 * @return array
					 */
					public function get_raw_data() {
						return $this->raw;
					}
				};
			}
		};
		class_alias( get_class( $stub ), 'WP_Theme_JSON_Resolver_Gutenberg' );
		$stub::$raw = array( 'styles' => array( 'elements' => array( 'label' => array( 'typography' => array( 'fontWeight' => '900' ) ) ) ) );
		wp_register_style( 'grunion.css', 'https://example.org/grunion.css', array(), '1.0' );

		try {
			Contact_Form_Plugin::add_global_styles_label_css();
		} finally {
			$stub::$raw = array();
		}

		$after = implode( '', (array) wp_styles()->get_data( 'grunion.css', 'after' ) );
		$this->assertStringContainsString( '.contact-form :where(legend.grunion-field-label){font-weight:900;}', $after );
	}
}
