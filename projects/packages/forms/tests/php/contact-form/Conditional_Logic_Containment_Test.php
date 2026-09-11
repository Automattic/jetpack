<?php
/**
 * Containment parity between the PHP and JS conditional-logic evaluators.
 *
 * Sibling of Conditional_Logic_Behaviour_Test, which pins how a single comparison behaves.
 * This reads the table evaluate.test.js reads for containers: which fields a hidden container
 * takes down with it, and whether an enclosed field's answer still counts for anyone else.
 *
 * Containment is written twice and wired into the same fixed point on both sides. A
 * disagreement means the browser and the server enforce different fields, so the form either
 * blocks on a question nobody was shown or stores an answer for one that was hidden.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Conditional_Logic
 */
#[CoversClass( Conditional_Logic::class )]
class Conditional_Logic_Containment_Test extends BaseTestCase {

	/**
	 * Read the rows of the shared table.
	 *
	 * Throws rather than returning an empty list: a fixture that cannot be read would
	 * otherwise turn every case below into a silent pass, which is the one failure mode a
	 * shared parity table must not have.
	 *
	 * @throws \RuntimeException When the fixture is missing or does not hold a case list.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private static function load_cases(): array {
		$path = __DIR__ . '/../../fixtures/conditional-logic-containment.json';
		$data = json_decode( (string) file_get_contents( $path ), true );

		if ( ! is_array( $data ) || ! isset( $data['cases'] ) || ! is_array( $data['cases'] ) ) {
			throw new \RuntimeException( 'conditional-logic-containment.json is missing its cases array.' );
		}

		return $data['cases'];
	}

	/**
	 * The shared case table.
	 *
	 * @return array<string, array{0: array<string, mixed>}>
	 */
	public static function containment_cases(): array {
		$cases = array();
		foreach ( self::load_cases() as $case ) {
			$cases[ $case['name'] ] = array( $case );
		}

		return $cases;
	}

	/**
	 * @dataProvider containment_cases
	 *
	 * @param array<string, mixed> $case One row of the shared table.
	 */
	#[DataProvider( 'containment_cases' )]
	public function test_matches_the_shared_containment_table( array $case ) {
		$descriptors = array();

		foreach ( $case['fields'] as $id => $field ) {
			$logic = null;

			if ( isset( $field['rule'] ) ) {
				$logic = array(
					'enabled'         => true,
					'action'          => $field['action'] ?? 'show',
					'logicalOperator' => 'all',
					'groups'          => array(
						array(
							'logicalOperator' => 'all',
							'rules'           => array( $field['rule'] ),
						),
					),
				);
			}

			$descriptors[ $id ] = array(
				'type'  => 'text',
				'logic' => $logic,
			);
		}

		$resolved = Conditional_Logic::resolve_visibility(
			$descriptors,
			$case['values'],
			$case['contains']
		);

		$this->assertSame( $case['expect'], $resolved );
	}
}
