<?php
/**
 * Tests for Debug_REST_Controller.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Send\Debug_REST_Controller
 */
#[CoversClass( Debug_REST_Controller::class )]
class Debug_REST_Controller_Test extends BaseTestCase {

	/**
	 * REST server.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The fake database.
	 *
	 * @var Fake_Db
	 */
	private $db;

	/**
	 * Register the routes, schema 4.
	 */
	public function set_up() {
		parent::set_up();
		wp_cache_flush();
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;
		add_action( 'rest_api_init', array( Debug_REST_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init', $this->server );
		update_option( Email_Log::DB_VERSION_OPTION, '4' );
		$this->db = new Fake_Db();
	}

	/**
	 * Reset globals.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );
		$this->db->remove();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Dispatch a request as a user with a role.
	 *
	 * @param string $role   Role.
	 * @param string $method Method.
	 * @param string $route  Route under the namespace.
	 * @param array  $params Params.
	 * @return \WP_REST_Response
	 */
	private function request( $role, $method, $route, array $params = array() ) {
		$user = get_user_by( 'login', $role . '_user' );
		wp_set_current_user(
			$user ? $user->ID : wp_insert_user(
				array(
					'user_login' => $role . '_user',
					'user_pass'  => 'pass',
					'role'       => $role,
				)
			)
		);
		$request = new WP_REST_Request( $method, '/jetpack-send/v1' . $route );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}
		return $this->server->dispatch( $request );
	}

	/**
	 * Every route.
	 *
	 * @return array[]
	 */
	public static function provide_routes() {
		return array(
			'list'  => array( 'GET', '/debug-log' ),
			'entry' => array( 'GET', '/debug-log/3' ),
			'text'  => array( 'GET', '/debug-log/text' ),
			'clear' => array( 'POST', '/debug-log/clear' ),
		);
	}

	/**
	 * @dataProvider provide_routes
	 *
	 * @param string $method Method.
	 * @param string $route  Route.
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_routes_require_manage_options( $method, $route ) {
		$this->assertSame( 403, $this->request( 'editor', $method, $route )->get_status() );
	}

	public function test_the_list_filters_by_level_area_email_and_words() {
		$response = $this->request(
			'administrator',
			'GET',
			'/debug-log',
			array(
				'level'  => 'error,warning',
				'area'   => array( 'sending' ),
				'email'  => 12,
				'search' => 'lockdown',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringContainsString( "WHERE 1=1 AND level IN ('error','warning') AND area IN ('sending') AND log_id = 12 AND ( message LIKE '%lockdown%'", $this->db->matching( 'SELECT * FROM `' . Debug_Log::table_name() )[0] );
	}

	public function test_an_unknown_level_is_refused() {
		$this->assertSame( 400, $this->request( 'administrator', 'GET', '/debug-log', array( 'level' => 'trace' ) )->get_status() );
	}

	public function test_an_entry_that_is_gone_is_a_404() {
		$response = $this->request( 'administrator', 'GET', '/debug-log/3' );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'jetpack_send_debug_entry_not_found', $response->get_data()['code'] );
	}

	public function test_text_and_clear() {
		$this->db->on( 'COUNT(*)', array( array( 'n' => '0' ) ) );

		$text  = $this->request( 'administrator', 'GET', '/debug-log/text' )->get_data();
		$clear = $this->request( 'administrator', 'POST', '/debug-log/clear' )->get_data();

		$this->assertSame( 0, $text['count'] );
		$this->assertStringStartsWith( 'Jetpack Send debug log', $text['text'] );
		$this->assertSame( array( 'deleted' => 0 ), $clear );
	}
}
