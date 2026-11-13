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
 * Tests that filter_fields() filters by a string `fields` and ignores any other type.
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
	 * The shared API instance's query and endpoint before each test.
	 *
	 * @var array
	 */
	private $saved_state;

	/**
	 * Save the shared API instance's state.
	 */
	public function set_up() {
		parent::set_up();
		$api               = WPCOM_JSON_API::init();
		$this->saved_state = array( $api->query, $api->endpoint );
	}

	/**
	 * Restore the shared API instance so `fields` does not leak into later tests.
	 */
	public function tear_down() {
		$api           = WPCOM_JSON_API::init();
		$api->query    = $this->saved_state[0];
		$api->endpoint = $this->saved_state[1];
		parent::tear_down();
	}

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
			'string'               => array( 'ID, URL', array( 'ID', 'URL' ) ),
			'string of separators' => array( ',', array() ),
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
	 * Data provider for test_non_string_fields_are_ignored.
	 *
	 * @return array
	 */
	public static function provide_non_string_fields() {
		return array(
			'array'   => array( array( 'ID', 'URL' ) ),
			'integer' => array( 5 ),
			'object'  => array( new stdClass() ),
		);
	}

	/**
	 * @dataProvider provide_non_string_fields
	 *
	 * @param mixed $fields The `fields` query value.
	 */
	#[DataProvider( 'provide_non_string_fields' )]
	public function test_non_string_fields_are_ignored( $fields ) {
		$this->assertSame( self::RESPONSE, $this->filter( $fields ) );
	}
}
