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
	 * A group can hold focusable content that is not a field -- a link, a button -- and that
	 * content has no wrapper of its own to restore focus from. Without the same watch a field
	 * wrapper carries, focus falls to <body> when the group hides under the visitor.
	 */
	public function test_render_stamps_the_focus_watch_a_field_wrapper_carries() {
		$block = array(
			'blockName' => 'core/group',
			'attrs'     => array( 'conditionalLogic' => $this->logic() ),
		);

		$html = Conditional_Logic_Container::add_container_attributes(
			'<div class="wp-block-group"><a href="/somewhere">a link</a></div>',
			$block
		);

		$this->assertStringContainsString(
			'data-wp-watch--conditional-focus="callbacks.manageConditionalFocus"',
			$html
		);
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
