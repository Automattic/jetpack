<?php
/**
 * Button Block rendering helper tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/button/button.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Button Block get_button_classes and get_button_styles tests.
 *
 * These tests verify that CSS class generation for named font family presets and
 * inline style generation for custom font families work correctly on the frontend.
 *
 * @covers ::Automattic\Jetpack\Extensions\Button\get_button_classes
 * @covers ::Automattic\Jetpack\Extensions\Button\get_button_styles
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Button\get_button_classes' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Button\get_button_styles' )]
class Button_Block_Render_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	// -------------------------------------------------------------------------
	// get_button_classes() tests
	// -------------------------------------------------------------------------

	/**
	 * Test that get_button_classes always includes the base class.
	 */
	public function test_get_button_classes_includes_base_class() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes( array() );
		$this->assertStringContainsString( 'wp-block-button__link', $result );
	}

	/**
	 * Test that a named font family preset adds the correct CSS class.
	 *
	 * Named font presets (from theme.json) must be represented as CSS classes so
	 * WordPress can load the font via its preset CSS variables rather than an
	 * inline slug value.
	 */
	public function test_get_button_classes_named_font_family_adds_class() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes(
			array( 'fontFamily' => 'arial' )
		);
		$this->assertStringContainsString( 'has-arial-font-family', $result );
	}

	/**
	 * Test that a named font family with hyphens generates the correct class.
	 */
	public function test_get_button_classes_named_font_family_with_hyphens() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes(
			array( 'fontFamily' => 'system-sans-serif' )
		);
		$this->assertStringContainsString( 'has-system-sans-serif-font-family', $result );
	}

	/**
	 * Test that without fontFamily attribute no font-family class is added.
	 */
	public function test_get_button_classes_no_font_family_class_when_unset() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes( array() );
		$this->assertStringNotContainsString( 'font-family', $result );
	}

	/**
	 * Test that a named font size adds the correct classes.
	 */
	public function test_get_button_classes_named_font_size() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes(
			array( 'fontSize' => 'large' )
		);
		$this->assertStringContainsString( 'has-large-font-size', $result );
		$this->assertStringContainsString( 'has-custom-font-size', $result );
	}

	/**
	 * Test that named text color adds the correct classes.
	 */
	public function test_get_button_classes_named_text_color() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes(
			array( 'textColor' => 'primary' )
		);
		$this->assertStringContainsString( 'has-text-color', $result );
		$this->assertStringContainsString( 'has-primary-color', $result );
	}

	/**
	 * Test that named background color adds the correct class.
	 */
	public function test_get_button_classes_named_background_color() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes(
			array( 'backgroundColor' => 'accent' )
		);
		$this->assertStringContainsString( 'has-background', $result );
		$this->assertStringContainsString( 'has-accent-background-color', $result );
	}

	/**
	 * Test that zero borderRadius adds the no-border-radius class.
	 */
	public function test_get_button_classes_zero_border_radius() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes(
			array( 'borderRadius' => 0 )
		);
		$this->assertStringContainsString( 'no-border-radius', $result );
	}

	/**
	 * Test that named border color adds the correct class.
	 */
	public function test_get_button_classes_named_border_color() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes(
			array( 'borderColor' => 'secondary' )
		);
		$this->assertStringContainsString( 'has-secondary-border-color', $result );
	}

	/**
	 * Test that font family class and font size class coexist correctly.
	 */
	public function test_get_button_classes_font_family_and_font_size_together() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_classes(
			array(
				'fontFamily' => 'georgia',
				'fontSize'   => 'medium',
			)
		);
		$this->assertStringContainsString( 'has-georgia-font-family', $result );
		$this->assertStringContainsString( 'has-medium-font-size', $result );
	}

	// -------------------------------------------------------------------------
	// get_button_styles() tests
	// -------------------------------------------------------------------------

	/**
	 * Test that a named font family does NOT add an inline font-family style.
	 *
	 * Named presets are loaded via CSS classes (has-*-font-family), so adding an
	 * inline style with the raw slug would not resolve to a valid font value.
	 */
	public function test_get_button_styles_named_font_family_no_inline_style() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array( 'fontFamily' => 'arial' )
		);
		$this->assertStringNotContainsString( 'font-family', $result );
	}

	/**
	 * Test that a custom font family stored in style.typography.fontFamily
	 * generates an inline font-family style.
	 *
	 * Custom (non-preset) fonts must be rendered as inline styles because there
	 * is no preset CSS class to rely on.
	 */
	public function test_get_button_styles_custom_font_family_inline_style() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array(
				'style' => array(
					'typography' => array(
						'fontFamily' => "'Helvetica Neue', sans-serif",
					),
				),
			)
		);
		$this->assertStringContainsString( "font-family: 'Helvetica Neue', sans-serif;", $result );
	}

	/**
	 * Test that a custom font family value is used verbatim in the inline style.
	 */
	public function test_get_button_styles_custom_font_family_value_preserved() {
		$custom_font = 'Roboto, "Open Sans", Arial, sans-serif';
		$result      = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array(
				'style' => array(
					'typography' => array(
						'fontFamily' => $custom_font,
					),
				),
			)
		);
		$this->assertStringContainsString( 'font-family: ' . $custom_font . ';', $result );
	}

	/**
	 * Test that without any font family attribute no font-family style is added.
	 */
	public function test_get_button_styles_no_font_family_when_unset() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles( array() );
		$this->assertStringNotContainsString( 'font-family', $result );
	}

	/**
	 * Test that a custom font size in style.typography generates an inline style.
	 */
	public function test_get_button_styles_custom_font_size() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array(
				'style' => array(
					'typography' => array(
						'fontSize' => '18px',
					),
				),
			)
		);
		$this->assertStringContainsString( 'font-size: 18px;', $result );
	}

	/**
	 * Test that text-transform from style.typography generates an inline style.
	 */
	public function test_get_button_styles_custom_text_transform() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array(
				'style' => array(
					'typography' => array(
						'textTransform' => 'uppercase',
					),
				),
			)
		);
		$this->assertStringContainsString( 'text-transform: uppercase;', $result );
	}

	/**
	 * Test that a custom text color generates an inline color style.
	 */
	public function test_get_button_styles_custom_text_color() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array( 'customTextColor' => '#FF0000' )
		);
		$this->assertStringContainsString( 'color: #FF0000;', $result );
	}

	/**
	 * Test that a named text color suppresses the custom text color inline style.
	 */
	public function test_get_button_styles_named_text_color_suppresses_custom() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array(
				'textColor'       => 'primary',
				'customTextColor' => '#FF0000',
			)
		);
		$this->assertStringNotContainsString( 'color:', $result );
	}

	/**
	 * Test that a custom background color generates an inline background-color style.
	 */
	public function test_get_button_styles_custom_background_color() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array( 'customBackgroundColor' => '#00FF00' )
		);
		$this->assertStringContainsString( 'background-color: #00FF00;', $result );
	}

	/**
	 * Test that a non-zero borderRadius generates an inline border-radius style.
	 */
	public function test_get_button_styles_non_zero_border_radius() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array( 'borderRadius' => 8 )
		);
		$this->assertStringContainsString( 'border-radius: 8px;', $result );
	}

	/**
	 * Test that both custom font family and other typography styles coexist.
	 */
	public function test_get_button_styles_custom_font_family_with_other_typography() {
		$result = \Automattic\Jetpack\Extensions\Button\get_button_styles(
			array(
				'style' => array(
					'typography' => array(
						'fontFamily'    => 'Georgia, serif',
						'fontSize'      => '20px',
						'textTransform' => 'capitalize',
					),
				),
			)
		);
		$this->assertStringContainsString( 'font-family: Georgia, serif;', $result );
		$this->assertStringContainsString( 'font-size: 20px;', $result );
		$this->assertStringContainsString( 'text-transform: capitalize;', $result );
	}
}
