<?php
/**
 * Integration tests for conditional-logic enforcement during feedback creation.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Conditional_Logic_Test extends BaseTestCase {

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
	 * Submit the form the way a visitor does.
	 *
	 * The answers go into $_POST, because that is where Contact_Form resolves visibility
	 * from. Handing Feedback a $post_data array that $_POST does not agree with would test a
	 * state no submission can produce -- and storage reading a different value source than
	 * validation is the bug this file now guards.
	 *
	 * @param array        $post_data Submitted values, keyed by field id.
	 * @param Contact_Form $form      The form.
	 * @return Feedback
	 */
	private function submit( $post_data, $form ) {
		$_POST = array_merge( $_POST ?? array(), $post_data );

		return Feedback::from_submission( $post_data, $form );
	}

	/**
	 * Build a Contact_Form with a trigger text field and a dependent text field
	 * whose visibility depends on the trigger.
	 *
	 * @param array $dependent_logic Conditional logic config attached to the dependent field.
	 *
	 * @return Contact_Form
	 */
	private function build_form_with_dependent_field( array $dependent_logic ): Contact_Form {
		$form = new Contact_Form( array( 'id' => 'cf-test' ) );

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
				'conditionallogic' => $dependent_logic,
			),
			'',
			$form
		);

		$form->fields = array(
			'trigger'   => $trigger,
			'dependent' => $dependent,
		);

		return $form;
	}

	/**
	 * Extract the feedback-field keys that reference a given original field id.
	 *
	 * @param Feedback $feedback     The feedback instance.
	 * @param string   $original_id  The field id set on the original Contact_Form_Field.
	 *
	 * @return Feedback_Field|null
	 */
	private function find_feedback_field( Feedback $feedback, string $original_id ) {
		return $feedback->get_field_by_form_field_id( $original_id );
	}

	public function test_hidden_dependent_field_is_not_persisted() {
		$form = $this->build_form_with_dependent_field(
			array(
				'enabled'         => true,
				'action'          => 'show',
				'logicalOperator' => 'any',
				'controls'        => array(
					'fieldValue' => array(
						'rules' => array(
							array(
								'field'    => 'trigger',
								'operator' => 'is',
								'value'    => 'yes',
							),
						),
					),
				),
			)
		);

		$post_data = array(
			'trigger'   => 'no',
			'dependent' => 'should-not-be-stored',
		);

		$feedback = $this->submit( $post_data, $form );

		$this->assertNotNull(
			$this->find_feedback_field( $feedback, 'trigger' ),
			'Trigger field should always be present.'
		);
		$this->assertNull(
			$this->find_feedback_field( $feedback, 'dependent' ),
			'Dependent field should be stripped when conditional logic says it is hidden.'
		);
	}

	public function test_visible_dependent_field_is_persisted() {
		$form = $this->build_form_with_dependent_field(
			array(
				'enabled'         => true,
				'action'          => 'show',
				'logicalOperator' => 'any',
				'controls'        => array(
					'fieldValue' => array(
						'rules' => array(
							array(
								'field'    => 'trigger',
								'operator' => 'is',
								'value'    => 'yes',
							),
						),
					),
				),
			)
		);

		$post_data = array(
			'trigger'   => 'yes',
			'dependent' => 'kept',
		);

		$feedback = $this->submit( $post_data, $form );

		$dependent_field = $this->find_feedback_field( $feedback, 'dependent' );
		$this->assertNotNull( $dependent_field, 'Dependent field should persist when rule matches.' );
		$this->assertSame( 'kept', $dependent_field->get_value() );
	}

	public function test_disabled_logic_never_strips_fields() {
		$form = $this->build_form_with_dependent_field(
			array(
				'enabled'         => false,
				'action'          => 'show',
				'logicalOperator' => 'any',
				'controls'        => array(
					'fieldValue' => array(
						'rules' => array(
							array(
								'field'    => 'trigger',
								'operator' => 'is',
								'value'    => 'yes',
							),
						),
					),
				),
			)
		);

		$post_data = array(
			'trigger'   => 'no',
			'dependent' => 'still-kept',
		);

		$feedback = $this->submit( $post_data, $form );

		$dependent_field = $this->find_feedback_field( $feedback, 'dependent' );
		$this->assertNotNull( $dependent_field, 'Disabled logic must not strip the field.' );
		$this->assertSame( 'still-kept', $dependent_field->get_value() );
	}

	public function test_hide_action_strips_when_rule_matches() {
		$form = $this->build_form_with_dependent_field(
			array(
				'enabled'         => true,
				'action'          => 'hide',
				'logicalOperator' => 'any',
				'controls'        => array(
					'fieldValue' => array(
						'rules' => array(
							array(
								'field'    => 'trigger',
								'operator' => 'is',
								'value'    => 'secret',
							),
						),
					),
				),
			)
		);

		$post_data = array(
			'trigger'   => 'secret',
			'dependent' => 'leak',
		);

		$feedback = $this->submit( $post_data, $form );

		$this->assertNull(
			$this->find_feedback_field( $feedback, 'dependent' ),
			'Hide-action should strip the value when its rule matches.'
		);
	}

	/**
	 * A hidden field's answer must not keep a downstream field alive.
	 *
	 * A -> B -> C: when A stops matching, B hides. B may still carry a value from before the
	 * visitor changed A, and evaluating each field independently would let that stale value
	 * satisfy C's "is not empty" rule, storing an answer justified by one that was discarded.
	 */
	public function test_cascade_strips_the_whole_chain() {
		$form = new Contact_Form( array( 'id' => 'cf-cascade' ) );

		$rule = function ( $field, $operator, $value = '' ) {
			return array(
				'enabled'         => true,
				'action'          => 'show',
				'logicalOperator' => 'all',
				'controls'        => array(
					'fieldValue' => array(
						'rules' => array(
							array(
								'field'    => $field,
								'operator' => $operator,
								'value'    => $value,
							),
						),
					),
				),
			);
		};

		$a = new Contact_Form_Field(
			array(
				'id'    => 'a',
				'type'  => 'text',
				'label' => 'A',
			),
			'',
			$form
		);
		$b = new Contact_Form_Field(
			array(
				'id'               => 'b',
				'type'             => 'text',
				'label'            => 'B',
				'conditionallogic' => $rule( 'a', 'is', 'Other' ),
			),
			'',
			$form
		);
		$c = new Contact_Form_Field(
			array(
				'id'               => 'c',
				'type'             => 'text',
				'label'            => 'C',
				'conditionallogic' => $rule( 'b', 'is_not_empty' ),
			),
			'',
			$form
		);

		$form->fields = array(
			'a' => $a,
			'b' => $b,
			'c' => $c,
		);

		$feedback = $this->submit(
			array(
				'a' => 'Something else',
				'b' => 'stale',
				'c' => 'should-not-be-stored',
			),
			$form
		);

		$this->assertNotNull( $this->find_feedback_field( $feedback, 'a' ), 'A is unconditional.' );
		$this->assertNull( $this->find_feedback_field( $feedback, 'b' ), 'B is hidden by its own rule.' );
		$this->assertNull(
			$this->find_feedback_field( $feedback, 'c' ),
			'C must not survive on the strength of a hidden field value.'
		);
	}

	/**
	 * Storage and validation must agree about a prefilled field the visitor cleared.
	 *
	 * Validation resolves visibility from get_computed_field_value(): POST, then GET, then
	 * the field's default. Storage used to resolve again from POST alone. A trigger prefilled
	 * through a query argument and then cleared by the visitor posts nothing, so the two read
	 * opposite values -- the dependent field was validated as visible and required, and then
	 * had its answer dropped as hidden.
	 */
	public function test_storage_agrees_with_validation_about_a_cleared_prefilled_trigger() {
		$form = $this->build_form_with_dependent_field(
			array(
				'enabled'         => true,
				'action'          => 'show',
				'logicalOperator' => 'all',
				'controls'        => array(
					'fieldValue' => array(
						'rules' => array(
							array(
								'field'    => 'trigger',
								'operator' => 'is',
								'value'    => 'yes',
							),
						),
					),
				),
			)
		);

		// Prefilled in the link, cleared by the visitor: present in GET, absent from POST.
		$_GET['trigger'] = 'yes';
		$_POST           = array( 'dependent' => 'an answer' );

		$feedback = Feedback::from_submission( array( 'dependent' => 'an answer' ), $form );

		$visibility = $form->get_resolved_field_visibility();
		$stored     = null !== $this->find_feedback_field( $feedback, 'dependent' );

		$this->assertSame(
			$visibility['dependent'] ?? true,
			$stored,
			'Storage must keep exactly the fields the form resolved as visible.'
		);

		unset( $_GET['trigger'] );
	}
}
