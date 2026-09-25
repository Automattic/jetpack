<?php
/**
 * Parity between the PHP and JavaScript product status vocabularies.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

/**
 * The status string is the join between the two halves of the product card contract:
 * Plan_Matrix_Test asserts which status each plan state produces, and the Products page
 * asserts which action each status produces. Adding a status to one side and not the
 * other silently drops a card into ActionButton's "Learn more" default, so pin the two
 * vocabularies to each other here.
 *
 * @covers \Automattic\Jetpack\My_Jetpack\Products
 */
#[CoversClass( Products::class )]
class Status_Vocabulary_Parity_Test extends TestCase {

	/**
	 * The TypeScript constants file the Products page reads its statuses from.
	 */
	private const CONSTANTS_PATH = __DIR__ . '/../../_inc/constants.ts';

	/**
	 * Every status PHP can put on a product.
	 */
	public function test_php_and_javascript_declare_the_same_statuses() {
		$this->assertSame(
			$this->php_statuses(),
			$this->javascript_statuses(),
			'PRODUCT_STATUSES in _inc/constants.ts no longer matches the STATUS_* constants on the Products class.'
		);
	}

	/**
	 * Every STATUS_* constant on the Products class, sorted by value.
	 *
	 * @return array<string>
	 */
	private function php_statuses(): array {
		$statuses = array();
		foreach ( ( new ReflectionClass( Products::class ) )->getConstants() as $name => $value ) {
			if ( 0 === strpos( $name, 'STATUS_' ) ) {
				$statuses[] = $value;
			}
		}

		sort( $statuses );
		return $statuses;
	}

	/**
	 * Every value in the PRODUCT_STATUSES object in _inc/constants.ts, sorted.
	 *
	 * @return array<string>
	 */
	private function javascript_statuses(): array {
		$source = file_get_contents( self::CONSTANTS_PATH ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading a checked-in source file, not a remote resource.
		$this->assertNotFalse( $source, 'Could not read ' . self::CONSTANTS_PATH );

		preg_match( '/export const PRODUCT_STATUSES = \{(.*?)\};/s', $source, $block );
		$this->assertNotEmpty( $block, 'Could not find the PRODUCT_STATUSES declaration in _inc/constants.ts.' );

		preg_match_all( "/:\s*'([^']+)'/", $block[1], $values );

		$statuses = $values[1];
		sort( $statuses );
		return $statuses;
	}
}
