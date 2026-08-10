<?php
/**
 * Unit tests for Automattic\Jetpack\Forms\ContactForm\Conditional_Logic.
 *
 * Mirrors tests/js/blocks/shared/conditional-logic/evaluate.test.js case for case. The two
 * evaluators must agree: the browser decides what to show, PHP decides what to validate and
 * store, and a disagreement either drops a real answer or accepts a hidden one.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Conditional_Logic
 */
#[CoversClass( Conditional_Logic::class )]
class Conditional_Logic_Test extends TestCase {

	/**
	 * Build a logic config wrapping the given rules.
	 *
	 * @param array $rules     Rule list.
	 * @param array $overrides Top-level overrides (action, logicalOperator, enabled).
	 *
	 * @return array
	 */
	private function logic( array $rules, array $overrides = array() ): array {
		return array_merge(
			array(
				'enabled'         => true,
				'action'          => 'show',
				'logicalOperator' => 'all',
				'controls'        => array( 'fieldValue' => array( 'rules' => $rules ) ),
			),
			$overrides
		);
	}

	/**
	 * Build a single-rule logic config.
	 *
	 * @param string $operator Operator wire string.
	 * @param mixed  $value    Expected value.
	 * @param string $field    Subject field id.
	 *
	 * @return array
	 */
	private function one( $operator, $value = '', $field = 'a' ): array {
		return $this->logic(
			array(
				array(
					'field'    => $field,
					'operator' => $operator,
					'value'    => $value,
				),
			)
		);
	}

	/**
	 * Every shortcode field type and its comparison behavior.
	 *
	 * @return array
	 */
	public static function provide_field_types(): array {
		return array(
			array( 'text', 'string' ),
			array( 'name', 'string' ),
			array( 'email', 'string' ),
			array( 'url', 'string' ),
			array( 'textarea', 'string' ),
			array( 'telephone', 'string' ),
			array( 'phone', 'string' ),
			array( 'select', 'choice' ),
			array( 'radio', 'choice' ),
			array( 'image-select', 'choice' ),
			array( 'checkbox-multiple', 'multichoice' ),
			array( 'number', 'number' ),
			array( 'slider', 'number' ),
			array( 'rating', 'number' ),
			array( 'date', 'date' ),
			array( 'time', 'time' ),
			array( 'checkbox', 'boolean' ),
			array( 'consent', 'boolean' ),
			array( 'hidden', 'hidden' ),
			array( 'file', 'file' ),
		);
	}

	/**
	 * @param string $field_type Shortcode type.
	 * @param string $expected   Expected type key.
	 * @dataProvider provide_field_types
	 */
	#[DataProvider( 'provide_field_types' )]
	public function test_type_key_for_field_type( $field_type, $expected ) {
		$this->assertSame( $expected, Conditional_Logic::type_key_for_field_type( $field_type ) );
	}

	public function test_unknown_field_type_compares_textually() {
		$this->assertSame( 'string', Conditional_Logic::type_key_for_field_type( 'not-a-type' ) );
		$this->assertSame( 'string', Conditional_Logic::type_key_for_field_type( '' ) );
	}

	/**
	 * String operator cases.
	 *
	 * @return array
	 */
	public static function provide_string_operators(): array {
		return array(
			array( 'is', 'yes', 'yes', true ),
			array( 'is', 'yes', 'no', false ),
			array( 'is_not', 'yes', 'no', true ),
			array( 'is_not', 'yes', 'yes', false ),
			array( 'contains', 'blueberry', 'blue', true ),
			array( 'contains', 'blueberry', 'red', false ),
			array( 'does_not_contain', 'blueberry', 'red', true ),
			array( 'does_not_contain', 'blueberry', 'blue', false ),
		);
	}

	/**
	 * @param string $operator Operator.
	 * @param string $actual   Submitted value.
	 * @param string $expected Rule value.
	 * @param bool   $want     Expected visibility.
	 * @dataProvider provide_string_operators
	 */
	#[DataProvider( 'provide_string_operators' )]
	public function test_string_operators( $operator, $actual, $expected, $want ) {
		$this->assertSame(
			$want,
			Conditional_Logic::evaluate(
				$this->one( $operator, $expected ),
				array( 'a' => 'text' ),
				array( 'a' => $actual )
			)
		);
	}

	public function test_empty_operators() {
		$types = array( 'a' => 'text' );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is_empty' ), $types, array( 'a' => '' ) ) );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is_empty' ), $types, array( 'a' => '   ' ) ) );
		$this->assertFalse( Conditional_Logic::evaluate( $this->one( 'is_empty' ), $types, array( 'a' => 'x' ) ) );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is_not_empty' ), $types, array( 'a' => 'x' ) ) );
		$this->assertFalse( Conditional_Logic::evaluate( $this->one( 'is_not_empty' ), $types, array( 'a' => '' ) ) );
	}

	public function test_multichoice_uses_membership_not_substring() {
		$types = array( 'a' => 'checkbox-multiple' );

		// "Blue" must not match an option named "Blueberry".
		$this->assertFalse(
			Conditional_Logic::evaluate( $this->one( 'contains', 'Blue' ), $types, array( 'a' => array( 'Blueberry' ) ) )
		);
		$this->assertTrue(
			Conditional_Logic::evaluate( $this->one( 'contains', 'Blue' ), $types, array( 'a' => array( 'Blue', 'Red' ) ) )
		);
	}

	public function test_multichoice_does_not_contain() {
		$types = array( 'a' => 'checkbox-multiple' );
		$this->assertTrue(
			Conditional_Logic::evaluate( $this->one( 'does_not_contain', 'Blue' ), $types, array( 'a' => array( 'Red' ) ) )
		);
		$this->assertFalse(
			Conditional_Logic::evaluate( $this->one( 'does_not_contain', 'Blue' ), $types, array( 'a' => array( 'Blue' ) ) )
		);
	}

	public function test_multichoice_is_not_confused_by_commas_in_labels() {
		$types = array( 'a' => 'checkbox-multiple' );
		$this->assertFalse(
			Conditional_Logic::evaluate( $this->one( 'contains', 'Yes' ), $types, array( 'a' => array( 'Yes, please' ) ) )
		);
		$this->assertTrue(
			Conditional_Logic::evaluate(
				$this->one( 'contains', 'Yes, please' ),
				$types,
				array( 'a' => array( 'Yes, please' ) )
			)
		);
	}

	public function test_multichoice_accepts_a_single_string_selection() {
		$this->assertTrue(
			Conditional_Logic::evaluate(
				$this->one( 'contains', 'Blue' ),
				array( 'a' => 'checkbox-multiple' ),
				array( 'a' => 'Blue' )
			)
		);
	}

	public function test_choice_compares_the_whole_option() {
		$types = array( 'a' => 'select' );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is', 'Blue' ), $types, array( 'a' => 'Blue' ) ) );
		$this->assertFalse( Conditional_Logic::evaluate( $this->one( 'is', 'Blue' ), $types, array( 'a' => 'Blueberry' ) ) );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is_not', 'Blue' ), $types, array( 'a' => 'Red' ) ) );
	}

	/**
	 * Numeric operator cases.
	 *
	 * @return array
	 */
	public static function provide_numeric_operators(): array {
		return array(
			array( 'equals', '10.0', '10', true ),
			array( 'equals', '11', '10', false ),
			array( 'not_equals', '11', '10', true ),
			array( 'greater_than', '20', '10', true ),
			array( 'greater_than', '10', '10', false ),
			array( 'less_than', '5', '10', true ),
			array( 'less_than', '10', '10', false ),
			array( 'gte', '10', '10', true ),
			array( 'gte', '9', '10', false ),
			array( 'lte', '10', '10', true ),
			array( 'lte', '11', '10', false ),
		);
	}

	/**
	 * @param string $operator Operator.
	 * @param string $actual   Submitted value.
	 * @param string $expected Rule value.
	 * @param bool   $want     Expected visibility.
	 * @dataProvider provide_numeric_operators
	 */
	#[DataProvider( 'provide_numeric_operators' )]
	public function test_numeric_operators( $operator, $actual, $expected, $want ) {
		$this->assertSame(
			$want,
			Conditional_Logic::evaluate(
				$this->one( $operator, $expected ),
				array( 'a' => 'number' ),
				array( 'a' => $actual )
			)
		);
	}

	public function test_numeric_rule_fails_when_either_side_is_not_numeric() {
		$types = array( 'a' => 'number' );
		$this->assertFalse( Conditional_Logic::evaluate( $this->one( 'greater_than', '10' ), $types, array( 'a' => 'abc' ) ) );
		$this->assertFalse( Conditional_Logic::evaluate( $this->one( 'greater_than', 'abc' ), $types, array( 'a' => '20' ) ) );
		$this->assertFalse( Conditional_Logic::evaluate( $this->one( 'greater_than', '10' ), $types, array( 'a' => '' ) ) );
	}

	public function test_numbers_compare_numerically_not_lexically() {
		// '9' > '10' as strings, but 9 < 10 as numbers.
		$this->assertFalse(
			Conditional_Logic::evaluate( $this->one( 'greater_than', '10' ), array( 'a' => 'number' ), array( 'a' => '9' ) )
		);
	}

	/**
	 * Date and time operator cases.
	 *
	 * @return array
	 */
	public static function provide_temporal_operators(): array {
		return array(
			array( 'date', 'before', '2026-01-01', '2026-06-01', true ),
			array( 'date', 'before', '2026-12-01', '2026-06-01', false ),
			array( 'date', 'after', '2026-12-01', '2026-06-01', true ),
			array( 'date', 'after', '2026-01-01', '2026-06-01', false ),
			array( 'date', 'is', '2026-06-01', '2026-06-01', true ),
			array( 'date', 'is_not', '2026-06-02', '2026-06-01', true ),
			array( 'time', 'before', '09:00', '17:00', true ),
			array( 'time', 'after', '18:00', '17:00', true ),
			array( 'time', 'is', '17:00', '17:00', true ),
		);
	}

	/**
	 * @param string $field_type Shortcode type (date or time).
	 * @param string $operator   Operator.
	 * @param string $actual     Submitted value.
	 * @param string $expected   Rule value.
	 * @param bool   $want       Expected visibility.
	 * @dataProvider provide_temporal_operators
	 */
	#[DataProvider( 'provide_temporal_operators' )]
	public function test_temporal_operators( $field_type, $operator, $actual, $expected, $want ) {
		$this->assertSame(
			$want,
			Conditional_Logic::evaluate(
				$this->one( $operator, $expected ),
				array( 'a' => $field_type ),
				array( 'a' => $actual )
			)
		);
	}

	public function test_temporal_rule_fails_when_unparseable() {
		$this->assertFalse(
			Conditional_Logic::evaluate( $this->one( 'before', '2026-06-01' ), array( 'a' => 'date' ), array( 'a' => 'nonsense' ) )
		);
		$this->assertFalse(
			Conditional_Logic::evaluate( $this->one( 'before', 'nonsense' ), array( 'a' => 'date' ), array( 'a' => '2026-06-01' ) )
		);
	}

	public function test_boolean_operators() {
		$types = array( 'a' => 'checkbox' );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is_checked' ), $types, array( 'a' => true ) ) );
		$this->assertFalse( Conditional_Logic::evaluate( $this->one( 'is_checked' ), $types, array( 'a' => false ) ) );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is_checked' ), $types, array( 'a' => '1' ) ) );
		$this->assertFalse( Conditional_Logic::evaluate( $this->one( 'is_checked' ), $types, array( 'a' => '' ) ) );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is_not_checked' ), $types, array( 'a' => false ) ) );
		$this->assertFalse( Conditional_Logic::evaluate( $this->one( 'is_not_checked' ), $types, array( 'a' => true ) ) );
	}

	public function test_any_versus_all() {
		$types  = array(
			'a' => 'text',
			'b' => 'text',
		);
		$rules  = array(
			array(
				'field'    => 'a',
				'operator' => 'is',
				'value'    => 'x',
			),
			array(
				'field'    => 'b',
				'operator' => 'is',
				'value'    => 'y',
			),
		);
		$values = array(
			'a' => 'x',
			'b' => 'nope',
		);

		$this->assertTrue(
			Conditional_Logic::evaluate( $this->logic( $rules, array( 'logicalOperator' => 'any' ) ), $types, $values )
		);
		$this->assertFalse(
			Conditional_Logic::evaluate( $this->logic( $rules, array( 'logicalOperator' => 'all' ) ), $types, $values )
		);
	}

	public function test_hide_action_inverts_the_outcome() {
		$types = array( 'a' => 'text' );
		$rules = array(
			array(
				'field'    => 'a',
				'operator' => 'is',
				'value'    => 'x',
			),
		);
		$this->assertTrue( Conditional_Logic::evaluate( $this->logic( $rules ), $types, array( 'a' => 'x' ) ) );
		$this->assertFalse(
			Conditional_Logic::evaluate( $this->logic( $rules, array( 'action' => 'hide' ) ), $types, array( 'a' => 'x' ) )
		);
	}

	public function test_visible_when_disabled_ruleless_or_missing_control() {
		$types = array( 'a' => 'text' );
		$rules = array(
			array(
				'field'    => 'a',
				'operator' => 'is',
				'value'    => 'x',
			),
		);

		$this->assertTrue( Conditional_Logic::evaluate( $this->logic( array() ), $types, array() ) );
		$this->assertTrue(
			Conditional_Logic::evaluate( $this->logic( $rules, array( 'enabled' => false ) ), $types, array() )
		);
		$this->assertTrue(
			Conditional_Logic::evaluate(
				array(
					'enabled'         => true,
					'action'          => 'show',
					'logicalOperator' => 'all',
					'controls'        => array(),
				),
				$types,
				array()
			)
		);
		$this->assertTrue( Conditional_Logic::evaluate( null, $types, array() ) );
	}

	public function test_rule_with_missing_subject_field_is_ignored() {
		// A deleted subject must not be compared against empty: that would make is_empty
		// spuriously true and hide the field because an unrelated block was removed.
		$types = array( 'a' => 'text' );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is_empty', '', 'gone' ), $types, array() ) );
		$this->assertTrue( Conditional_Logic::evaluate( $this->one( 'is', 'x', 'gone' ), $types, array() ) );
	}

	public function test_only_the_missing_rule_is_ignored() {
		$types = array( 'a' => 'text' );
		$rules = array(
			array(
				'field'    => 'gone',
				'operator' => 'is',
				'value'    => 'x',
			),
			array(
				'field'    => 'a',
				'operator' => 'is',
				'value'    => 'x',
			),
		);
		$this->assertTrue( Conditional_Logic::evaluate( $this->logic( $rules ), $types, array( 'a' => 'x' ) ) );
		$this->assertFalse( Conditional_Logic::evaluate( $this->logic( $rules ), $types, array( 'a' => 'nope' ) ) );
	}

	public function test_unknown_operator_is_ignored() {
		$this->assertTrue(
			Conditional_Logic::evaluate(
				$this->one( 'not_a_real_operator', 'x' ),
				array( 'a' => 'text' ),
				array( 'a' => 'x' )
			)
		);
	}

	/**
	 * Build the A -> B -> C chain used by the cascade tests.
	 *
	 * @return array
	 */
	private function chain(): array {
		return array(
			'a' => array(
				'logic' => null,
				'type'  => 'text',
			),
			'b' => array(
				'logic' => $this->one( 'is', 'Other' ),
				'type'  => 'text',
			),
			'c' => array(
				'logic' => $this->logic(
					array(
						array(
							'field'    => 'b',
							'operator' => 'is_not_empty',
						),
					)
				),
				'type'  => 'text',
			),
		);
	}

	public function test_cascade_treats_hidden_field_as_empty() {
		// A switched away from Other so B hides. B still holds a stale value, but C must not
		// stay visible on the strength of an answer the visitor can no longer see.
		$visible = Conditional_Logic::resolve_visibility(
			$this->chain(),
			array(
				'a' => 'Something else',
				'b' => 'xyz',
				'c' => '',
			)
		);

		$this->assertTrue( $visible['a'] );
		$this->assertFalse( $visible['b'] );
		$this->assertFalse( $visible['c'] );
	}

	public function test_cascade_keeps_the_chain_visible_when_the_trigger_matches() {
		$visible = Conditional_Logic::resolve_visibility(
			$this->chain(),
			array(
				'a' => 'Other',
				'b' => 'xyz',
				'c' => '',
			)
		);

		$this->assertTrue( $visible['b'] );
		$this->assertTrue( $visible['c'] );
	}

	public function test_cascade_resolves_a_three_deep_chain() {
		$fields      = $this->chain();
		$fields['d'] = array(
			'logic' => $this->logic(
				array(
					array(
						'field'    => 'c',
						'operator' => 'is_not_empty',
					),
				)
			),
			'type'  => 'text',
		);

		$visible = Conditional_Logic::resolve_visibility(
			$fields,
			array(
				'a' => 'Other',
				'b' => 'x',
				'c' => 'y',
				'd' => '',
			)
		);
		$this->assertTrue( $visible['d'] );

		$hidden = Conditional_Logic::resolve_visibility(
			$fields,
			array(
				'a' => 'stop',
				'b' => 'x',
				'c' => 'y',
				'd' => '',
			)
		);
		$this->assertFalse( $hidden['b'] );
		$this->assertFalse( $hidden['c'] );
		$this->assertFalse( $hidden['d'] );
	}

	public function test_two_field_cycle_fails_open() {
		$fields = array(
			'a' => array(
				'logic' => $this->logic(
					array(
						array(
							'field'    => 'b',
							'operator' => 'is_empty',
						),
					)
				),
				'type'  => 'text',
			),
			'b' => array(
				'logic' => $this->logic(
					array(
						array(
							'field'    => 'a',
							'operator' => 'is_not_empty',
						),
					)
				),
				'type'  => 'text',
			),
		);

		$visible = Conditional_Logic::resolve_visibility(
			$fields,
			array(
				'a' => 'x',
				'b' => 'y',
			)
		);

		$this->assertTrue( $visible['a'] );
		$this->assertTrue( $visible['b'] );
	}

	public function test_self_reference_fails_open() {
		$fields = array(
			'a' => array(
				'logic' => $this->logic(
					array(
						array(
							'field'    => 'a',
							'operator' => 'is_empty',
						),
					)
				),
				'type'  => 'text',
			),
		);

		$visible = Conditional_Logic::resolve_visibility( $fields, array( 'a' => 'x' ) );

		$this->assertTrue( $visible['a'] );
	}

	public function test_every_field_visible_when_none_has_logic() {
		$fields = array(
			'a' => array(
				'logic' => null,
				'type'  => 'text',
			),
			'b' => array(
				'logic' => null,
				'type'  => 'text',
			),
		);

		$this->assertSame(
			array(
				'a' => true,
				'b' => true,
			),
			Conditional_Logic::resolve_visibility( $fields, array() )
		);
	}

	public function test_resolve_visibility_returns_an_entry_for_every_field() {
		$visible = Conditional_Logic::resolve_visibility(
			$this->chain(),
			array(
				'a' => 'Other',
				'b' => 'x',
				'c' => '',
			)
		);
		$keys    = array_keys( $visible );
		sort( $keys );
		$this->assertSame( array( 'a', 'b', 'c' ), $keys );
	}

	public function test_resolve_visibility_tolerates_an_empty_field_map() {
		$this->assertSame( array(), Conditional_Logic::resolve_visibility( array(), array() ) );
	}

	/**
	 * A deep chain must still reach its fixed point.
	 *
	 * The pass budget used to be clamped to a constant, so an acyclic chain deeper than the
	 * clamp ran out of passes, was read as circular, and failed open -- leaving fields
	 * visible that every rule said to hide.
	 */
	public function test_a_deep_acyclic_chain_resolves_completely() {
		$depth       = 30;
		$descriptors = array( 'f0' => array( 'type' => 'text' ) );
		$values      = array( 'f0' => 'no' );

		// Each field is shown only when the one before it says 'yes'. f0 says 'no', so every
		// field downstream of it must resolve hidden.
		for ( $i = 1; $i <= $depth; $i++ ) {
			$descriptors[ "f$i" ] = array(
				'type'  => 'text',
				'logic' => array(
					'enabled'         => true,
					'action'          => 'show',
					'logicalOperator' => 'all',
					'controls'        => array(
						'fieldValue' => array(
							'rules' => array(
								array(
									'field'    => 'f' . ( $i - 1 ),
									'operator' => 'is',
									'value'    => 'yes',
								),
							),
						),
					),
				),
			);
			$values[ "f$i" ] = 'yes';
		}

		$visible = Conditional_Logic::resolve_visibility( $descriptors, $values );

		$this->assertTrue( $visible['f0'], 'The unconditional field is always visible.' );
		for ( $i = 1; $i <= $depth; $i++ ) {
			$this->assertFalse(
				$visible[ "f$i" ],
				"Field f$i is downstream of a false condition and must be hidden."
			);
		}
	}
}
