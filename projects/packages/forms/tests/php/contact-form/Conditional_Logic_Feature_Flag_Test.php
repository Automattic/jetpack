<?php
/**
 * Tests that the conditional-logic feature flag gates the whole runtime.
 *
 * The flag has to cover the editor panel, the front-end context and the submission-time
 * enforcement together. Gating only part of it would let a form hide a field from the
 * visitor while still requiring it on submit, or store a field the visitor never saw.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Forms\Jetpack_Forms;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers Automattic\Jetpack\Forms\Jetpack_Forms
 */
#[CoversClass( Jetpack_Forms::class )]
class Conditional_Logic_Feature_Flag_Test extends BaseTestCase {

	protected function tear_down() {
		remove_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );
		parent::tear_down();
		unset( $_POST );
	}

	/**
	 * Build a form whose required second field is conditional on the first, with the trigger
	 * value set so the dependent field would be hidden if the feature were on.
	 *
	 * @return Contact_Form
	 */
	private function build_form(): Contact_Form {
		$form = new Contact_Form( array( 'id' => 'cf-flag-test' ) );

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

		$_POST['trigger']   = 'Something else';
		$_POST['dependent'] = '';

		$trigger->value   = 'Something else';
		$dependent->value = '';

		$form->fields = array(
			'trigger'   => $trigger,
			'dependent' => $dependent,
		);

		return $form;
	}

	/**
	 * The flag is registered with the shared package, so it is discoverable through
	 * `Feature_Flags::all()` and carries the metadata that says who owns it.
	 */
	public function test_the_flag_is_registered_with_the_feature_flags_package() {
		Jetpack_Forms::register_feature_flags();

		$definition = Feature_Flags::get( Jetpack_Forms::CONDITIONAL_LOGIC_FLAG );

		$this->assertNotNull( $definition, 'The flag must be registered, not merely filtered.' );
		$this->assertFalse( $definition['default'], 'It ships disabled.' );
		$this->assertSame( 'jetpack-forms', $definition['owner'] );
		$this->assertNotSame( '', $definition['description'] );
	}

	/**
	 * The generic package filter controls it too, not just the per-flag variant, so a policy
	 * layer can switch many flags from one place.
	 */
	public function test_the_generic_package_filter_turns_the_feature_on() {
		Jetpack_Forms::register_feature_flags();

		$callback = static function ( $enabled, $flag_name ) {
			return Jetpack_Forms::CONDITIONAL_LOGIC_FLAG === $flag_name ? true : $enabled;
		};
		add_filter( 'jetpack_feature_flag_enabled', $callback, 10, 2 );

		$this->assertTrue( Jetpack_Forms::is_conditional_logic_enabled() );

		remove_filter( 'jetpack_feature_flag_enabled', $callback, 10 );
	}

	public function test_the_feature_is_off_by_default() {
		$this->assertFalse(
			Jetpack_Forms::is_conditional_logic_enabled(),
			'Conditional logic must stay off until the flag is explicitly enabled.'
		);
	}

	public function test_the_filter_turns_the_feature_on() {
		add_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );

		$this->assertTrue( Jetpack_Forms::is_conditional_logic_enabled() );
	}

	public function test_no_front_end_context_is_emitted_when_disabled() {
		$form = $this->build_form();

		$this->assertSame(
			array(),
			$form->get_conditional_logic_context(),
			'A disabled feature must add nothing to the page, even on a form that has conditions.'
		);
	}

	public function test_every_field_resolves_visible_when_disabled() {
		$form = $this->build_form();

		$this->assertSame(
			array(),
			$form->get_resolved_field_visibility(),
			'With the feature off no field is hidden, so the map is empty and callers treat every field as visible.'
		);
	}

	/**
	 * The mirror of Conditional_Logic_Validation_Test: with the feature off the condition is
	 * ignored entirely, so the required field is enforced like any other.
	 */
	public function test_conditions_are_ignored_during_validation_when_disabled() {
		$form = $this->build_form();

		$form->validate();

		$this->assertTrue(
			$form->has_errors(),
			'With the feature off the field is not hidden, so its required rule still applies.'
		);
	}

	public function test_conditions_are_ignored_during_storage_when_disabled() {
		$form = $this->build_form();

		$feedback = Feedback::from_submission(
			array(
				'trigger'   => 'Something else',
				'dependent' => 'stored anyway',
			),
			$form
		);

		$field = $feedback->get_field_by_form_field_id( 'dependent' );

		$this->assertNotNull(
			$field,
			'With the feature off nothing is stripped from the response.'
		);
		$this->assertSame( 'stored anyway', $field->get_value() );
	}

	public function test_the_same_form_hides_the_field_once_the_flag_is_on() {
		add_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );

		$form = $this->build_form();

		$this->assertFalse(
			$form->get_resolved_field_visibility()['dependent'],
			'The flag is the only difference between this and the disabled case.'
		);
	}
}
