<?php
/**
 * Tests for Settings_Controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Stats\Options as Stats_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use ReflectionProperty;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Settings_Controller
 */
#[CoversClass( Settings_Controller::class )]
class Settings_Controller_Test extends BaseTestCase {

	const ROUTE = '/jetpack-premium-analytics/v1/settings';

	/**
	 * Register the route on a fresh REST server.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( new Settings_Controller(), 'register_routes' ) );
		do_action( 'rest_api_init' );
		$this->reset_stats_options();
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		$this->reset_stats_options();
		parent::tear_down();
	}

	public function test_read_names_no_modules_screen_without_the_jetpack_plugin() {
		wp_set_current_user( $this->create_user( 'administrator' ) );

		$this->assertNull( $this->dispatch( 'GET' )->get_data()['modules_url'] );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_read_links_to_the_modules_screen_with_the_jetpack_plugin() {
		require_once __DIR__ . '/../mocks/jetpack-plugin-mock.php';
		wp_set_current_user( $this->create_user( 'administrator' ) );

		$this->assertSame( admin_url( 'admin.php?page=jetpack_modules' ), $this->dispatch( 'GET' )->get_data()['modules_url'] );
	}

	public function test_save_changes_who_can_view_and_whose_views_count() {
		wp_set_current_user( $this->create_user( 'administrator' ) );

		$response = $this->dispatch(
			'POST',
			array(
				'admin_bar'   => false,
				'roles'       => array( 'administrator', 'editor' ),
				'count_roles' => array( 'editor' ),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( Stats_Options::get_option( 'admin_bar' ) );
		$this->assertSame( array( 'administrator', 'editor' ), Stats_Options::get_option( 'roles' ) );
		$this->assertSame( array( 'editor' ), Stats_Options::get_option( 'count_roles' ) );
	}

	public function test_save_refused_for_editor_who_can_view_stats() {
		wp_set_current_user( $this->create_user( 'editor' ) );
		$grant_view_stats = static function ( $caps ) {
			$caps['view_stats'] = true;
			return $caps;
		};
		add_filter( 'user_has_cap', $grant_view_stats );

		$response = $this->dispatch( 'POST', array( 'roles' => array( 'administrator', 'editor' ) ) );
		remove_filter( 'user_has_cap', $grant_view_stats );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( array( 'administrator' ), Stats_Options::get_option( 'roles' ) );
	}

	/**
	 * Drop the stats options `Options` memoizes, which outlive the cleared database.
	 */
	private function reset_stats_options() {
		$options = new ReflectionProperty( Stats_Options::class, 'options' );
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
	 * Send a request to the settings route.
	 *
	 * @param string $method GET or POST.
	 * @param array  $body   JSON body for a POST.
	 * @return \WP_REST_Response
	 */
	private function dispatch( $method, $body = array() ) {
		$request = new WP_REST_Request( $method, self::ROUTE );
		if ( $body ) {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}

		return rest_get_server()->dispatch( $request );
	}
}
