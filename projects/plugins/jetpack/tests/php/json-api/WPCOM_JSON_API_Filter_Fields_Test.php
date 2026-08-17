<?php
/**
 * WPCOM_JSON_API::filter_fields() unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Filter_Fields_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';

/**
 * Tests for WPCOM_JSON_API::filter_fields().
 *
 * @covers \WPCOM_JSON_API
 */
#[CoversClass( WPCOM_JSON_API::class )]
class WPCOM_JSON_API_Filter_Fields_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	/**
	 * Reset the shared API singleton's query between tests.
	 */
	public function tear_down() {
		WPCOM_JSON_API::init()->query = array();
		parent::tear_down();
	}

	/**
	 * A `fields` query parameter passed as an array (e.g. via `?fields[`) reaches
	 * filter_fields() as a non-string, which used to fatal when handed to explode().
	 * It should now be left unfiltered and returned unchanged.
	 */
	public function test_filter_fields_returns_response_unchanged_for_array_fields() {
		$api                  = WPCOM_JSON_API::init();
		$api->query['fields'] = array( 'ID' );

		$response = array(
			'ID'    => 1,
			'title' => 'Hello',
		);

		$this->assertSame( $response, $api->filter_fields( $response ) );
	}

	/**
	 * A string `fields` value still filters the response down to the requested keys.
	 */
	public function test_filter_fields_still_filters_for_string_fields() {
		$api                  = WPCOM_JSON_API::init();
		$api->query['fields'] = 'ID';

		$response = array(
			'ID'    => 1,
			'title' => 'Hello',
		);

		$this->assertSame( array( 'ID' => 1 ), $api->filter_fields( $response ) );
	}
}
