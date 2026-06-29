<?php
/**
 * WPCOM_JSON_API::serializable_error() unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Serializable_Error_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests that serializable_error() always renders a safe HTTP error status: never
 * `1`, never a non-integer, never `< 400`, and never a code status_header() can't
 * render. Regression coverage for the proxied-error incident (CONNECT-267).
 *
 * @covers \WPCOM_JSON_API::serializable_error
 * @covers \WPCOM_JSON_API
 */
#[CoversClass( WPCOM_JSON_API::class )]
#[CoversMethod( WPCOM_JSON_API::class, 'serializable_error' )]
class WPCOM_JSON_API_Serializable_Error_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	/**
	 * The rendered status_code for a given WP_Error.
	 *
	 * @param WP_Error $error Error.
	 * @return int
	 */
	private function status_for( $error ): int {
		$serialized = WPCOM_JSON_API::serializable_error( $error );
		return $serialized['status_code'];
	}

	/**
	 * A valid status_code in the data passes through unchanged -- both the
	 * canonical array key and a bare-integer data value.
	 */
	public function test_valid_status_passes_through() {
		$this->assertSame( 404, $this->status_for( new WP_Error( 'not_found', 'Nope', array( 'status_code' => 404 ) ) ) );
		$this->assertSame( 451, $this->status_for( new WP_Error( 'legal', 'Blocked', 451 ) ) );
	}

	/**
	 * The incident class: array error data WITHOUT a `status_code` key (e.g. the
	 * WP-REST `status` shape) must never survive as a truthy array and `(int)`-cast
	 * to `1`. It falls to the safe `400` default instead.
	 */
	public function test_array_without_status_code_is_safe_not_1() {
		foreach (
			array(
				new WP_Error( 'forbidden', 'No', array( 'status' => 403 ) ),
				new WP_Error( 'weird', 'Weird', array( 'foo' => 'bar' ) ),
				new WP_Error( 'empty', 'Empty', array() ),
			) as $error
		) {
			$status = $this->status_for( $error );
			$this->assertIsInt( $status );
			$this->assertNotSame( 1, $status );
			$this->assertSame( 400, $status );
		}
	}

	/**
	 * No data at all keeps the historical 400 default.
	 */
	public function test_no_data_defaults_to_400() {
		$this->assertSame( 400, $this->status_for( new WP_Error( 'generic', 'Generic' ) ) );
	}

	/**
	 * A success/redirect status paired with an error must never render as `< 400`
	 * (the crash: an app reads a 2xx as a successful, URL-less site).
	 *
	 * @param int $input Non-error status carried on the error.
	 * @dataProvider provide_non_error_statuses
	 */
	#[DataProvider( 'provide_non_error_statuses' )]
	public function test_non_error_status_coerced_to_400( $input ) {
		$this->assertSame( 400, $this->status_for( new WP_Error( 'oops', 'Oops', array( 'status_code' => $input ) ) ) );
	}

	/**
	 * Data provider: statuses a client could read as success.
	 *
	 * @return array<string, array{int}>
	 */
	public static function provide_non_error_statuses(): array {
		return array(
			'200 OK'      => array( 200 ),
			'201 Created' => array( 201 ),
			'302 Found'   => array( 302 ),
		);
	}

	/**
	 * Codes status_header() cannot render coerce to 502, so they never silently
	 * leave the default 200. (Cloudflare 52x / non-standard codes; note 508 IS
	 * known to WP core's get_status_header_desc(), so it is deliberately not here.)
	 *
	 * @param int $input Unrenderable status carried on the error.
	 * @dataProvider provide_unrenderable_statuses
	 */
	#[DataProvider( 'provide_unrenderable_statuses' )]
	public function test_unrenderable_status_coerced_to_502( $input ) {
		$this->assertSame( 502, $this->status_for( new WP_Error( 'upstream', 'Upstream', array( 'status_code' => $input ) ) ) );
	}

	/**
	 * Data provider: codes WP's get_status_header_desc() doesn't know.
	 *
	 * @return array<string, array{int}>
	 */
	public static function provide_unrenderable_statuses(): array {
		return array(
			'520 Cloudflare' => array( 520 ),
			'521 Cloudflare' => array( 521 ),
			'523 Cloudflare' => array( 523 ),
			'599 non-std'    => array( 599 ),
		);
	}

	/**
	 * The error body shape (code + message + additional_data) is preserved
	 * alongside the hardened status.
	 */
	public function test_error_shape_preserved() {
		$error = new WP_Error( 'my_code', 'My message', array( 'status_code' => 422 ) );
		$error->add_data( array( 'field' => 'name' ), 'additional_data' );

		$serialized = WPCOM_JSON_API::serializable_error( $error );

		$this->assertSame( 422, $serialized['status_code'] );
		$this->assertSame( 'my_code', $serialized['errors']['error'] );
		$this->assertSame( 'My message', $serialized['errors']['message'] );
		$this->assertSame( array( 'field' => 'name' ), $serialized['errors']['data'] );
	}
}
