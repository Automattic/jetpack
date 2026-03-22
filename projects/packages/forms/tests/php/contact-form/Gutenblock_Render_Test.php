<?php
/**
 * Unit Tests for Contact_Form_Plugin gutenblock_render_* methods.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for gutenblock render methods in Contact_Form_Plugin.
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
 */
#[CoversClass( Contact_Form_Plugin::class )]
class Gutenblock_Render_Test extends BaseTestCase {

	/**
	 * Helper to wrap button HTML in the navigation wrapper structure.
	 *
	 * @param string $inner_html The button HTML to wrap.
	 * @return string The wrapped HTML.
	 */
	private static function wrap_navigation_html( $inner_html ) {
		return '<div class="wp-block-jetpack-form-step-navigation"><div class="wp-block-jetpack-form-step-navigation__wrapper">'
			. $inner_html
			. '</div></div>';
	}

	/**
	 * Test navigation button processing with class-based identification (core/button).
	 *
	 * @dataProvider data_provider_navigation_button_class_identification
	 */
	#[DataProvider( 'data_provider_navigation_button_class_identification' )]
	public function test_navigation_button_class_identification( $input_html, $expected_attributes, $description ) {
		$wrapped_html = self::wrap_navigation_html( $input_html );
		$result       = Contact_Form_Plugin::gutenblock_render_form_step_navigation( array(), $wrapped_html );

		foreach ( $expected_attributes as $attr => $value ) {
			if ( $value === null ) {
				$this->assertStringNotContainsString( $attr, $result, "$description: should NOT contain $attr" );
			} else {
				$this->assertStringContainsString( "$attr=\"$value\"", $result, "$description: should contain $attr=\"$value\"" );
			}
		}
	}

	/**
	 * Data provider for navigation button class identification tests.
	 */
	public static function data_provider_navigation_button_class_identification() {
		return array(
			'previous button by class'       => array(
				'<button class="form-button-previous">Previous</button>',
				array(
					'data-wp-on--click'        => 'actions.previousStep',
					'data-wp-class--is-hidden' => 'state.isFirstStep',
				),
				'Previous button identified by form-button-previous class',
			),
			'next button by class'           => array(
				'<button class="form-button-next">Next</button>',
				array(
					'data-wp-on--click'        => 'actions.nextStep',
					'data-wp-class--is-hidden' => 'state.isLastStep',
				),
				'Next button identified by form-button-next class',
			),
			'submit button by class'         => array(
				'<button class="form-button-submit">Submit</button>',
				array(
					'data-wp-class--is-hidden'     => 'state.isNotLastStep',
					'data-wp-class--is-submitting' => 'state.isSubmitting',
					'data-wp-bind--aria-disabled'  => 'state.isAriaDisabled',
					'data-wp-bind--disabled'       => 'state.isAriaDisabled',
				),
				'Submit button identified by form-button-submit class',
			),
			'previous button by legacy attr' => array(
				'<button data-id-attr="previous-step">Previous</button>',
				array(
					'data-wp-on--click'        => 'actions.previousStep',
					'data-wp-class--is-hidden' => 'state.isFirstStep',
				),
				'Previous button identified by legacy data-id-attr',
			),
			'next button by legacy attr'     => array(
				'<button data-id-attr="next-step">Next</button>',
				array(
					'data-wp-on--click'        => 'actions.nextStep',
					'data-wp-class--is-hidden' => 'state.isLastStep',
				),
				'Next button identified by legacy data-id-attr',
			),
			'submit button by legacy attr'   => array(
				'<button data-id-attr="submit-step">Submit</button>',
				array(
					'data-wp-class--is-hidden'     => 'state.isNotLastStep',
					'data-wp-class--is-submitting' => 'state.isSubmitting',
					'data-wp-bind--aria-disabled'  => 'state.isAriaDisabled',
					'data-wp-bind--disabled'       => 'state.isAriaDisabled',
				),
				'Submit button identified by legacy data-id-attr',
			),
			'regular button not affected'    => array(
				'<button class="some-other-class">Click me</button>',
				array(
					'data-wp-on--click'        => null,
					'data-wp-class--is-hidden' => null,
				),
				'Regular button should not get navigation attributes',
			),
		);
	}

	/**
	 * Test that a submit wrapper div with an inner button gets is-submitting on the button.
	 */
	public function test_submit_wrapper_with_inner_button_gets_is_submitting() {
		$input_html = self::wrap_navigation_html(
			'<div class="form-button-submit"><button>Submit</button></div>'
		);
		$result     = Contact_Form_Plugin::gutenblock_render_form_step_navigation( array(), $input_html );

		$this->assertStringContainsString( 'data-wp-class--is-submitting="state.isSubmitting"', $result, 'Inner button should get is-submitting attribute' );
		$this->assertStringContainsString( 'data-wp-bind--aria-disabled="state.isAriaDisabled"', $result, 'Inner button should get aria-disabled binding' );
		$this->assertStringContainsString( 'data-wp-bind--disabled="state.isAriaDisabled"', $result, 'Inner button should get disabled binding' );
	}

	/**
	 * Test that elements after a submit wrapper without any button are still processed.
	 *
	 * Without the bookmark fix, next_tag('button') failing inside the submit wrapper
	 * would advance the processor past all remaining HTML, causing subsequent elements
	 * to be skipped entirely.
	 */
	public function test_submit_wrapper_without_button_does_not_skip_subsequent_elements() {
		$input_html = self::wrap_navigation_html(
			'<div class="form-button-submit"><span>Submit</span></div>'
			. '<p class="extra-element">Extra content</p>'
		);
		$result     = Contact_Form_Plugin::gutenblock_render_form_step_navigation( array(), $input_html );

		$this->assertStringContainsString( 'is-submit', $result, 'Submit wrapper should get is-submit class' );
		$this->assertStringContainsString( '<p class="extra-element">', $result, 'Elements after submit wrapper should be preserved in output' );
	}

	/**
	 * Test that all three navigation buttons get their correct attributes when used together.
	 */
	public function test_all_navigation_buttons_get_correct_attributes() {
		$input_html = self::wrap_navigation_html(
			'<button class="form-button-previous">Previous</button>'
			. '<button class="form-button-next">Next</button>'
			. '<button class="form-button-submit">Submit</button>'
		);
		$result     = Contact_Form_Plugin::gutenblock_render_form_step_navigation( array(), $input_html );

		$this->assertStringContainsString( 'data-wp-class--is-submitting="state.isSubmitting"', $result, 'Submit button should get is-submitting attribute' );
		$this->assertStringContainsString( 'data-wp-on--click="actions.previousStep"', $result, 'Previous button should get its click handler' );
		$this->assertStringContainsString( 'data-wp-on--click="actions.nextStep"', $result, 'Next button should get its click handler' );
	}
}
