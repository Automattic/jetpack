<?php
/**
 * Test the Evaluation Recommendations REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Jetpack_Options;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for REST_Recommendations_Evaluation.
 *
 * @see \Automattic\Jetpack\My_Jetpack\REST_Recommendations_Evaluation
 */
class Recommendations_Evaluation_Rest_Test extends BaseTestCase {
	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Editor user id.
	 *
	 * @var int
	 */
	private $editor_id;

	/**
	 * A payload that passes the endpoint's input schema.
	 *
	 * @var array
	 */
	private $valid_payload = array(
		'recommendations' => array(
			'backup'    => 3,
			'anti-spam' => 2,
		),
	);

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		// Mock site connection. The endpoints refuse to run on a disconnected site.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );
		( new Connection_Manager() )->reset_connection_status();

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		add_action(
			'rest_api_init',
			function () {
				new REST_Recommendations_Evaluation();
			}
		);
		do_action( 'rest_api_init' );

		$this->admin_id  = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'test_editor',
				'user_pass'  => '123',
				'role'       => 'editor',
			)
		);

		wp_set_current_user( 0 );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Build a request for the result endpoint.
	 *
	 * @param string $method HTTP method.
	 * @param array  $body   JSON body params.
	 *
	 * @return WP_REST_Request
	 */
	private function build_result_request( $method, $body = array() ) {
		$request = new WP_REST_Request( $method, '/my-jetpack/v1/site/recommendations/evaluation/result' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );

		return $request;
	}

	/**
	 * Saving recommendations is rejected for anonymous requests.
	 */
	public function test_save_recommendations_rejects_anonymous_request() {
		$response = $this->server->dispatch( $this->build_result_request( 'POST', $this->valid_payload ) );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'invalid_user_permission_manage_options', $response->get_data()['code'] );
		$this->assertNull( Jetpack_Options::get_option( 'recommendations_evaluation', null ) );
	}

	/**
	 * Saving recommendations is rejected for logged-in users without manage_options.
	 */
	public function test_save_recommendations_rejects_editor() {
		wp_set_current_user( $this->editor_id );

		$response = $this->server->dispatch( $this->build_result_request( 'POST', $this->valid_payload ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertNull( Jetpack_Options::get_option( 'recommendations_evaluation', null ) );
	}

	/**
	 * Dismissing recommendations is rejected for anonymous requests.
	 */
	public function test_dismiss_recommendations_rejects_anonymous_request() {
		$response = $this->server->dispatch( $this->build_result_request( 'DELETE' ) );

		$this->assertSame( 401, $response->get_status() );
		$this->assertFalse( Jetpack_Options::get_option( 'dismissed_recommendations', false ) );
	}

	/**
	 * Evaluating recommendations is rejected for logged-in users without manage_options.
	 */
	public function test_evaluate_recommendations_rejects_editor() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/recommendations/evaluation' );
		$request->set_query_params( array( 'goals' => array( 'audience' ) ) );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * An administrator can still save a well-formed payload.
	 */
	public function test_save_recommendations_accepts_admin() {
		wp_set_current_user( $this->admin_id );

		$response = $this->server->dispatch( $this->build_result_request( 'POST', $this->valid_payload ) );

		$this->assertSame( 200, $response->get_status() );
		// Modules come back sorted by descending score.
		$this->assertSame( array( 'backup', 'anti-spam' ), $response->get_data() );
		// Scores are stored as numbers; the schema casts them to float.
		$this->assertEquals( $this->valid_payload['recommendations'], Jetpack_Options::get_option( 'recommendations_evaluation' ) );
	}

	/**
	 * A scalar `recommendations` value is rejected by the input schema rather than
	 * being written to the option, where it would later fatal in arsort().
	 */
	public function test_save_recommendations_rejects_non_object_payload() {
		wp_set_current_user( $this->admin_id );

		$response = $this->server->dispatch( $this->build_result_request( 'POST', array( 'recommendations' => 'PWNED' ) ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
		$this->assertNull( Jetpack_Options::get_option( 'recommendations_evaluation', null ) );
	}

	/**
	 * A poisoned option value degrades gracefully instead of fataling.
	 */
	public function test_get_recommended_modules_ignores_non_array_option() {
		Jetpack_Options::update_option( 'recommendations_evaluation', 'PWNED' );

		$this->assertNull( Initializer::get_recommended_modules() );
	}
}
