<?php
/**
 * Behavioural parity with the JavaScript evaluator.
 *
 * Conditional_Logic_Parity_Test pins the shared vocabulary -- operator names and the field
 * type table. That is worth having, but it is not where the two implementations drift: both
 * the Date.parse/strtotime disagreement and the consent value-shape bug passed it. The
 * comparisons are where they drift, so this pins those, from a table evaluate.test.js reads
 * as well. A case that behaves differently in the two languages fails on one side.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Conditional_Logic
 */
#[CoversClass( Conditional_Logic::class )]
class Conditional_Logic_Behaviour_Test extends BaseTestCase {

	/**
	 * The shared case table.
	 *
	 * @return array<string, array{0: array<string, mixed>}>
	 */
	public static function behaviour_cases(): array {
		$path = __DIR__ . '/../../fixtures/conditional-logic-behaviour.json';
		$data = json_decode( (string) file_get_contents( $path ), true );

		$cases = array();
		foreach ( $data['cases'] as $case ) {
			$cases[ $case['name'] ] = array( $case );
		}

		return $cases;
	}

	/**
	 * @param array<string, mixed> $case One row of the shared table.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'behaviour_cases' )]
	public function test_matches_the_shared_behaviour_table( array $case ) {
		$logic = array(
			'enabled'         => true,
			'action'          => 'show',
			'logicalOperator' => 'all',
			'controls'        => array(
				'fieldValue' => array(
					'rules' => array(
						array(
							'field'    => 'subject',
							'operator' => $case['operator'],
							'value'    => $case['value'],
						),
					),
				),
			),
		);

		$formats = isset( $case['format'] ) ? array( 'subject' => $case['format'] ) : array();

		$visible = Conditional_Logic::evaluate(
			$logic,
			array( 'subject' => $case['type'] ),
			array( 'subject' => $case['actual'] ),
			$formats
		);

		$this->assertSame(
			$case['visible'],
			$visible,
			$case['why'] ?? 'Behaviour must match the JavaScript evaluator.'
		);
	}

	/**
	 * The table is only worth anything if both sides actually read it.
	 */
	public function test_the_shared_table_covers_every_comparison_family() {
		$data  = json_decode(
			(string) file_get_contents( __DIR__ . '/../../fixtures/conditional-logic-behaviour.json' ),
			true
		);
		$types = array_unique( array_column( $data['cases'], 'type' ) );

		foreach ( array( 'date', 'time', 'number', 'consent', 'checkbox', 'text', 'select' ) as $type ) {
			$this->assertContains( $type, $types, "The shared table lost its $type cases." );
		}
	}
}
