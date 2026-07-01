<?php
/**
 * WPCOM_JSON_API::renderable_status_code() unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Renderable_Status_Code_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests that renderable_status_code() never returns a status status_header() can't render:
 * codes WP's get_status_header_desc() doesn't know would otherwise silently no-op to 200.
 *
 * @covers \WPCOM_JSON_API::renderable_status_code
 * @covers \WPCOM_JSON_API
 */
#[CoversClass( WPCOM_JSON_API::class )]
#[CoversMethod( WPCOM_JSON_API::class, 'renderable_status_code' )]
class WPCOM_JSON_API_Renderable_Status_Code_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	/**
	 * Codes WP's get_status_header_desc() knows pass through unchanged.
	 *
	 * @param int $input A status_header()-renderable code.
	 * @dataProvider provide_renderable_codes
	 */
	#[DataProvider( 'provide_renderable_codes' )]
	public function test_renderable_code_passes_through( $input ) {
		$this->assertSame( $input, WPCOM_JSON_API::renderable_status_code( $input ) );
	}

	/**
	 * Data provider: codes get_status_header_desc() can render.
	 *
	 * @return array<string, array{int}>
	 */
	public static function provide_renderable_codes(): array {
		return array(
			'400 Bad Request' => array( 400 ),
			'404 Not Found'   => array( 404 ),
			'451 Legal'       => array( 451 ),
			'500 Server'      => array( 500 ),
			'502 Bad Gateway' => array( 502 ),
			'503 Unavailable' => array( 503 ),
			'511 Network'     => array( 511 ),
		);
	}

	/**
	 * Codes get_status_header_desc() doesn't know (508, Cloudflare 52x, other non-standard) would
	 * make status_header() no-op to 200; they coerce to 502 instead.
	 *
	 * @param int $input A status WP can't describe.
	 * @dataProvider provide_unrenderable_codes
	 */
	#[DataProvider( 'provide_unrenderable_codes' )]
	public function test_unrenderable_code_coerces_to_502( $input ) {
		$this->assertSame( 502, WPCOM_JSON_API::renderable_status_code( $input ) );
	}

	/**
	 * Data provider: codes WP's get_status_header_desc() doesn't know.
	 *
	 * @return array<string, array{int}>
	 */
	public static function provide_unrenderable_codes(): array {
		return array(
			'508 Loop Detected' => array( 508 ),
			'520 Cloudflare'    => array( 520 ),
			'522 Cloudflare'    => array( 522 ),
			'524 Cloudflare'    => array( 524 ),
			'599 non-std'       => array( 599 ),
		);
	}

	/**
	 * A numeric-string status is cast and treated like its integer.
	 */
	public function test_numeric_string_is_cast() {
		$this->assertSame( 404, WPCOM_JSON_API::renderable_status_code( '404' ) );
		$this->assertSame( 502, WPCOM_JSON_API::renderable_status_code( '524' ) );
	}
}
