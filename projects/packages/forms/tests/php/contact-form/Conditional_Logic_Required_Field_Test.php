<?php
/**
 * A required field hidden by conditional logic must never block a submission.
 *
 * These drive the real shortcode parse rather than building a Contact_Form by hand, because
 * the defer decision lives inside Contact_Form::parse_contact_field(). A test that restates
 * that decision asserts against its own copy of the rule and keeps passing when the shipping
 * one changes -- which is how the missing legacy-path validation got through review.
 *
 * Fields are validated twice on a real submission: once as the shortcode is parsed, before
 * the form knows what other fields exist, and again by Contact_Form::validate() once it does.
 * A conditional field is skipped by the first pass, so something must run the second, on
 * every submission path.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form
 */
#[CoversClass( Contact_Form::class )]
class Conditional_Logic_Required_Field_Test extends BaseTestCase {

	protected function set_up() {
		parent::set_up();
		add_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );

		// Registered, never removed. The shortcode table is global and other suites register
		// it once per class, so tearing it down here would leave them parsing nothing.
		if ( ! shortcode_exists( 'contact-field' ) ) {
			Contact_Form_Plugin::init()->add_shortcode();
		}
	}

	protected function tear_down() {
		remove_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );
		Contact_Form::reset_seen_refs();
		unset( $_POST );
		parent::tear_down();
	}

	/**
	 * Parse a form whose required second field is conditional on the first.
	 *
	 * Goes through do_shortcode(), so parse_contact_field() runs for real and decides for
	 * itself whether to defer the dependent field's validation.
	 *
	 * @param string $trigger_value   Submitted value for the trigger field.
	 * @param string $dependent_value Submitted value for the dependent field.
	 *
	 * @return Contact_Form
	 */
	private function parse_form( $trigger_value, $dependent_value ): Contact_Form {
		$_POST['trigger']   = $trigger_value;
		$_POST['dependent'] = $dependent_value;

		$logic = array(
			'enabled'         => true,
			'action'          => 'show',
			'logicalOperator' => 'all',
			'controls'        => array(
				'fieldValue' => array(
					'rules' => array(
						array(
							'field'    => 'trigger',
							'operator' => 'is',
							'value'    => 'Other',
						),
					),
				),
			),
		);

		// Serialized exactly as block_attributes_to_shortcode_attributes() does, so this pins
		// the real wire format: quotes as entities, and brackets too, since WordPress's
		// shortcode attribute pattern would otherwise cut the value at the rules array.
		$attribute = str_replace(
			array( '[', ']' ),
			array( '&#91;', '&#93;' ),
			esc_attr( (string) wp_json_encode( $logic, JSON_UNESCAPED_SLASHES | JSON_HEX_AMP | JSON_HEX_TAG ) )
		);

		$shortcode = '[contact-form id="cl-required" submit_button_text="Submit"]'
			. '[contact-field id="trigger" type="text" label="Trigger"/]'
			. '[contact-field id="dependent" type="text" label="Dependent" required="1"'
			. ' conditionallogic="' . $attribute . '"/]'
			. '[/contact-form]';

		do_shortcode( $shortcode );

		return Contact_Form::$last;
	}

	/**
	 * The parse pass must leave the conditional field alone.
	 *
	 * If it records an error here, no later pass can clear it and the visitor is stuck on a
	 * field they cannot see.
	 */
	public function test_the_parse_pass_defers_a_conditional_field() {
		$form = $this->parse_form( 'Something else', '' );

		$this->assertFalse(
			$form->has_errors(),
			'Parsing must not validate a conditional field, whose subject may not exist yet.'
		);
	}

	/**
	 * The bad state: the visitor cannot see the field, cannot fill it, and submitting does
	 * nothing because the form reports an error against it.
	 */
	public function test_hidden_required_field_does_not_block_submission() {
		$form = $this->parse_form( 'Something else', '' );
		$form->validate();

		$this->assertFalse(
			$form->has_errors(),
			'A required field hidden by conditional logic must not put the form in an error state.'
		);
	}

	public function test_visible_required_field_still_blocks_submission() {
		$form = $this->parse_form( 'Other', '' );
		$form->validate();

		$this->assertTrue(
			$form->has_errors(),
			'Once the condition is met the field is shown, so its required rule applies again.'
		);
	}

	public function test_visible_required_field_with_an_answer_passes() {
		$form = $this->parse_form( 'Other', 'an answer' );
		$form->validate();

		$this->assertFalse( $form->has_errors() );
	}

	/**
	 * Parsing alone is not enough to catch an invalid conditional field.
	 *
	 * This is the shape of the legacy (non-JWT) submission path, which used to go straight
	 * from parsing to storing. Deferring the field's validation is only safe because
	 * something runs validate() afterwards; if a submission path ever skips it, an empty
	 * required field is accepted and stored.
	 */
	public function test_a_visible_required_field_is_only_caught_once_validate_runs() {
		$form = $this->parse_form( 'Other', '' );

		$this->assertFalse(
			$form->has_errors(),
			'Deferred at parse time, so nothing is recorded yet.'
		);

		$form->validate();

		$this->assertTrue(
			$form->has_errors(),
			'Every submission path must call validate(), or this field is stored unchecked.'
		);
	}
}
