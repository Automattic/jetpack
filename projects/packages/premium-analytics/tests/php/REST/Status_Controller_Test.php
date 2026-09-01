<?php
/**
 * Tests for Status_Controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\PremiumAnalytics\Analytics;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Status_Controller
 */
#[CoversClass( Status_Controller::class )]
class Status_Controller_Test extends BaseTestCase {

	const ROUTE = '/wpcom/v2/premium-analytics/status';

	/**
	 * Controller under test.
	 *
	 * @var Status_Controller
	 */
	private $controller;

	/**
	 * Set up the controller and a fresh REST server.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new Status_Controller();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Drop the option and any faked authentication state.
	 */
	public function tear_down() {
		delete_option( Analytics::ENABLED_OPTION );
		self::set_rest_authentication( null, null );
		self::set_analytics_initialized( false );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Put the Rest_Authentication singleton into a given signed state.
	 *
	 * Both properties are private and only ever set by a real signature check, so reflection is
	 * the only way to stand in for a signed request without mocking the connection manager.
	 *
	 * @param bool|null   $status Authentication status.
	 * @param string|null $type   Authentication type, 'blog' or 'user'.
	 * @return void
	 */
	private static function set_rest_authentication( $status, $type ): void {
		$instance = Rest_Authentication::init();

		$values = array(
			'rest_authentication_status' => $status,
			'rest_authentication_type'   => $type,
		);

		foreach ( $values as $name => $value ) {
			$property = new \ReflectionProperty( Rest_Authentication::class, $name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( $instance, $value );
		}
	}

	/**
	 * Make the current user an administrator.
	 *
	 * @return int User ID.
	 */
	private function log_in_as_admin(): int {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'pa-admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	public function test_registers_status_route_with_read_and_write_methods() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( self::ROUTE, $routes );

		$methods = array();
		foreach ( $routes[ self::ROUTE ] as $handler ) {
			$methods += $handler['methods'];
		}
		$this->assertArrayHasKey( 'GET', $methods );
		$this->assertArrayHasKey( 'POST', $methods );
	}

	public function test_permission_is_denied_without_a_user_or_a_blog_token() {
		$this->assertInstanceOf( \WP_Error::class, $this->controller->check_permission() );
	}

	public function test_permission_is_denied_for_a_user_who_cannot_manage_options() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'pa-editor',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$this->assertInstanceOf( \WP_Error::class, $this->controller->check_permission() );
	}

	public function test_permission_is_granted_to_an_administrator() {
		$this->log_in_as_admin();

		$this->assertTrue( $this->controller->check_permission() );
	}

	/**
	 * WordPress.com drives a rollout with a blog token, where there is no user at all.
	 */
	public function test_permission_is_granted_to_a_blog_token_with_no_user() {
		self::set_rest_authentication( true, 'blog' );

		$this->assertTrue( $this->controller->check_permission() );
	}

	/**
	 * A user token alone is not enough — the user behind it still has to administer the site.
	 */
	public function test_permission_is_denied_for_a_user_token_without_the_capability() {
		self::set_rest_authentication( true, 'user' );

		$this->assertInstanceOf( \WP_Error::class, $this->controller->check_permission() );
	}

	public function test_post_enables_the_dashboard_by_writing_the_option() {
		$this->log_in_as_admin();

		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'enabled', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'enabled' => true ), $response->get_data() );
		$this->assertTrue( (bool) get_option( Analytics::ENABLED_OPTION ) );
	}

	public function test_post_disables_the_dashboard_by_writing_the_option() {
		$this->log_in_as_admin();
		update_option( Analytics::ENABLED_OPTION, 1 );

		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'enabled', false );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'enabled' => false ), $response->get_data() );
		$this->assertFalse( (bool) get_option( Analytics::ENABLED_OPTION ) );
	}

	public function test_post_is_rejected_without_the_enabled_parameter() {
		$this->log_in_as_admin();

		$request  = new WP_REST_Request( 'POST', self::ROUTE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	public function test_post_is_rejected_for_a_user_who_cannot_manage_options() {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'enabled', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( rest_authorization_required_code(), $response->get_status() );
		$this->assertFalse( (bool) get_option( Analytics::ENABLED_OPTION ) );
	}

	/**
	 * A site switched on by the rollout sticker leaves the option untouched, so the read has to
	 * follow the host's decision rather than the option.
	 */
	public function test_get_reports_enabled_when_the_host_booted_the_dashboard() {
		$this->log_in_as_admin();
		self::set_analytics_initialized( true );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'enabled' => true ), $response->get_data() );
	}

	/**
	 * The mirror case: the option is set but the host never booted the dashboard — the package was
	 * missing, or the write landed after the flag had already been resolved for this request.
	 */
	public function test_get_reports_disabled_when_the_option_is_set_but_the_host_did_not_boot() {
		$this->log_in_as_admin();
		update_option( Analytics::ENABLED_OPTION, 1 );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'enabled' => false ), $response->get_data() );
	}

	/**
	 * Stand in for one of the Analytics init entry points having run.
	 *
	 * @param bool $initialized Whether the dashboard booted.
	 * @return void
	 */
	private static function set_analytics_initialized( bool $initialized ): void {
		$property = new \ReflectionProperty( Analytics::class, 'initialized' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $initialized );
	}
}
