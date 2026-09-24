<?php
/**
 * Tests that the conditional-logic plan gate covers the whole runtime.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block;
use Automattic\Jetpack\Forms\Jetpack_Forms;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers Automattic\Jetpack\Forms\Jetpack_Forms
 */
#[CoversClass( Jetpack_Forms::class )]
class Conditional_Logic_Plan_Gate_Test extends BaseTestCase {

	protected function tear_down() {
		remove_all_filters( 'jetpack_forms_conditional_logic_enabled' );
		parent::tear_down();
		$_POST = array();
	}

	/**
	 * Build a form whose required second field is conditional on the first, with the trigger
	 * value set so the dependent field would be hidden if the feature were on.
	 *
	 * @param bool $available Whether the site's plan includes conditional logic.
	 * @return Contact_Form
	 */
	private function build_form( bool $available = true ): Contact_Form {
		if ( ! $available ) {
			add_filter( 'jetpack_forms_conditional_logic_enabled', '__return_false' );
		}

		$form = new Contact_Form( array( 'id' => 'cf-plan-gate-test' ) );

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
					'groups'          => array(
						array(
							'logicalOperator' => 'all',
							'rules'           => array(
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
	 * Self-hosted sites resolve through the Jetpack plan data, where every plan includes it.
	 */
	public function test_a_jetpack_free_plan_includes_the_feature() {
		$this->assertTrue( Jetpack_Forms::is_conditional_logic_enabled() );
	}

	/**
	 * @dataProvider provide_availability
	 * @param string $filter The filter callback forcing availability.
	 * @param bool   $expected Whether the editor should offer the builder.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_availability' )]
	public function test_the_editor_feature_map_matches_the_runtime( $filter, $expected ) {
		add_filter( 'jetpack_forms_conditional_logic_enabled', $filter );

		$features = Contact_Form_Block::register_feature( array() );

		$this->assertSame( $expected, $features[ Jetpack_Forms::CONDITIONAL_LOGIC_FEATURE ] );
	}

	/**
	 * @return array
	 */
	public static function provide_availability() {
		return array(
			'available'   => array( '__return_true', true ),
			'unavailable' => array( '__return_false', false ),
		);
	}

	public function test_no_front_end_context_is_emitted_when_disabled() {
		$form = $this->build_form( false );

		$this->assertSame(
			array(),
			$form->get_conditional_logic_context(),
			'A disabled feature must add nothing to the page, even on a form that has conditions.'
		);
	}

	public function test_every_field_resolves_visible_when_disabled() {
		$form = $this->build_form( false );

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
		$form = $this->build_form( false );

		$form->validate();

		$this->assertTrue(
			$form->has_errors(),
			'With the feature off the field is not hidden, so its required rule still applies.'
		);
	}

	public function test_conditions_are_ignored_during_storage_when_disabled() {
		$form = $this->build_form( false );

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

	public function test_the_same_form_hides_the_field_when_available() {
		add_filter( 'jetpack_forms_conditional_logic_enabled', '__return_true' );

		$form = $this->build_form();

		$this->assertFalse(
			$form->get_resolved_field_visibility()['dependent'],
			'Availability is the only difference between this and the disabled case.'
		);
	}
}
