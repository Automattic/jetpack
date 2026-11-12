<?php
/**
 * WPCOM_JSON_API::filter_fields() unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Filter_Fields_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests that filter_fields() accepts `fields` as a string or an array and ignores anything else.
 *
 * @covers \WPCOM_JSON_API::filter_fields
 */
#[CoversMethod( WPCOM_JSON_API::class, 'filter_fields' )]
class WPCOM_JSON_API_Filter_Fields_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	const RESPONSE = array(
		'ID'    => 1,
		'URL'   => 'https://example.org',
		'title' => 'Title',
	);

	/**
	 * Run filter_fields() on RESPONSE with the given `fields` query value.
	 *
	 * @param mixed $fields The `fields` query value.
	 * @return mixed
	 */
	private function filter( $fields ) {
		$api           = WPCOM_JSON_API::init();
		$api->query    = array( 'fields' => $fields );
		$api->endpoint = $this->createStub( WPCOM_JSON_API_Endpoint::class );
		return $api->filter_fields( self::RESPONSE );
	}

	/**
	 * Data provider for test_filters_to_requested_fields.
	 *
	 * @return array
	 */
	public static function provide_filtered_fields() {
		return array(
			'string'                 => array( 'ID, URL', array( 'ID', 'URL' ) ),
			'array'                  => array( array( 'ID', ' URL' ), array( 'ID', 'URL' ) ),
			'array with non-strings' => array( array( 'ID', array( 'x' ), 5 ), array( 'ID' ) ),
		);
	}

	/**
	 * @dataProvider provide_filtered_fields
	 *
	 * @param mixed    $fields   The `fields` query value.
	 * @param string[] $expected Keys expected in the filtered response.
	 */
	#[DataProvider( 'provide_filtered_fields' )]
	public function test_filters_to_requested_fields( $fields, $expected ) {
		$this->assertSame( $expected, array_keys( $this->filter( $fields ) ) );
	}

	/**
	 * Data provider for test_unusable_fields_return_response_unchanged.
	 *
	 * @return array
	 */
	public static function provide_unusable_fields() {
		return array(
			'integer'              => array( 5 ),
			'object'               => array( new stdClass() ),
			'array of non-strings' => array( array( array( 'x' ), 5 ) ),
			'array of blanks'      => array( array( '', ' ' ) ),
		);
	}

	/**
	 * @dataProvider provide_unusable_fields
	 *
	 * @param mixed $fields The `fields` query value.
	 */
	#[DataProvider( 'provide_unusable_fields' )]
	public function test_unusable_fields_return_response_unchanged( $fields ) {
		$this->assertSame( self::RESPONSE, $this->filter( $fields ) );
	}
}
