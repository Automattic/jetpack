<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_VideoPress route registration and argument validation.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Server;

/**
 * Validates that REST route schemas correctly enforce argument constraints.
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress_Test extends BaseTestCase {

	/**
	 * Full route keys used across tests.
	 */
	private const ROUTE_META            = '/wpcom/v2/videopress/meta';
	private const ROUTE_POSTER          = '/wpcom/v2/videopress/(?P<video_guid>[A-Za-z0-9]{8})/poster';
	private const ROUTE_CHECK_OWNERSHIP = '/wpcom/v2/videopress/(?P<video_guid>[A-Za-z0-9]{8})/check-ownership/(?P<post_id>\d+)';
	private const ROUTE_UPLOAD_JWT      = '/wpcom/v2/videopress/upload-jwt';
	private const ROUTE_PLAYBACK_JWT    = '/wpcom/v2/videopress/playback-jwt/(?P<video_guid>[A-Za-z0-9]{8})';
	private const ROUTE_SETTINGS        = '/wpcom/v2/videopress/settings';

	/**
	 * Set up the test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

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

		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'master_user' );
		\Jetpack_Options::delete_option( 'user_tokens' );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Create a user with the given role and set them as the current user.
	 *
	 * @param string $role WP role slug.
	 * @return int The user ID.
	 */
	private function login_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'settings_' . $role,
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
		return $user_id;
	}

	/**
	 * Mock a Jetpack connection with a connected owner, so that
	 * Data::can_perform_action() passes off-WPCOM.
	 *
	 * @param int $user_id The user to connect and mark as connection owner.
	 */
	private function mock_connection( $user_id ) {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		( new Tokens() )->update_user_token( $user_id, sprintf( 'key.private.%d', $user_id ), false );
		// Manager::$is_connected is a static cache whose option-update
		// invalidation hooks don't survive WorDBless's between-test hook reset;
		// an earlier test that saw "not connected" would otherwise stick.
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Test that all expected REST routes are registered.
	 */
	public function test_routes_are_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE_META, $routes );
		$this->assertArrayHasKey( self::ROUTE_POSTER, $routes );
		$this->assertArrayHasKey( self::ROUTE_CHECK_OWNERSHIP, $routes );
		$this->assertArrayHasKey( self::ROUTE_UPLOAD_JWT, $routes );
		$this->assertArrayHasKey( self::ROUTE_PLAYBACK_JWT, $routes );
		$this->assertArrayHasKey( self::ROUTE_SETTINGS, $routes );
	}

	/**
	 * Test that the settings GET callback returns the full settings shape.
	 */
	public function test_get_settings_returns_settings_shape() {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_VideoPress();
		$response = $endpoint->videopress_get_settings();
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'videopress_videos_private_for_site', $data );
		$this->assertArrayHasKey( 'videopress_auto_subtitles_disabled', $data );
		$this->assertArrayHasKey( 'site_is_private', $data );
		$this->assertArrayHasKey( 'site_type', $data );
	}

	/**
	 * Test that the settings POST callback persists both options off-WPCOM
	 * (mirroring videopress/v1/settings; on WPCOM the private-for-site
	 * option is ignored, but IS_WPCOM can't be simulated in this env).
	 */
	public function test_update_settings_persists_options() {
		delete_option( 'videopress_private_enabled_for_site' );
		delete_option( 'videopress_auto_subtitles_disabled' );

		$request = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$request->set_param( 'videopress_videos_private_for_site', true );
		$request->set_param( 'videopress_auto_subtitles_disabled', true );

		$endpoint = new WPCOM_REST_API_V2_Endpoint_VideoPress();
		$response = $endpoint->videopress_update_settings( $request );

		$this->assertSame( 'success', $response->get_data()['code'] );
		// Off-WPCOM every supplied param is honored, so nothing is reported ignored.
		$this->assertArrayNotHasKey( 'ignored', $response->get_data() );
		$this->assertTrue( (bool) get_option( 'videopress_private_enabled_for_site' ) );
		$this->assertTrue( (bool) get_option( 'videopress_auto_subtitles_disabled' ) );
	}

	/**
	 * Test that omitted settings params leave the stored options untouched.
	 */
	public function test_update_settings_ignores_absent_params() {
		update_option( 'videopress_private_enabled_for_site', true );
		update_option( 'videopress_auto_subtitles_disabled', false );

		$request = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$request->set_param( 'videopress_auto_subtitles_disabled', true );

		$endpoint = new WPCOM_REST_API_V2_Endpoint_VideoPress();
		$endpoint->videopress_update_settings( $request );

		$this->assertTrue( (bool) get_option( 'videopress_private_enabled_for_site' ) );
		$this->assertTrue( (bool) get_option( 'videopress_auto_subtitles_disabled' ) );
	}

	/**
	 * The settings routes' permission callbacks, exercised through dispatch —
	 * calling the route callbacks directly (as the tests above do) never runs
	 * them. GET requires manage_options; POST additionally requires
	 * Data::can_perform_action() (a connected owner + user, off-WPCOM).
	 */
	public function test_settings_get_dispatch_requires_authentication() {
		wp_set_current_user( 0 );

		$request  = new \WP_REST_Request( 'GET', self::ROUTE_SETTINGS );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Test that a logged-in user without manage_options gets a 403 on GET.
	 */
	public function test_settings_get_dispatch_rejects_non_admins() {
		$this->login_as( 'subscriber' );

		$request  = new \WP_REST_Request( 'GET', self::ROUTE_SETTINGS );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Test that an administrator can GET the settings through dispatch.
	 */
	public function test_settings_get_dispatch_allows_admins() {
		$this->login_as( 'administrator' );

		$request  = new \WP_REST_Request( 'GET', self::ROUTE_SETTINGS );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'videopress_videos_private_for_site', $response->get_data() );
	}

	/**
	 * Test that a logged-out POST is rejected with a 401.
	 */
	public function test_settings_post_dispatch_requires_authentication() {
		wp_set_current_user( 0 );

		$request  = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Test that even an administrator can't POST without a Jetpack
	 * connection off-WPCOM: the Data::can_perform_action() term of the
	 * permission callback requires a connected owner and user.
	 */
	public function test_settings_post_dispatch_rejects_unconnected_admin() {
		$this->login_as( 'administrator' );

		$request = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$request->set_param( 'videopress_auto_subtitles_disabled', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Test that a connected administrator can POST through dispatch and the
	 * option persists.
	 */
	public function test_settings_post_dispatch_allows_connected_admin() {
		delete_option( 'videopress_auto_subtitles_disabled' );
		$user_id = $this->login_as( 'administrator' );
		$this->mock_connection( $user_id );

		$request = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$request->set_param( 'videopress_auto_subtitles_disabled', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'success', $response->get_data()['code'] );
		$this->assertTrue( (bool) get_option( 'videopress_auto_subtitles_disabled' ) );
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
	 * Test that valid privacy_setting values pass the registered schema validation.
	 *
	 * @param int $value The privacy setting value.
	 *
	 * @dataProvider valid_privacy_settings_provider
	 */
	#[DataProvider( 'valid_privacy_settings_provider' )]
	public function test_privacy_setting_accepts_valid_values( int $value ) {
		$routes = rest_get_server()->get_routes();
		$schema = $routes[ self::ROUTE_META ][0]['args']['privacy_setting'];

		$this->assertTrue( rest_validate_value_from_schema( $value, $schema, 'privacy_setting' ) );
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
	 * Test that invalid privacy_setting values fail the registered schema validation.
	 *
	 * @param int $value The privacy setting value.
	 *
	 * @dataProvider invalid_privacy_settings_provider
	 */
	#[DataProvider( 'invalid_privacy_settings_provider' )]
	public function test_privacy_setting_rejects_invalid_values( int $value ) {
		$routes = rest_get_server()->get_routes();
		$schema = $routes[ self::ROUTE_META ][0]['args']['privacy_setting'];

		$this->assertInstanceOf( \WP_Error::class, rest_validate_value_from_schema( $value, $schema, 'privacy_setting' ) );
	}

	/**
	 * Test that meta route args besides 'id' are optional.
	 */
	public function test_meta_route_args_are_optional() {
		$routes = rest_get_server()->get_routes();
		$args   = $routes[ self::ROUTE_META ][0]['args'];

		$this->assertTrue( $args['id']['required'] );

		$optional_args = array( 'title', 'description', 'caption', 'rating', 'display_embed', 'allow_download', 'privacy_setting' );
		foreach ( $optional_args as $arg_name ) {
			$this->assertArrayHasKey( $arg_name, $args, "Arg '{$arg_name}' should be registered." );
			$this->assertEmpty( $args[ $arg_name ]['required'] ?? false, "Arg '{$arg_name}' should be optional." );
		}
	}

	/**
	 * Test that poster route has video_guid arg with correct type.
	 */
	public function test_poster_route_has_video_guid_schema() {
		$routes = rest_get_server()->get_routes();
		$args   = $routes[ self::ROUTE_POSTER ][0]['args'];

		$this->assertArrayHasKey( 'video_guid', $args );
		$this->assertSame( 'string', $args['video_guid']['type'] );
	}

	/**
	 * Test that the route regex rejects invalid video GUIDs.
	 */
	public function test_route_rejects_invalid_video_guid() {
		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/playback-jwt/too-long-guid' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * Test that the route regex accepts a valid video GUID.
	 */
	public function test_route_accepts_valid_video_guid() {
		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/playback-jwt/AbCd1234' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertNotEquals( 404, $response->get_status() );
	}

	/**
	 * Test that check-ownership route has schemas for both path params.
	 */
	public function test_check_ownership_route_has_path_param_schemas() {
		$routes = rest_get_server()->get_routes();
		$args   = $routes[ self::ROUTE_CHECK_OWNERSHIP ][0]['args'];

		$this->assertArrayHasKey( 'video_guid', $args );
		$this->assertSame( 'string', $args['video_guid']['type'] );

		$this->assertArrayHasKey( 'post_id', $args );
		$this->assertSame( 'integer', $args['post_id']['type'] );
	}
}
