<?php
/**
 * Tests for Site_State_Controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Site_State_Controller
 */
#[CoversClass( Site_State_Controller::class )]
class Site_State_Controller_Test extends BaseTestCase {

	const ROUTE = '/jetpack-premium-analytics/v1/site/has-never-published-post';

	/**
	 * Controller under test.
	 *
	 * @var Site_State_Controller
	 */
	private $controller;

	/**
	 * Published post counts by post type.
	 *
	 * @var array<string, int>
	 */
	private $published_counts = array(
		'post' => 0,
		'page' => 0,
	);

	/**
	 * Set up the controller and a fresh REST server.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new Site_State_Controller();
		add_filter( 'wp_count_posts', array( $this, 'filter_post_counts' ), 10, 2 );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	public function tear_down() {
		remove_filter( 'wp_count_posts', array( $this, 'filter_post_counts' ), 10 );
		parent::tear_down();
	}

	public function test_registers_read_route() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertArrayHasKey( 'GET', $routes[ self::ROUTE ][0]['methods'] );
		$this->assertSame( array( $this->controller, 'has_never_published_post' ), $routes[ self::ROUTE ][0]['callback'] );
		$this->assertSame( array( $this->controller, 'check_permission' ), $routes[ self::ROUTE ][0]['permission_callback'] );
	}

	public function test_permission_granted_for_view_stats_capability() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_site_state_viewer',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$user    = new \WP_User( $user_id );
		$user->add_cap( 'view_stats' );
		wp_set_current_user( $user_id );

		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_permission_granted_for_administrator() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_site_state_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_permission_denied_for_anonymous_user() {
		wp_set_current_user( 0 );

		$this->assertFalse( $this->controller->check_permission() );
	}

	public function test_returns_true_when_no_posts_or_pages_have_been_published() {
		$this->assertTrue( $this->controller->has_never_published_post() );
	}

	public function test_returns_false_when_a_post_has_been_published() {
		$this->published_counts['post'] = 1;

		$this->assertFalse( $this->controller->has_never_published_post() );
	}

	public function test_returns_false_when_a_page_has_been_published() {
		$this->published_counts['page'] = 1;

		$this->assertFalse( $this->controller->has_never_published_post() );
	}

	public function test_dispatch_returns_boolean_response() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_site_state_dispatch_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data() );
	}

	public function filter_post_counts( $counts, $post_type ) {
		if ( isset( $this->published_counts[ $post_type ] ) ) {
			$counts->publish = $this->published_counts[ $post_type ];
		}

		return $counts;
	}
}
