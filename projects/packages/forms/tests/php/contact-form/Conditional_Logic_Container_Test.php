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
use PHPUnit\Framework\TestCase;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Conditional_Logic_Container
 */
#[CoversClass( Conditional_Logic_Container::class )]
class Conditional_Logic_Container_Test extends TestCase {

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
