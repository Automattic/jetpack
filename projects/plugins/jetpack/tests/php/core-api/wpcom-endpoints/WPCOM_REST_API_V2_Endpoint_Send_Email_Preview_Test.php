<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_Send_Email_Preview.
 * To run this test by itself use the following command:
 * jetpack docker phpunit jetpack -- --filter=WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test
 *
 * The wpcom-only Email_Verification class the endpoint calls is mocked from the
 * test bootstrap (tests/php/lib/class-email-verification.php).
 */

use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test
 *
 * Only the recipient-resolution branches that return before the wpcom-only
 * subscriber/mailer classes are reached can run here; the successful-send path
 * requires the wpcom runtime and is exercised end-to-end on wpcom.
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Send_Email_Preview
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Send_Email_Preview::class )]
class WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test extends Jetpack_REST_TestCase {

	/**
	 * Editor user whose own email is the default recipient.
	 *
	 * @var int
	 */
	private static $user_id_editor = 0;

	/**
	 * Post to preview.
	 *
	 * @var int
	 */
	private static $post_id = 0;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		static::$user_id_editor = self::factory()->user->create(
			array(
				'role'       => 'editor',
				'user_email' => 'author@example.com',
			)
		);

		wp_set_current_user( static::$user_id_editor );

		static::$post_id = self::factory()->post->create(
			array(
				'post_status' => 'published',
				'post_author' => (string) static::$user_id_editor,
			)
		);
	}

	/**
	 * Invoke the handler directly. Dispatching via the server would hit the proxy
	 * callback, since the test environment is not is_wpcom_simple().
	 *
	 * @param array $params Request params.
	 * @return WP_REST_Response|WP_Error
	 */
	private function send( array $params ) {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/send-email-preview' );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		$endpoint = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview();

		return $endpoint->send_email_preview( $request );
	}

	/**
	 * The optional email argument is registered on the route.
	 */
	public function test_email_arg_is_registered() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/send-email-preview', $routes );

		$args = $routes['/wpcom/v2/send-email-preview'][0]['args'];
		$this->assertArrayHasKey( 'email', $args );
		$this->assertSame( 'string', $args['email']['type'] );
	}

	/**
	 * A malformed recipient address is rejected with a 400 before any send.
	 */
	public function test_invalid_recipient_is_rejected() {
		$result = $this->send(
			array(
				'id'    => static::$post_id,
				'email' => 'not-an-email',
			)
		);

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'invalid_email', $result->get_error_code() );
		$this->assertSame( 400, $result->get_error_data()['status'] );
	}

	/**
	 * A different (non-self) recipient is refused when the wpcom guard is not
	 * available, rather than sending unguarded.
	 */
	public function test_non_self_recipient_without_guard_is_unavailable() {
		$result = $this->send(
			array(
				'id'    => static::$post_id,
				'email' => 'someone-else@example.com',
			)
		);

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'send_email_preview_guard_unavailable', $result->get_error_code() );
		$this->assertSame( 503, $result->get_error_data()['status'] );
	}
}
