<?php
/**
 * Guards the contract between the two conditional-logic evaluators.
 *
 * Conditional logic is implemented twice: once in TypeScript for the editor and the browser
 * runtime, once in PHP for validation and storage. They agree only by convention, and a
 * silent divergence is expensive — a field the visitor never saw gets stored, or an answer
 * they did give gets dropped. These tests turn that convention into a failing build.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReflectionMethod;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Conditional_Logic
 */
#[CoversClass( Conditional_Logic::class )]
class Conditional_Logic_Parity_Test extends TestCase {

	/**
	 * Absolute path to the TypeScript module that owns the shared vocabulary.
	 *
	 * @return string
	 */
	private function field_types_path(): string {
		return __DIR__ . '/../../../src/blocks/shared/conditional-logic/util/field-types.ts';
	}

	/**
	 * Read the TypeScript source that defines the shared tables.
	 *
	 * @return string
	 */
	private function field_types_source(): string {
		$path = $this->field_types_path();
		$this->assertFileExists( $path, 'field-types.ts moved; update this test to match.' );

		$source = file_get_contents( $path );
		$this->assertNotEmpty( $source, 'field-types.ts is empty.' );

		return $source;
	}

	/**
	 * The PHP operator constants must match the TypeScript OPERATORS values exactly.
	 *
	 * Operator strings are persisted in post content, so a rename on one side silently stops
	 * matching rules saved by the other.
	 */
	public function test_php_operator_constants_match_the_typescript_source() {
		$source = $this->field_types_source();

		$matched = preg_match( '/export const OPERATORS = \{(.*?)\} as const;/s', $source, $block );
		$this->assertSame( 1, $matched, 'Could not locate the OPERATORS object in field-types.ts.' );

		preg_match_all( "/^\s*[A-Z_]+:\s*'([a-z_]+)',/m", $block[1], $matches );
		$ts_operators = $matches[1];
		$this->assertNotEmpty( $ts_operators, 'No operators parsed from field-types.ts.' );

		$php_operators = array();
		foreach ( ( new ReflectionClass( Conditional_Logic::class ) )->getConstants() as $name => $value ) {
			if ( 0 === strpos( $name, 'OP_' ) ) {
				$php_operators[] = $value;
			}
		}

		sort( $ts_operators );
		sort( $php_operators );

		$this->assertSame(
			$ts_operators,
			$php_operators,
			'Operator drift between field-types.ts and Conditional_Logic.'
		);
	}

	/**
	 * Both sides must agree on how a shortcode field type compares.
	 *
	 * The editor keys off block names and the runtime keys off shortcode types; this table is
	 * where the two meet, so it has to be identical in both languages.
	 */
	public function test_php_field_type_table_matches_the_typescript_source() {
		$source = $this->field_types_source();

		$matched = preg_match(
			'/export const TYPE_KEY_BY_FIELD_TYPE: Record< string, TypeKey > = \{(.*?)\n\};/s',
			$source,
			$block
		);
		$this->assertSame( 1, $matched, 'Could not locate TYPE_KEY_BY_FIELD_TYPE in field-types.ts.' );

		preg_match_all( "/^\s*'?([a-z-]+)'?:\s*'([a-z]+)',/m", $block[1], $matches, PREG_SET_ORDER );
		$this->assertNotEmpty( $matches, 'No field type entries parsed from field-types.ts.' );

		$ts_table = array();
		foreach ( $matches as $entry ) {
			$ts_table[ $entry[1] ] = $entry[2];
		}

		$php_table = Conditional_Logic::TYPE_KEY_BY_FIELD_TYPE;

		ksort( $ts_table );
		ksort( $php_table );

		$this->assertSame(
			$ts_table,
			$php_table,
			'Field type mapping drift between field-types.ts and Conditional_Logic.'
		);
	}

	/**
	 * Every operator the rule builder offers for a type must be one the PHP evaluator dispatches.
	 *
	 * `OPERATORS_BY_TYPE_KEY` in field-types.ts is the list of operators the editor lets you pick
	 * per field type. `evaluate_rule_value` returns null for any (type key, operator) pair it does
	 * not handle, and a null outcome is dropped silently: the rule never counts, and the field it
	 * guards falls unconditionally visible with no notice and no failing test. This walks the
	 * offered table and asserts each pair evaluates to a real boolean, so adding an operator to the
	 * UI without wiring its comparison — on either side — turns red instead of shipping a dead rule.
	 */
	public function test_every_offered_operator_pair_is_dispatched_by_php() {
		$source = $this->field_types_source();

		// Resolve the OPERATORS.<NAME> references the table uses back to their string values.
		$matched = preg_match( '/export const OPERATORS = \{(.*?)\} as const;/s', $source, $block );
		$this->assertSame( 1, $matched, 'Could not locate the OPERATORS object in field-types.ts.' );

		preg_match_all( "/^\s*([A-Z_]+):\s*'([a-z_]+)',/m", $block[1], $matches, PREG_SET_ORDER );
		$this->assertNotEmpty( $matches, 'No operators parsed from field-types.ts.' );

		$operator_values = array();
		foreach ( $matches as $entry ) {
			$operator_values[ $entry[1] ] = $entry[2];
		}

		$matched = preg_match(
			'/OPERATORS_BY_TYPE_KEY: Record< TypeKey, Operator\[\] > = \{(.*?)\n\};/s',
			$source,
			$block
		);
		$this->assertSame( 1, $matched, 'Could not locate OPERATORS_BY_TYPE_KEY in field-types.ts.' );

		preg_match_all( '/([a-z]+):\s*\[(.*?)\]/s', $block[1], $entries, PREG_SET_ORDER );
		$this->assertNotEmpty( $entries, 'No type-key operator lists parsed from field-types.ts.' );

		$evaluate = new ReflectionMethod( Conditional_Logic::class, 'evaluate_rule_value' );
		$evaluate->setAccessible( true );

		$pairs_checked = 0;
		foreach ( $entries as $entry ) {
			$type_key = $entry[1];

			preg_match_all( '/OPERATORS\.([A-Z_]+)/', $entry[2], $refs );
			$this->assertNotEmpty(
				$refs[1],
				"No operators parsed for type key '$type_key' in OPERATORS_BY_TYPE_KEY."
			);

			foreach ( $refs[1] as $name ) {
				$this->assertArrayHasKey(
					$name,
					$operator_values,
					"OPERATORS_BY_TYPE_KEY references OPERATORS.$name, which OPERATORS does not define."
				);
				$operator = $operator_values[ $name ];

				// Generic operands: enough for every branch to reach its comparison, so only a
				// genuinely unhandled (type key, operator) pair returns null.
				$outcome = $evaluate->invoke(
					null,
					array(
						'operator' => $operator,
						'value'    => '1',
					),
					$type_key,
					'1',
					''
				);

				$this->assertNotNull(
					$outcome,
					"Type '$type_key' offers operator '$operator' but the PHP evaluator does not dispatch it, so the rule is dropped silently."
				);
				++$pairs_checked;
			}
		}

		$this->assertGreaterThan( 0, $pairs_checked, 'No offered operator pairs were checked.' );
	}
}
