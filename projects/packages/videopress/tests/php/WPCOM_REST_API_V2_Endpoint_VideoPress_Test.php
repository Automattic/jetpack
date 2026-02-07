<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_VideoPress route registration and argument validation.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * Validates that REST route schemas correctly enforce argument constraints.
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress_Test extends BaseTestCase {

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Set up the test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		new WPCOM_REST_API_V2_Endpoint_VideoPress();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tearDown(): void {
		parent::tearDown();

		global $wp_rest_server;
		$wp_rest_server = null;
	}

	/**
	 * Helper to find a route key containing a substring.
	 *
	 * @param string $substring The substring to search for.
	 * @return string|null The full route key, or null if not found.
	 */
	private function find_route_key( string $substring ): ?string {
		$routes = rest_get_server()->get_routes();
		foreach ( array_keys( $routes ) as $key ) {
			if ( str_contains( $key, $substring ) ) {
				return $key;
			}
		}
		return null;
	}

	/**
	 * Test that all expected REST routes are registered.
	 */
	public function test_routes_are_registered() {
		$this->assertNotNull( $this->find_route_key( 'videopress/meta' ) );
		$this->assertNotNull( $this->find_route_key( 'videopress/' ) && $this->find_route_key( '/poster' ) );
		$this->assertNotNull( $this->find_route_key( 'check-ownership' ) );
		$this->assertNotNull( $this->find_route_key( 'upload-jwt' ) );
		$this->assertNotNull( $this->find_route_key( 'playback-jwt' ) );
	}

	/**
	 * Data provider for valid privacy_setting values.
	 *
	 * @return array[] Test cases.
	 */
	public static function valid_privacy_settings_provider(): array {
		return array(
			'public'       => array( \VIDEOPRESS_PRIVACY::IS_PUBLIC ),
			'private'      => array( \VIDEOPRESS_PRIVACY::IS_PRIVATE ),
			'site_default' => array( \VIDEOPRESS_PRIVACY::SITE_DEFAULT ),
		);
	}

	/**
	 * Test that valid privacy_setting values pass schema validation.
	 *
	 * @param int $value The privacy setting value.
	 *
	 * @dataProvider valid_privacy_settings_provider
	 */
	#[DataProvider( 'valid_privacy_settings_provider' )]
	public function test_privacy_setting_accepts_valid_values( int $value ) {
		$schema = array(
			'type' => 'integer',
			'enum' => array(
				\VIDEOPRESS_PRIVACY::IS_PUBLIC,
				\VIDEOPRESS_PRIVACY::IS_PRIVATE,
				\VIDEOPRESS_PRIVACY::SITE_DEFAULT,
			),
		);

		$valid = rest_validate_value_from_schema( $value, $schema, 'privacy_setting' );
		$this->assertTrue( $valid );
	}

	/**
	 * Data provider for invalid privacy_setting values.
	 *
	 * @return array[] Test cases.
	 */
	public static function invalid_privacy_settings_provider(): array {
		return array(
			'negative'     => array( -1 ),
			'out_of_range' => array( 3 ),
			'large_number' => array( 99 ),
		);
	}

	/**
	 * Test that invalid privacy_setting values fail schema validation.
	 *
	 * @param int $value The privacy setting value.
	 *
	 * @dataProvider invalid_privacy_settings_provider
	 */
	#[DataProvider( 'invalid_privacy_settings_provider' )]
	public function test_privacy_setting_rejects_invalid_values( int $value ) {
		$schema = array(
			'type' => 'integer',
			'enum' => array(
				\VIDEOPRESS_PRIVACY::IS_PUBLIC,
				\VIDEOPRESS_PRIVACY::IS_PRIVATE,
				\VIDEOPRESS_PRIVACY::SITE_DEFAULT,
			),
		);

		$valid = rest_validate_value_from_schema( $value, $schema, 'privacy_setting' );
		$this->assertInstanceOf( \WP_Error::class, $valid );
	}

	/**
	 * Test that the privacy_setting schema includes enum constraint.
	 */
	public function test_privacy_setting_has_enum_in_schema() {
		$routes     = rest_get_server()->get_routes();
		$route_data = $routes['/wpcom/v2/videopress/meta'];
		$args       = $route_data[0]['args'];

		$this->assertArrayHasKey( 'enum', $args['privacy_setting'] );
		$this->assertSame(
			array(
				\VIDEOPRESS_PRIVACY::IS_PUBLIC,
				\VIDEOPRESS_PRIVACY::IS_PRIVATE,
				\VIDEOPRESS_PRIVACY::SITE_DEFAULT,
			),
			$args['privacy_setting']['enum']
		);
		$this->assertEquals( 'integer', $args['privacy_setting']['type'] );
	}

	/**
	 * Test that meta route args besides 'id' are optional.
	 */
	public function test_meta_route_args_are_optional() {
		$routes     = rest_get_server()->get_routes();
		$route_data = $routes['/wpcom/v2/videopress/meta'];
		$args       = $route_data[0]['args'];

		$this->assertTrue( $args['id']['required'] );

		$optional_args = array( 'title', 'description', 'caption', 'rating', 'display_embed', 'allow_download', 'privacy_setting' );
		foreach ( $optional_args as $arg_name ) {
			$this->assertArrayHasKey( $arg_name, $args, "Arg '{$arg_name}' should be registered." );
			$this->assertFalse(
				! empty( $args[ $arg_name ]['required'] ),
				"Arg '{$arg_name}' should be optional."
			);
		}
	}

	/**
	 * Data provider for video_guid pattern validation.
	 *
	 * @return array[] Test cases.
	 */
	public static function video_guid_provider(): array {
		return array(
			'valid 8-char alphanumeric' => array( 'AbCd1234', true ),
			'valid all lowercase'       => array( 'abcd1234', true ),
			'valid all uppercase'       => array( 'ABCD1234', true ),
			'valid all digits'          => array( '12345678', true ),
			'too short'                 => array( 'abc1234', false ),
			'too long'                  => array( 'abcd12345', false ),
			'contains special chars'    => array( 'abcd-234', false ),
		);
	}

	/**
	 * Test that video_guid pattern validation works on the playback-jwt route.
	 *
	 * @param string $guid     The GUID to test.
	 * @param bool   $expected Whether validation should pass.
	 *
	 * @dataProvider video_guid_provider
	 */
	#[DataProvider( 'video_guid_provider' )]
	public function test_video_guid_pattern_validation( string $guid, bool $expected ) {
		$routes     = rest_get_server()->get_routes();
		$route_data = $routes['/wpcom/v2/videopress/playback-jwt/(?P<video_guid>\\w+)'];
		$args       = $route_data[0]['args'];

		$pattern = $args['video_guid']['pattern'];

		if ( $expected ) {
			$this->assertMatchesRegularExpression( '/^' . $pattern . '$/', $guid );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/^' . $pattern . '$/', $guid );
		}
	}

	/**
	 * Test that poster route has explicit video_guid arg definition.
	 */
	public function test_poster_route_has_explicit_video_guid_arg() {
		$routes     = rest_get_server()->get_routes();
		$route_data = $routes['/wpcom/v2/videopress/(?P<video_guid>\\w+)/poster'];

		// Shared args are in the route-level 'args' key.
		// Check that at least one endpoint has video_guid defined.
		$has_video_guid = false;
		foreach ( $route_data as $endpoint ) {
			if ( isset( $endpoint['args']['video_guid'] ) ) {
				$has_video_guid = true;
				$this->assertEquals( 'string', $endpoint['args']['video_guid']['type'] );
				$this->assertNotEmpty( $endpoint['args']['video_guid']['pattern'] );
				break;
			}
		}
		$this->assertTrue( $has_video_guid, 'Poster route should have explicit video_guid arg.' );
	}

	/**
	 * Test that check-ownership route has explicit args for both path params.
	 */
	public function test_check_ownership_route_has_explicit_args() {
		$route_key = $this->find_route_key( 'check-ownership' );
		$this->assertNotNull( $route_key, 'Check-ownership route should be registered.' );

		$routes     = rest_get_server()->get_routes();
		$route_data = $routes[ $route_key ];

		$has_video_guid = false;
		$has_post_id    = false;
		foreach ( $route_data as $endpoint ) {
			if ( isset( $endpoint['args']['video_guid'] ) ) {
				$has_video_guid = true;
				$this->assertEquals( 'string', $endpoint['args']['video_guid']['type'] );
				$this->assertNotEmpty( $endpoint['args']['video_guid']['pattern'] );
			}
			if ( isset( $endpoint['args']['post_id'] ) ) {
				$has_post_id = true;
				$this->assertEquals( 'integer', $endpoint['args']['post_id']['type'] );
			}
		}
		$this->assertTrue( $has_video_guid, 'Check-ownership route should have explicit video_guid arg.' );
		$this->assertTrue( $has_post_id, 'Check-ownership route should have explicit post_id arg.' );
	}
}
