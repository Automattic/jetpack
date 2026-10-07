<?php
/**
 * Unit tests for Backup_Sizes_Bridge.
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

require_once __DIR__ . '/trait-wpcom-request-mock.php';

/**
 * Tests for the GET /jetpack/v4/backups/sizes route.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Backup_Sizes_Bridge
 */
#[CoversClass( Backup_Sizes_Bridge::class )]
class Rest_Backup_Sizes_Bridge_Test extends TestCase {

	use Wpcom_Request_Mock;

	/**
	 * Enable modernization and register routes on a fresh REST server.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

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
	 * Only v3 carries a size per backup, and it answers a bare `[]` above 100 per page.
	 */
	public function test_asks_v3_for_the_largest_page_it_serves() {
		$this->arrange_wpcom( array( 'backups' => array() ) );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/sizes' );
		$request->set_param( 'page', 3 );

		$response = Backup_Sizes_Bridge::get_backup_sizes( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertStringContainsString( '/wpcom/v3/sites/', $this->captured_url );
		$this->assertStringContainsString( '/rewind/backups?number=100&page=3', $this->captured_url );
	}
}
