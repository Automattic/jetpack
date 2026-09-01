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
	 * Set up a fresh REST server with the controller's routes.
	 */
	public function set_up() {
		parent::set_up();
		self::set_rest_authentication( null, null );
		self::set_analytics_initialized( false );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		Status_Controller::register();
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
		$this->assertInstanceOf( \WP_Error::class, Status_Controller::check_permission() );
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

		$this->assertInstanceOf( \WP_Error::class, Status_Controller::check_permission() );
	}

	public function test_permission_is_granted_to_an_administrator() {
		$this->log_in_as_admin();

		$this->assertTrue( Status_Controller::check_permission() );
	}

	/**
	 * WordPress.com drives a rollout with a blog token, where there is no user at all.
	 */
	public function test_permission_is_granted_to_a_blog_token_with_no_user() {
		self::set_rest_authentication( true, 'blog' );

		$this->assertTrue( Status_Controller::check_permission() );
	}

	/**
	 * A user token alone is not enough — the user behind it still has to administer the site.
	 */
	public function test_permission_is_denied_for_a_user_token_without_the_capability() {
		self::set_rest_authentication( true, 'user' );

		$this->assertInstanceOf( \WP_Error::class, Status_Controller::check_permission() );
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

	public function test_post_is_rejected_for_an_anonymous_caller() {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'enabled', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
		$this->assertFalse( (bool) get_option( Analytics::ENABLED_OPTION ) );
	}

	public function test_post_is_rejected_for_a_logged_in_user_who_cannot_manage_options() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'pa-editor-post',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'enabled', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertFalse( (bool) get_option( Analytics::ENABLED_OPTION ) );
	}

	/**
	 * Two hosts call register(), so a second call must not add a second callback - otherwise one
	 * rest_api_init would register the route twice and double its handlers.
	 */
	public function test_register_is_idempotent() {
		Status_Controller::register();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'rest_api_init' );

		$this->assertCount( 2, rest_get_server()->get_routes()[ self::ROUTE ] );
	}

	public function test_get_reports_the_stored_opt_in() {
		$this->log_in_as_admin();
		update_option( Analytics::ENABLED_OPTION, 1 );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'enabled' => true ), $response->get_data() );
	}

	public function test_get_reports_disabled_when_the_site_has_not_opted_in() {
		$this->log_in_as_admin();

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'enabled' => false ), $response->get_data() );
	}

	/**
	 * The read must not depend on whether the package booted this request: on WordPress.com Simple
	 * that answer is resolved before public-api switches to the target blog.
	 */
	public function test_get_ignores_whether_the_package_booted_this_request() {
		$this->log_in_as_admin();
		self::set_analytics_initialized( true );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) );

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
