<?php
/**
 * Integration tests for conditional logic on container blocks.
 *
 * Separate from Conditional_Logic_Container_Test, which exercises the container helpers in
 * isolation. These build a real Contact_Form and check that a container's conditions survive
 * the whole path -- harvested off the body in the constructor, emitted in the context the
 * interactivity store reads, and honoured when visibility is resolved.
 *
 * The class under test is Contact_Form rather than the container helper, which is what makes
 * the Contact_Form lines these exercise count as covered.
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
class Conditional_Logic_Container_Integration_Test extends BaseTestCase {

	/**
	 * Turn the feature on. Every path below is gated on it.
	 */
	protected function set_up() {
		parent::set_up();
		add_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );
	}

	/**
	 * @return void
	 */
	protected function tear_down() {
		remove_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );
		unset( $_POST );
		parent::tear_down();
	}

	/**
	 * A minimal enabled logic config.
	 *
	 * @param string $field Subject field id.
	 * @param string $value Value to compare against.
	 *
	 * @return array
	 */
	/**
	 * A rule value is author-supplied text. The container carries it into the rendered markup
	 * as an HTML attribute, and Contact_Form then runs the whole body through do_shortcode()
	 * to find its fields -- so a value that merely looks like a shortcode is expanded inside
	 * the attribute, shattering the tag it sits in.
	 *
	 * Built through add_container_attributes() rather than hand-written markup, because the
	 * encoding under test is the one that function applies.
	 */
	public function test_a_shortcode_in_a_rule_value_does_not_break_the_container() {
		$logic = $this->logic( 'trigger', '[contact-field id="injected" type="text" label="Injected" /]' );

		$stamped = Conditional_Logic_Container::add_container_attributes(
			'<div class="wp-block-group">[contact-field id="secret" type="text" label="Secret" /]</div>',
			array(
				'blockName' => 'core/group',
				'attrs'     => array( 'conditionalLogic' => $logic ),
			)
		);

		$_POST['trigger'] = '';

		Contact_Form_Plugin::$using_contact_form_field = true;

		$form = new Contact_Form(
			array( 'id' => 'cl-shortcode' ),
			'[contact-field id="trigger" type="text" label="Trigger" /]' . $stamped
		);

		Contact_Form_Plugin::$using_contact_form_field = false;

		// The value was text, not markup: it must not have become a field.
		$this->assertArrayNotHasKey( 'injected', $form->fields );
		$this->assertSame( array( 'trigger', 'secret' ), array_keys( $form->fields ) );

		// And the container survived intact, so its conditions were still harvested.
		$context = $form->get_conditional_logic_context();
		$this->assertNotEmpty( $context['logic'], 'The container logic was not harvested.' );

		$container_id = array_keys( $context['logic'] )[0];
		$this->assertSame( array( 'secret' ), $context['contains'][ $container_id ] );

		// The rule value round-trips to exactly what the author typed.
		$rule = $context['logic'][ $container_id ]['groups'][0]['rules'][0];
		$this->assertSame(
			'[contact-field id="injected" type="text" label="Injected" /]',
			$rule['value']
		);
	}

	/**
	 * The evaluator blanks a hidden field's value on every pass, so a question that was never
	 * asked cannot satisfy another field's condition. A field hidden only because its
	 * container is hidden has to obey that same rule.
	 *
	 * Otherwise the form keeps a conclusion while discarding its premise: the enclosed answer
	 * is dropped from storage, but the field it unlocked outside the group is validated,
	 * stored and handed to integrations. No forgery is needed to reach it -- enclosed inputs
	 * are display:none rather than disabled, so a value typed while the group was open is
	 * still submitted after it closes.
	 */
	public function test_a_field_hidden_by_its_container_cannot_unlock_a_field_outside_it() {
		$stamped = Conditional_Logic_Container::add_container_attributes(
			'<div class="wp-block-group">[contact-field id="secret" type="text" label="Secret" /]</div>',
			array(
				'blockName' => 'core/group',
				'attrs'     => array( 'conditionalLogic' => $this->logic( 'membership', 'yes' ) ),
			)
		);

		// The group stays hidden, but the enclosed field is submitted anyway.
		$_POST['membership'] = 'no';
		$_POST['secret']     = 'letmein';

		Contact_Form_Plugin::$using_contact_form_field = true;

		$form = new Contact_Form(
			array( 'id' => 'cl-cascade' ),
			'[contact-field id="membership" type="text" label="Membership" /]'
				. $stamped
				. '[contact-field id="downstream" type="text" label="Downstream" required="1" '
				. "conditionallogic='" . str_replace(
					array( '[', ']' ),
					array( '&#91;', '&#93;' ),
					(string) wp_json_encode(
						$this->logic( 'secret', 'letmein' ),
						JSON_UNESCAPED_SLASHES | JSON_HEX_AMP | JSON_HEX_TAG
					)
				) . "' /]"
		);

		Contact_Form_Plugin::$using_contact_form_field = false;

		$visibility = $form->get_resolved_field_visibility();

		// The enclosed field is hidden, as before.
		$this->assertFalse( $visibility['secret'] );
		// And its value must not have unlocked the field outside the group.
		$this->assertFalse(
			$visibility['downstream'],
			'A field hidden only by its container still satisfied another field\'s rule.'
		);
	}

	private function logic( $field = 'name', $value = 'Bob' ) {
		return array(
			'enabled'         => true,
			'action'          => 'show',
			'logicalOperator' => 'any',
			'groups'          => array(
				array(
					'logicalOperator' => 'any',
					'rules'           => array(
						array(
							'type'     => 'fieldValue',
							'field'    => $field,
							'operator' => 'is',
							'value'    => $value,
						),
					),
				),
			),
		);
	}

	/**
	 * Build a real form whose body holds a stamped container around a field.
	 *
	 * Constructed from content rather than by assigning `body` afterwards, because harvesting
	 * happens in the constructor -- the only place the container and the fields inside it both
	 * exist. A test that set `body` later would never reach it.
	 *
	 * @param string $trigger_value Value submitted for the trigger field.
	 *
	 * @return Contact_Form
	 */
	private function form_with_container( $trigger_value = '' ) {
		$container = '<div class="wp-block-group" data-jp-visibility-root="jp-container-1" data-jp-conditional="1" '
			. "data-jp-container-logic='" . htmlspecialchars( wp_json_encode( $this->logic( 'trigger', 'Bob' ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ), ENT_QUOTES ) . "'>"
			. '[contact-field id="secret" type="text" label="Secret" required="1" /]'
			. '</div>';

		$_POST['trigger'] = $trigger_value;

		Contact_Form_Plugin::$using_contact_form_field = true;

		$form = new Contact_Form(
			array( 'id' => 'cl-container' ),
			'[contact-field id="trigger" type="text" label="Trigger" /]' . $container
		);

		Contact_Form_Plugin::$using_contact_form_field = false;

		return $form;
	}

	/**
	 * The container's conditions reach the map the interactivity store reads, and the fields
	 * it encloses are named there too — the browser needs the containment for the same reason
	 * the server does.
	 */
	public function test_container_logic_reaches_the_emitted_context() {
		$form    = $this->form_with_container();
		$context = $form->get_conditional_logic_context();

		$this->assertArrayHasKey( 'jp-container-1', $context['logic'] );
		$this->assertSame( Conditional_Logic::TYPE_CONTAINER, $context['types']['jp-container-1'] );
		$this->assertSame( array( 'secret' ), $context['contains']['jp-container-1'] );
		// Fields are still typed, or rules could not resolve their subjects.
		$this->assertArrayHasKey( 'trigger', $context['types'] );
	}

	/**
	 * The attribute the container carried its conditions in is gone from the rendered body:
	 * the form emits the whole map already, so shipping it twice is waste.
	 */
	public function test_container_logic_attribute_is_stripped_from_the_body() {
		$form = $this->form_with_container();

		$this->assertStringNotContainsString( 'data-jp-container-logic', (string) $form->body );
		$this->assertStringContainsString( 'data-jp-visibility-root="jp-container-1"', (string) $form->body );
	}

	/**
	 * With the condition unmet the container is hidden, and so is the required field inside
	 * it — which is what stops the form refusing to submit on a field nobody was shown.
	 */
	public function test_an_unmet_container_hides_the_field_it_encloses() {
		$visibility = $this->form_with_container( 'Alice' )->get_resolved_field_visibility();

		$this->assertFalse( $visibility['jp-container-1'] );
		$this->assertFalse( $visibility['secret'] );
		$this->assertTrue( $visibility['trigger'] );
	}

	/**
	 * Once the condition is met both come back, so the field is enforced again.
	 */
	public function test_a_met_container_shows_the_field_it_encloses() {
		$visibility = $this->form_with_container( 'Bob' )->get_resolved_field_visibility();

		$this->assertTrue( $visibility['jp-container-1'] );
		$this->assertTrue( $visibility['secret'] );
	}

	/**
	 * The container arrives hidden rather than flashing into view on hydration.
	 */
	public function test_an_unmet_container_ships_hidden() {
		$form      = $this->form_with_container( 'Alice' );
		$processor = new \WP_HTML_Tag_Processor( (string) $form->body );
		$classes   = '';

		while ( $processor->next_tag( array( 'tag_name' => 'DIV' ) ) ) {
			if ( 'jp-container-1' === $processor->get_attribute( 'data-jp-visibility-root' ) ) {
				$classes = (string) $processor->get_attribute( 'class' );
				break;
			}
		}

		$this->assertStringContainsString( 'jetpack-field--conditionally-hidden', $classes );
	}
}
