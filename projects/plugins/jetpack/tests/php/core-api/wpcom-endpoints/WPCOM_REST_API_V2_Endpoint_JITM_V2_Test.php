<?php

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Tests for JITM V2 REST API Endpoints.
 *
 * @package automattic/jetpack
 */
class WPCOM_REST_API_V2_Endpoint_JITM_V2_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Store the Patchwork redefine handle
	 *
	 * @var mixed
	 */
	private $patchwork_handle;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();
		wp_set_current_user( static::$user_id );

		// Mock current_user_can to return true for install_plugins when testing with WPCOMSH.
		// This is required because the Pre_Connection_JITM->get_messages() method
		// uses `current_user_can` to check if the user has the `install_plugins` capability.
		// This capability is revoked on Atomic if the user does not have a plan.
		// Therefore without mocking, this test would fail when running with JETPACK_TEST_WPCOMSH=1.
		// See:
		// - projects/packages/jitm/src/class-pre-connection-jitm.php
		// - projects/plugins/wpcomsh/feature-plugins/hooks.php
		$this->patchwork_handle = \Patchwork\redefine(
			'current_user_can',
			function ( $capability ) {
				if ( 'install_plugins' === $capability ) {
					return true;
				}
				// Forward to the original function.
				return \Patchwork\relay();
			}
		);

		// Add test JITM via filter
		add_filter( 'jetpack_pre_connection_jitms', array( $this, 'inject_test_jitm' ), 10, 1 );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_pre_connection_jitms', array( $this, 'inject_test_jitm' ) );

		\Patchwork\restore( $this->patchwork_handle );
		parent::tear_down();
	}

	/**
	 * Inject test JITM data. As it is not possible to mock the JITM::get_instance() method,
	 * we utilise the jetpack_pre_connection_jitms filter to inject the test JITM.
	 * Pre_Connection_JITM does not make HTTP requests so whilst this is not ideal, it is the best solution.
	 *
	 * @param array $jitms The JITMs array.
	 * @return array
	 */
	public function inject_test_jitm( $jitms ) {
		$message_path = '#test_message_path#'; // Valid regex pattern using # as delimiter

		// In Pre_Connection_JITM the message must have specific keys.
		// The message_path must also be a regex pattern that matches the message_path under test.
		// See Pre_Connection_JITM::filter_messages() for more details.
		$jitms[] = array(
			'id'             => 'test-jitm',
			'message_path'   => $message_path,
			'message'        => 'Test message',
			'description'    => 'Test description',
			'button_link'    => 'https://example.com',
			'button_caption' => 'Test Button',
		);

		return $jitms;
	}

	/**
	 * Tests getting JITMs.
	 */
	public function test_get_jitms() {

		$message_path = 'test_message_path';

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/jitm-v2' );
		$request->set_query_params(
			array(
				'message_path'        => $message_path,
				'query'               => '',
				'full_jp_logo_exists' => false,
			)
		);

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );
		$this->assertCount( 1, $data );

		$jitm = $data[0];
		$this->assertInstanceOf( 'stdClass', $jitm );
		$this->assertObjectHasProperty( 'id', $jitm );
		$this->assertObjectHasProperty( 'CTA', $jitm );
		$this->assertObjectHasProperty( 'content', $jitm );
		$this->assertObjectHasProperty( 'url', $jitm );
		$this->assertObjectHasProperty( 'is_dismissible', $jitm );

		$this->assertSame( 'test-jitm', $jitm->id );
		$this->assertSame( 'Test Button', $jitm->CTA['message'] ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$this->assertSame( 'https://example.com', $jitm->url );
		$this->assertSame( 'Test message', $jitm->content['message'] );
		$this->assertSame( 'Test description', $jitm->content['description'] );
		$this->assertTrue( $jitm->is_dismissible );
	}

	/**
	 * Tests the schema response for OPTIONS requests.
	 */
	public function test_schema_request() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'OPTIONS', '/wpcom/v2/jitm-v2' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'wpcom/v2', $data['namespace'] );
		$this->assertEquals( array( 'GET', 'POST' ), $data['methods'] );
	}

	/**
	 * Tests the permission check for GET requests.
	 */
	public function test_get_item_permissions_check() {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/jitm-v2' );
		$request->set_query_params(
			array(
				'message_path'        => '/test_message_path/',
				'query'               => '',
				'full_jp_logo_exists' => false,
			)
		);

		// Test with no user (should fail)
		wp_set_current_user( 0 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse(
			'invalid_user_permission_jetpack_get_jitm_message',
			$response,
			401
		);

		// Test with logged in user (should succeed)
		$subscriber_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status(), 'Logged in users should be able to get JITMs' );
	}

	/**
	 * Tests the permission check for POST (dismiss) requests.
	 */
	public function test_dismiss_item_permissions_check() {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/jitm-v2' );
		$request->set_body_params(
			array(
				'id'            => 'test-jitm',
				'feature_class' => 'test-feature',
			)
		);

		// Test with no user (should fail)
		wp_set_current_user( 0 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse(
			'invalid_user_permission_jetpack_delete_jitm_message',
			$response,
			rest_authorization_required_code()
		);

		// Test with  (should succeed)
		$subscriber_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status(), 'Subscribers should be able to dismiss JITMs' );
	}

	/**
	 * Tests dismissing a JITM.
	 */
	public function test_dismiss_jitm() {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/jitm-v2' );
		$request->set_body_params(
			array(
				'id'            => 'test-jitm',
				'feature_class' => 'test-feature',
			)
		);

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $data );
	}
}
