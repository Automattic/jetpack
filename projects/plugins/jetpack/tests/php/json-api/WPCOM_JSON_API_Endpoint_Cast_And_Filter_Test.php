<?php
/**
 * Unit tests for WPCOM_JSON_API_Endpoint::cast_and_filter().
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Endpoint_Cast_And_Filter_Test
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests for WPCOM_JSON_API_Endpoint::cast_and_filter().
 *
 * @covers \WPCOM_JSON_API_Endpoint
 * @covers \WPCOM_JSON_API_Endpoint::cast_and_filter
 */
#[CoversClass( WPCOM_JSON_API_Endpoint::class )]
#[CoversMethod( WPCOM_JSON_API_Endpoint::class, 'cast_and_filter' )]
class WPCOM_JSON_API_Endpoint_Cast_And_Filter_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	/**
	 * A field documented without a (type) prefix is dropped without an error or a warning.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_untyped_field_is_dropped_silently() {
		$endpoint = new WPCOM_JSON_API_Cast_And_Filter_Test_Endpoint( array( 'stat' => 'test' ) );

		$result = $endpoint->cast_and_filter(
			array(
				'note'  => 'hello',
				'count' => '3',
			),
			array(
				'note'  => 'A note with no type prefix.',
				'count' => '(int) A count.',
			)
		);

		$this->assertSame( array( 'count' => 3 ), $result );
	}
}

/**
 * Minimal concrete endpoint for exercising cast_and_filter().
 */
class WPCOM_JSON_API_Cast_And_Filter_Test_Endpoint extends WPCOM_JSON_API_Endpoint {

	/**
	 * Callback implementation (unused by these tests).
	 *
	 * @param string $path The request path.
	 * @return mixed
	 */
	public function callback( $path = '' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array();
	}
}
