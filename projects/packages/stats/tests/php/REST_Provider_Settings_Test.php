<?php

namespace Automattic\Jetpack\Stats;

use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionProperty;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for the `/jetpack/v4/stats/settings` route.
 *
 * @package automattic/jetpack-stats
 * @covers \Automattic\Jetpack\Stats\REST_Provider
 * @covers \Automattic\Jetpack\Stats\Settings_Screen
 */
#[CoversClass( REST_Provider::class )]
#[CoversClass( Settings_Screen::class )]
class REST_Provider_Settings_Test extends StatsBaseTestCase {
	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Set up before each test.
	 */
	protected function set_up() {
		parent::set_up();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		REST_Provider::init( true );
		do_action( 'rest_api_init' );
		$this->reset_stats_options();
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		parent::tear_down();
		$this->reset_stats_options();
	}

	public function test_read_returns_the_values_and_the_site_roles() {
		wp_set_current_user( $this->create_user( 'administrator' ) );

		$response = $this->dispatch_settings_request( 'GET' );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( array( 'admin_bar', 'roles', 'count_roles', 'wpcom_reader_views_enabled' ), array_keys( $data['settings'] ) );
		$this->assertContains( 'editor', wp_list_pluck( $data['roles'], 'slug' ) );
	}

	public function test_read_names_no_modules_screen_without_the_jetpack_plugin() {
		wp_set_current_user( $this->create_user( 'administrator' ) );

		$response = $this->dispatch_settings_request( 'GET' );

		$this->assertNull( $response->get_data()['modules_url'] );
	}

	public function test_save_changes_who_can_view_and_whose_views_count() {
		wp_set_current_user( $this->create_user( 'administrator' ) );

		$response = $this->dispatch_settings_request(
			'POST',
			array(
				'admin_bar'   => false,
				'roles'       => array( 'administrator', 'editor' ),
				'count_roles' => array( 'editor' ),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( Options::get_option( 'admin_bar' ) );
		$this->assertSame( array( 'administrator', 'editor' ), Options::get_option( 'roles' ) );
		$this->assertSame( array( 'editor' ), Options::get_option( 'count_roles' ) );
	}

	public function test_save_refused_for_editor_who_can_view_stats() {
		wp_set_current_user( $this->create_user( 'editor' ) );
		$grant_view_stats = static function ( $caps ) {
			$caps['view_stats'] = true;
			return $caps;
		};
		add_filter( 'user_has_cap', $grant_view_stats );

		$response = $this->dispatch_settings_request( 'POST', array( 'roles' => array( 'administrator', 'editor' ) ) );
		remove_filter( 'user_has_cap', $grant_view_stats );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( array( 'administrator' ), Options::get_option( 'roles' ) );
	}

	/**
	 * Drop the stats options `Options` memoizes, which outlive the cleared database.
	 */
	private function reset_stats_options() {
		$options = new ReflectionProperty( Options::class, 'options' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$options->setAccessible( true );
		}
		$options->setValue( null, array() );
	}

	/**
	 * Create a user with a role.
	 *
	 * @param string $role The role.
	 * @return int The user ID.
	 */
	private function create_user( $role ) {
		return wp_insert_user(
			array(
				'user_login' => 'stats_' . $role,
				'user_pass'  => 'pass',
				'role'       => $role,
			)
		);
	}

	/**
	 * Send a request to the Stats settings route.
	 *
	 * @param string $method GET or POST.
	 * @param array  $body   JSON body for a POST.
	 * @return \WP_REST_Response
	 */
	private function dispatch_settings_request( $method, $body = array() ) {
		$request = new WP_REST_Request( $method, '/jetpack/v4/stats/settings' );
		if ( $body ) {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}

		return $this->server->dispatch( $request );
	}
}
