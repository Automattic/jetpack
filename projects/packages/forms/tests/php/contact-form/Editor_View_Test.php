<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\ContactForm\Editor_View.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Editor_View
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Editor_View
 */
#[CoversClass( Editor_View::class )]
class Editor_View_Test extends BaseTestCase {

	/**
	 * Test that the checkbox template has a non-empty value attribute.
	 *
	 * This test verifies the fix for the bug where esc_attr__() was used instead of esc_attr_e(),
	 * causing the checkbox value attribute to be empty since esc_attr__() returns but doesn't echo.
	 */
	public function test_checkbox_template_has_value() {
		ob_start();
		Editor_View::editor_view_js_templates();
		$output = ob_get_clean();

		// Extract the checkbox template
		preg_match( '/<script[^>]*id="tmpl-grunion-field-checkbox"[^>]*>(.*?)<\/script>/s', $output, $matches );
		$this->assertNotEmpty( $matches, 'Checkbox template should exist in output' );

		$checkbox_template = $matches[1];

		// Verify the checkbox input has a non-empty value attribute
		// The value should be "Yes" (or its translation), not empty
		preg_match( '/value=[\'"]([^\'"]*)[\'"]/', $checkbox_template, $value_matches );
		$this->assertNotEmpty( $value_matches, 'Checkbox input should have a value attribute' );
		$this->assertNotEmpty( $value_matches[1], 'Checkbox value attribute should not be empty' );
		$this->assertEquals( 'Yes', $value_matches[1], 'Checkbox value should be "Yes"' );
	}
}
