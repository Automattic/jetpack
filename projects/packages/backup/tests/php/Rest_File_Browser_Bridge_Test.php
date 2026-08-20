<?php
/**
 * Unit tests for File_Browser_Bridge.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
use function add_action;
use function add_filter;
use function do_action;
use function remove_filter;
use function wp_insert_user;
use function wp_set_current_user;

require_once __DIR__ . '/trait-wpcom-request-mock.php';

/**
 * Tests for the /jetpack/v4/rewind/backup/* routes.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\File_Browser_Bridge
 */
#[CoversClass( File_Browser_Bridge::class )]
class Rest_File_Browser_Bridge_Test extends TestCase {

	use Wpcom_Request_Mock;

	/**
	 * REST Server.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Enable modernization, register routes, and prepare a fresh REST server.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		add_action( 'rest_api_init', array( Rest_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Reset state.
	 */
	public function tearDown(): void {
		remove_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		$this->reset_wpcom_request_mock();

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * The ls route registers when the modernization filter is on.
	 */
	public function test_ls_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/rewind/backup/ls', $routes );
	}

	/**
	 * The file-content route registers when the modernization filter is on.
	 */
	public function test_file_content_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/rewind/backup/file-content', $routes );
	}

	/**
	 * Routes are gated on manage_options — a subscriber gets 403.
	 */
	public function test_routes_require_manage_options() {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subscriber_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backup/file-content' );
		$request->set_param( 'file_period', '123' );
		$request->set_param( 'encoded_manifest_path', 'abc' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}
	/**
	 * A transport failure on the directory listing surfaces as the
	 * bridge's own error rather than cURL's text.
	 *
	 * This one goes through `forward_response()`, which every
	 * pass-through bridge shares, so it covers the shared path.
	 */
	public function test_list_directory_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/123/ls' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'path', '/' );
		$response = File_Browser_Bridge::list_directory( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertStringNotContainsString( 'cURL', $response->get_error_message() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}

	/**
	 * The signed-URL leg wraps a transport failure too.
	 *
	 * Worth covering separately from the listing: the file-content
	 * callback makes two outbound calls, and only the first is reached
	 * when WPCOM is unreachable.
	 */
	public function test_file_content_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/123/file-content' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'encoded_manifest_path', 'ZjU6L3dwLWNvbmZpZy5waHA=' );
		$response = File_Browser_Bridge::get_file_content( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'backup_file_content_url_failed', $response->get_error_code() );
		$this->assertStringNotContainsString( 'cURL', $response->get_error_message() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}
}
