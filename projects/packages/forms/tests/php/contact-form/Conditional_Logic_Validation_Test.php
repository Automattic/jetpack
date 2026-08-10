<?php
/**
 * Integration tests for conditional-logic enforcement during form validation.
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
class Conditional_Logic_Validation_Test extends BaseTestCase {

	protected function set_up() {
		parent::set_up();
		// Conditional logic is behind a jetpack-feature-flags flag; these cover the
		// behaviour with the feature switched on.
		add_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );
	}

	protected function tear_down() {
		remove_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );
		parent::tear_down();
		unset( $_POST );
	}

	/**
	 * Build a form whose second field is required and conditional on the first.
	 *
	 * @param string $trigger_value   Value submitted for the trigger field.
	 * @param string $dependent_value Value submitted for the dependent field.
	 *
	 * @return Contact_Form
	 */
	private function build_form( $trigger_value, $dependent_value ): Contact_Form {
		$form = new Contact_Form( array( 'id' => 'cf-validation-test' ) );

		$trigger = new Contact_Form_Field(
			array(
				'id'    => 'trigger',
				'type'  => 'text',
				'label' => 'Trigger',
			),
			'',
			$form
		);

		$dependent = new Contact_Form_Field(
			array(
				'id'               => 'dependent',
				'type'             => 'text',
				'label'            => 'Dependent',
				// Contact_Form_Field normalizes this attribute: only the strings '1' and 'true'
				// count as required, matching what the shortcode emits.
				'required'         => '1',
				'conditionallogic' => array(
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
				),
			),
			'',
			$form
		);

		// Contact_Form_Field::validate() reads $_POST, so the submitted values have to live
		// there for this to exercise the real validation path.
		$_POST['trigger']   = $trigger_value;
		$_POST['dependent'] = $dependent_value;

		$trigger->value   = $trigger_value;
		$dependent->value = $dependent_value;

		$form->fields = array(
			'trigger'   => $trigger,
			'dependent' => $dependent,
		);

		return $form;
	}

	/**
	 * Regression: before conditional logic reached the validation loop, a required field
	 * hidden by its own rule was still validated, so submitting blocked on an error about a
	 * field the visitor could neither see nor fill.
	 */
	public function test_hidden_required_field_does_not_block_submission() {
		// Trigger is not "Other", so the required dependent field is hidden.
		$form = $this->build_form( 'Something else', '' );

		$form->validate();

		$this->assertFalse(
			$form->has_errors(),
			'A required field hidden by conditional logic must not produce a validation error.'
		);
	}

	public function test_visible_required_field_still_blocks_submission() {
		// Trigger matches, so the dependent field is shown and its requirement stands.
		$form = $this->build_form( 'Other', '' );

		$form->validate();

		$this->assertTrue(
			$form->has_errors(),
			'A visible required field must still be enforced.'
		);
	}

	public function test_visible_required_field_with_a_value_passes() {
		$form = $this->build_form( 'Other', 'an answer' );

		$form->validate();

		$this->assertFalse( $form->has_errors() );
	}

	/**
	 * The resolver is shared between validation and storage, so it must report on every field.
	 */
	public function test_resolved_visibility_covers_every_field() {
		$form = $this->build_form( 'Something else', '' );

		$visibility = $form->get_resolved_field_visibility();

		$this->assertSame(
			array( 'trigger', 'dependent' ),
			array_keys( $visibility )
		);
		$this->assertTrue( $visibility['trigger'] );
		$this->assertFalse( $visibility['dependent'] );
	}

	public function test_conditional_logic_context_is_empty_without_conditions() {
		$form  = new Contact_Form( array( 'id' => 'cf-plain' ) );
		$field = new Contact_Form_Field(
			array(
				'id'   => 'plain',
				'type' => 'text',
			),
			'',
			$form
		);

		$form->fields = array( 'plain' => $field );

		$this->assertSame(
			array(),
			$form->get_conditional_logic_context(),
			'A form with no conditions must not add anything to the page.'
		);
	}

	/**
	 * Types are emitted for every field, not only the ones carrying logic: any field can be
	 * the subject of a rule, and the evaluator ignores rules whose subject it cannot type.
	 */
	public function test_conditional_logic_context_types_cover_every_field() {
		$form = $this->build_form( 'Other', '' );

		$context = $form->get_conditional_logic_context();

		$this->assertArrayHasKey( 'types', $context );
		$this->assertArrayHasKey( 'logic', $context );
		$this->assertSame(
			array( 'trigger', 'dependent' ),
			array_keys( $context['types'] ),
			'Every field needs a type so it can be referenced by a rule.'
		);
		$this->assertSame(
			array( 'dependent' ),
			array_keys( $context['logic'] ),
			'Only fields that carry conditions need their logic emitted.'
		);
	}
}
