<?php
/**
 * Unit tests for Automattic\Jetpack\Forms\ContactForm\Conditional_Logic_Container.
 *
 * Covers the two things a container adds over a field: reading conditions back off the
 * assembled form body, and the containment that follows from them. Both are pure functions of
 * their input, so they are exercised directly rather than through a rendered form.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Conditional_Logic_Container
 */
#[CoversClass( Conditional_Logic_Container::class )]
class Conditional_Logic_Container_Test extends BaseTestCase {

	/**
	 * Turn the feature on. The render filter is gated on it, so with the flag off it returns
	 * every block untouched and the render tests below would pass vacuously.
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
	 * Build a container div carrying the given logic.
	 *
	 * @param string $id       Container id.
	 * @param array  $logic    Logic config.
	 * @param string $children Inner HTML.
	 *
	 * @return string
	 */
	private function container( $id, array $logic, $children = '' ) {
		return '<div class="wp-block-group" data-jp-visibility-root="' . $id . '" data-jp-conditional="1" '
			. "data-jp-container-logic='" . htmlspecialchars( wp_json_encode( $logic, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ), ENT_QUOTES ) . "'>"
			. $children . '</div>';
	}

	/**
	 * A field wrapper as the field renderer emits it.
	 *
	 * @param string $id Field id.
	 *
	 * @return string
	 */
	private function field( $id ) {
		return '<div data-jp-visibility-root="' . $id . '"><input name="' . $id . '" /></div>';
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

	/**
	 * The rendered container is stamped with the same visibility contract a field wrapper
	 * gets, so it hides through the code path that already hides fields.
	 */
	public function test_render_stamps_a_container_that_carries_conditions() {
		$block = array(
			'blockName' => 'core/group',
			'attrs'     => array( 'conditionalLogic' => $this->logic() ),
		);

		$html = Conditional_Logic_Container::add_container_attributes(
			'<div class="wp-block-group"><p>inside</p></div>',
			$block
		);

		$this->assertStringContainsString( 'data-jp-visibility-root="jp-container-', $html );
		$this->assertStringContainsString( 'data-jp-conditional="1"', $html );
		$this->assertStringContainsString( 'data-wp-interactive="jetpack/form"', $html );
		$this->assertStringContainsString(
			'data-wp-class--jetpack-field--conditionally-hidden="state.isFieldHidden"',
			$html
		);
		$this->assertStringContainsString( 'data-jp-container-logic', $html );
		// The inner content must survive untouched.
		$this->assertStringContainsString( '<p>inside</p>', $html );
	}

	/**
	 * `enabled` is derived in the editor from whether any rule exists, so a container the
	 * author merely opened the panel on adds nothing to the page.
	 */
	public function test_render_leaves_a_container_without_conditions_alone() {
		$html = '<div class="wp-block-group"></div>';

		$cases = array(
			'no attrs'        => array( 'blockName' => 'core/group' ),
			'no logic'        => array(
				'blockName' => 'core/group',
				'attrs'     => array(),
			),
			'logic disabled'  => array(
				'blockName' => 'core/group',
				'attrs'     => array(
					'conditionalLogic' => array(
						'enabled' => false,
						'groups'  => array(),
					),
				),
			),
			'logic not array' => array(
				'blockName' => 'core/group',
				'attrs'     => array( 'conditionalLogic' => 'nope' ),
			),
		);

		foreach ( $cases as $label => $block ) {
			$this->assertSame( $html, Conditional_Logic_Container::add_container_attributes( $html, $block ), $label );
		}
	}

	/**
	 * Empty content has no element to stamp, so it is returned rather than parsed.
	 */
	public function test_render_tolerates_empty_content() {
		$block = array(
			'blockName' => 'core/group',
			'attrs'     => array( 'conditionalLogic' => $this->logic() ),
		);

		$this->assertSame( '', Conditional_Logic_Container::add_container_attributes( '', $block ) );
		$this->assertSame( '   ', Conditional_Logic_Container::add_container_attributes( '   ', $block ) );
	}

	/**
	 * Each container gets an id of its own, or two on a page would share a visibility entry.
	 */
	public function test_render_gives_each_container_a_distinct_id() {
		$block = array(
			'blockName' => 'core/group',
			'attrs'     => array( 'conditionalLogic' => $this->logic() ),
		);
		$html  = '<div class="wp-block-group"></div>';

		$first  = Conditional_Logic_Container::add_container_attributes( $html, $block );
		$second = Conditional_Logic_Container::add_container_attributes( $html, $block );

		$this->assertNotSame( $first, $second );
	}

	/**
	 * A container rendered and then harvested round-trips its conditions, which is the whole
	 * path the runtime depends on.
	 */
	public function test_render_then_harvest_round_trips() {
		$logic = $this->logic();
		$html  = Conditional_Logic_Container::add_container_attributes(
			'<div class="wp-block-group">' . $this->field( 'secret' ) . '</div>',
			array(
				'blockName' => 'core/group',
				'attrs'     => array( 'conditionalLogic' => $logic ),
			)
		);

		$result = Conditional_Logic_Container::harvest( $html );

		$this->assertCount( 1, $result['logic'] );
		$this->assertSame( $logic, reset( $result['logic'] ) );
		$this->assertSame( array( 'secret' ), reset( $result['contains'] ) );
	}

	/**
	 * A body with no containers is returned untouched, and cheaply.
	 */
	public function test_harvest_ignores_a_body_without_containers() {
		$body   = '<div class="wp-block-group">' . $this->field( 'name' ) . '</div>';
		$result = Conditional_Logic_Container::harvest( $body );

		$this->assertSame( array(), $result['logic'] );
		$this->assertSame( array(), $result['contains'] );
		$this->assertSame( $body, $result['body'] );
	}

	/**
	 * The logic comes back keyed by container id, and the attribute carrying it is removed:
	 * the form emits the whole map for the interactivity store, so leaving it on the element
	 * would ship the same JSON twice.
	 */
	public function test_harvest_reads_logic_and_strips_the_attribute() {
		$logic = $this->logic();
		$body  = $this->container( 'jp-container-1', $logic, $this->field( 'secret' ) );

		$result = Conditional_Logic_Container::harvest( $body );

		$this->assertSame( array( 'jp-container-1' => $logic ), $result['logic'] );
		$this->assertStringNotContainsString( 'data-jp-container-logic', $result['body'] );
		// The rest of the visibility contract has to survive, or nothing hides.
		$this->assertStringContainsString( 'data-jp-visibility-root="jp-container-1"', $result['body'] );
	}

	/**
	 * Fields inside the container are attributed to it; fields beside it are not.
	 */
	public function test_harvest_records_containment() {
		$body = $this->field( 'name' )
			. $this->container( 'jp-container-1', $this->logic(), $this->field( 'secret' ) . $this->field( 'extra' ) )
			. $this->field( 'after' );

		$result = Conditional_Logic_Container::harvest( $body );

		$this->assertSame( array( 'secret', 'extra' ), $result['contains']['jp-container-1'] );
	}

	/**
	 * A field nested inside plain markup within the container still belongs to it, and a
	 * sibling that merely follows the container's closing tag does not. This is the case the
	 * depth tracking exists for: getting it wrong silently drops a visible field from
	 * validation, or holds the visitor to a hidden one.
	 */
	public function test_harvest_containment_respects_nesting_depth() {
		$inner = '<div class="wp-block-columns"><div class="wp-block-column">' . $this->field( 'deep' ) . '</div></div>';
		$body  = $this->container( 'jp-container-1', $this->logic(), $inner ) . $this->field( 'sibling' );

		$result = Conditional_Logic_Container::harvest( $body );

		$this->assertSame( array( 'deep' ), $result['contains']['jp-container-1'] );
		$this->assertNotContains( 'sibling', $result['contains']['jp-container-1'] );
	}

	/**
	 * A field inside two containers is governed by both, so either one hiding hides it.
	 */
	public function test_harvest_attributes_a_field_to_every_enclosing_container() {
		$inner = $this->container( 'jp-container-2', $this->logic( 'other' ), $this->field( 'secret' ) );
		$body  = $this->container( 'jp-container-1', $this->logic(), $inner );

		$result = Conditional_Logic_Container::harvest( $body );

		$this->assertSame( array( 'secret' ), $result['contains']['jp-container-1'] );
		$this->assertSame( array( 'secret' ), $result['contains']['jp-container-2'] );
	}

	/**
	 * Containment hides the fields inside a hidden container.
	 */
	public function test_apply_containment_hides_enclosed_fields() {
		$visibility = array(
			'jp-container-1' => false,
			'secret'         => true,
			'other'          => true,
		);

		$result = Conditional_Logic_Container::apply_containment(
			$visibility,
			array( 'jp-container-1' => array( 'secret' ) )
		);

		$this->assertFalse( $result['secret'] );
		$this->assertTrue( $result['other'], 'A field outside the container is untouched.' );
	}

	/**
	 * A visible container changes nothing — in particular it does not re-show a field its own
	 * rules hid, which would let a container override a field's conditions.
	 */
	public function test_apply_containment_leaves_a_visible_container_alone() {
		$visibility = array(
			'jp-container-1' => true,
			'secret'         => false,
		);

		$result = Conditional_Logic_Container::apply_containment(
			$visibility,
			array( 'jp-container-1' => array( 'secret' ) )
		);

		$this->assertFalse( $result['secret'] );
	}
}
