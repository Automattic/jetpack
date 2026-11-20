<?php
/**
 * Tests for the Activity Log known-threats route.
 *
 * @package automattic/jetpack-activity-log
 */

namespace Automattic\Jetpack\Activity_Log;

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;
use WP_REST_Server;

/**
 * Covers REST_Controller::get_known_threats().
 *
 * @covers \Automattic\Jetpack\Activity_Log\REST_Controller
 */
#[CoversClass( REST_Controller::class )]
class Known_Threats_Route_Test extends TestCase {

	const BLOG_ID = 999;

	/**
	 * URLs of the requests sent to WordPress.com.
	 *
	 * @var string[]
	 */
	private $captured_urls = array();

	protected function setUp(): void {
		parent::setUp();

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'admin_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
		add_filter( 'jetpack_options', array( $this, 'mock_connection_options' ), 10, 2 );
		Connection_Utils::init_default_constants();
	}

	protected function tearDown(): void {
		remove_filter( 'jetpack_options', array( $this, 'mock_connection_options' ) );
		remove_all_filters( 'pre_http_request' );
		Constants::clear_constants();
		Status_Cache::clear();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		$this->captured_urls = array();
		parent::tearDown();
	}

	public function test_known_threats_are_unavailable_off_wow() {
		$this->arrange_wpcom( array( 'backups' => array() ) );

		$result = REST_Controller::get_known_threats();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'threats_unavailable', $result->get_error_code() );
		$this->assertSame( 404, $result->get_error_data()['status'] );
		$this->assertSame( array(), $this->captured_urls );
	}

	public function test_known_threats_list_every_backup_with_its_counts() {
		$flagged = array(
			'malware'    => 3,
			'database'   => 0,
			'vulnerable' => 1,
			'ignored'    => 0,
			'flagged'    => 3,
			'fixed'      => 3,
		);
		$this->arrange_woa_site();
		$this->arrange_wpcom(
			array(
				'totalPages' => 1,
				'backups'    => array(
					array(
						'object' => array(
							'backup_period' => '1792244435',
							'known_threats' => $flagged,
						),
					),
					array(
						'object' => array(
							'backup_period' => '1792248001',
							'known_threats' => array_merge(
								$flagged,
								array(
									'malware' => 0,
									'flagged' => 0,
								)
							),
						),
					),
					array( 'object' => array( 'backup_period' => '1792300000' ) ),
				),
			)
		);

		$result = REST_Controller::get_known_threats();

		$this->assertSame(
			array(
				'backups' => array(
					array(
						'period'        => 1792244435,
						'known_threats' => $flagged,
					),
					array(
						'period'        => 1792248001,
						'known_threats' => array_merge(
							$flagged,
							array(
								'malware' => 0,
								'flagged' => 0,
							)
						),
					),
					array(
						'period'        => 1792300000,
						'known_threats' => null,
					),
				),
			),
			$result->get_data()
		);
		$this->assertCount( 1, $this->captured_urls );
		$this->assertStringContainsString( '/wpcom/v3/sites/' . self::BLOG_ID . '/rewind/backups?number=100&page=1&known_threats_only=true', $this->captured_urls[0] );
	}

	public function test_known_threats_are_unavailable_without_scan() {
		$this->arrange_woa_site();
		$this->arrange_wpcom( array( 'code' => 'scan_required' ), 403 );

		$result = REST_Controller::get_known_threats();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'threats_unavailable', $result->get_error_code() );
	}

	public function test_known_threats_route_is_registered() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( REST_Controller::class, 'register_rest_routes' ) );
		do_action( 'rest_api_init', $wp_rest_server );
		remove_action( 'rest_api_init', array( REST_Controller::class, 'register_rest_routes' ) );

		$this->assertArrayHasKey( '/jetpack/v4/activity-log/known-threats', $wp_rest_server->get_routes() );
	}

	/**
	 * Failures other than a missing Scan plan are reported as failures, not as "unavailable".
	 *
	 * @dataProvider provide_upstream_failures
	 */
	#[DataProvider( 'provide_upstream_failures' )]
	public function test_known_threats_report_upstream_failures( $failure ) {
		$this->arrange_woa_site();
		if ( 'unreachable' === $failure ) {
			add_filter(
				'pre_http_request',
				static function () {
					return new WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out' );
				}
			);
		} elseif ( 'unreadable' === $failure ) {
			$this->arrange_wpcom( '<html>Bad gateway</html>' );
		} else {
			$this->arrange_wpcom( array( 'code' => 'internal_error' ), 500 );
		}

		$result = REST_Controller::get_known_threats();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'known_threats_request_failed', $result->get_error_code() );
		$this->assertSame( 502, $result->get_error_data()['status'] );
	}

	/**
	 * Ways WordPress.com can fail to answer.
	 *
	 * @return array
	 */
	public static function provide_upstream_failures() {
		return array(
			'unreachable'    => array( 'unreachable' ),
			'server error'   => array( 'server error' ),
			'unreadable 200' => array( 'unreadable' ),
		);
	}

	public function test_known_threats_skip_rows_without_a_backup_period() {
		$this->arrange_woa_site();
		$this->arrange_wpcom(
			array(
				'backups' => array(
					array( 'object' => array() ),
					array( 'object' => array( 'backup_period' => 'soon' ) ),
					array( 'object' => array( 'backup_period' => '1792247305' ) ),
				),
			)
		);

		$result = REST_Controller::get_known_threats();

		$this->assertSame( array( 1792247305 ), array_column( $result->get_data()['backups'], 'period' ) );
	}

	/**
	 * Makes the site look like a WoA site to `Host::is_woa_site()`.
	 */
	private function arrange_woa_site() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 2 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/wpcomsh/wpcomsh.php' );
		Status_Cache::clear();
	}

	/**
	 * Has WordPress.com answer every request with the given body and status.
	 *
	 * @param array|string $body   Response body; a string is sent as is.
	 * @param int          $status Response status.
	 */
	private function arrange_wpcom( $body, $status = 200 ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $body, $status ) {
				$this->captured_urls[] = (string) $url;
				return array(
					'response' => array( 'code' => $status ),
					'body'     => is_string( $body ) ? $body : wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * Connection options for a site with a connected admin.
	 *
	 * @param mixed  $value Option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function mock_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'test.blogtoken';
			case 'id':
				return (string) self::BLOG_ID;
			case 'user_tokens':
				$user_id = get_current_user_id();
				return $user_id ? array( $user_id => sprintf( 'token%d.secret%d.%d', $user_id, $user_id, $user_id ) ) : $value;
		}
		return $value;
	}
}
