<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status.
 * To run this test by itself use the following command:
 * jetpack docker phpunit jetpack -- --filter=WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status_Test
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status::class )]
class WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock user ID with editor permissions.
	 *
	 * @var int
	 */
	private static $user_id_editor = 0;

	/**
	 * Mock user ID with author permissions (does not own the test post).
	 *
	 * @var int
	 */
	private static $user_id_author_other = 0;

	/**
	 * Mock user ID with administrator permissions.
	 *
	 * @var int
	 */
	private static $user_id_admin = 0;

	/**
	 * Mock user ID with subscriber permissions.
	 *
	 * @var int
	 */
	private static $user_id_subscriber = 0;

	/**
	 * Route to endpoint.
	 *
	 * @var string
	 */
	private static $path = '/wpcom/v2/newsletter-email-sent-status';

	/**
	 * Mock post ID.
	 *
	 * @var int
	 */
	private static $post_id = 0;

	/**
	 * Create mock users and post.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id_editor       = $factory->user->create( array( 'role' => 'editor' ) );
		static::$user_id_author_other = $factory->user->create( array( 'role' => 'author' ) );
		static::$user_id_admin        = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$user_id_subscriber   = $factory->user->create( array( 'role' => 'subscriber' ) );
		static::$post_id              = $factory->post->create(
			array(
				'post_status' => 'publish',
				'post_author' => static::$user_id_editor,
				'post_type'   => 'post',
			)
		);
	}

	/**
	 * Set up. Must set IS_WPCOM before parent so the local handler is registered.
	 */
	public function set_up() {
		Constants::set_constant( 'IS_WPCOM', true );
		parent::set_up();

		wp_set_current_user( static::$user_id_editor );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Test that an unauthenticated user cannot access the endpoint.
	 */
	public function test_permission_check_unauthenticated() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, rest_authorization_required_code() );
	}

	/**
	 * Test that a subscriber cannot access the endpoint (insufficient capability).
	 */
	public function test_permission_check_insufficient_capability() {
		wp_set_current_user( static::$user_id_subscriber );

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 403 );
	}

	/**
	 * Test that an author cannot access a post they do not own.
	 */
	public function test_author_cannot_access_other_authors_post() {
		wp_set_current_user( static::$user_id_author_other );

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 403 );
	}

	/**
	 * Test that an admin can access any post regardless of ownership.
	 */
	public function test_admin_can_access_any_post() {
		wp_set_current_user( static::$user_id_admin );

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Test that the post author (editor) can access their own post.
	 */
	public function test_editor_can_access_own_post() {
		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'email_sent_at', $data );
		$this->assertArrayHasKey( 'stats_on_send', $data );
		$this->assertNull( $data['email_sent_at'] );
		$this->assertNull( $data['stats_on_send'] );
	}

	/**
	 * Test that missing post_id returns 400.
	 */
	public function test_missing_post_id_returns_400() {
		$request  = new WP_REST_Request( Requests::GET, static::$path );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_missing_callback_param', $response, 400 );
	}

	/**
	 * Test that invalid post_id (0) returns 400.
	 */
	public function test_invalid_post_id_returns_400() {
		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', 0 );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Test that non-existent post returns 404.
	 */
	public function test_post_not_found_returns_404() {
		wp_set_current_user( static::$user_id_admin );

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', 999999 );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'post_not_found', $response, 404 );
	}

	/**
	 * Test response with email_notification and stats meta.
	 */
	public function test_get_email_sent_status_with_meta() {
		$unix_ts = strtotime( '2024-01-15 10:00:00' );
		update_post_meta( static::$post_id, 'email_notification', (string) $unix_ts );
		update_post_meta(
			static::$post_id,
			'_wpcom_newsletter_stats_on_email_send',
			array(
				array(
					'timestamp'                 => '2024-01-15T10:00:00+00:00',
					'access_level'              => 'all_subscribers',
					'post_categories'           => array( 1, 2 ),
					'has_newsletter_categories' => true,
				),
			)
		);

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertNotNull( $data['email_sent_at'] );
		$this->assertIsString( $data['email_sent_at'] );
		$this->assertIsArray( $data['stats_on_send'] );
		$this->assertSame( 'all_subscribers', $data['stats_on_send']['access_level'] );
		$this->assertNull( $data['stats_on_send']['paid_tier'] );
		$this->assertSame( array( 1, 2 ), $data['stats_on_send']['post_categories'] );
		$this->assertTrue( $data['stats_on_send']['has_newsletter_categories'] );
		$this->assertArrayHasKey( 'has_paywall_block', $data['stats_on_send'] );
		$this->assertNull( $data['stats_on_send']['has_paywall_block'], 'Legacy stats without has_paywall_block should return null' );
	}

	/**
	 * Test stats_on_send paid_tier parsing when access_level is "paid_subscribers: Premium".
	 */
	public function test_stats_on_send_paid_tier_parsing() {
		update_post_meta(
			static::$post_id,
			'_wpcom_newsletter_stats_on_email_send',
			array(
				array(
					'timestamp'       => '2024-01-15T10:00:00+00:00',
					'access_level'    => 'paid_subscribers: Premium',
					'post_categories' => array(),
				),
			)
		);

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'paid_subscribers', $data['stats_on_send']['access_level'] );
		$this->assertSame( 'Premium', $data['stats_on_send']['paid_tier'] );
	}

	/**
	 * Test stats_on_send has_paywall_block when present as true.
	 */
	public function test_stats_on_send_has_paywall_block_true() {
		update_post_meta(
			static::$post_id,
			'_wpcom_newsletter_stats_on_email_send',
			array(
				array(
					'timestamp'         => '2024-01-15T10:00:00+00:00',
					'access_level'      => 'paid_subscribers',
					'post_categories'   => array(),
					'has_paywall_block' => true,
				),
			)
		);

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['stats_on_send']['has_paywall_block'] );
	}

	/**
	 * Test stats_on_send has_paywall_block when present as false.
	 */
	public function test_stats_on_send_has_paywall_block_false() {
		update_post_meta(
			static::$post_id,
			'_wpcom_newsletter_stats_on_email_send',
			array(
				array(
					'timestamp'         => '2024-01-15T10:00:00+00:00',
					'access_level'      => 'paid_subscribers',
					'post_categories'   => array(),
					'has_paywall_block' => false,
				),
			)
		);

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertFalse( $data['stats_on_send']['has_paywall_block'] );
	}
}
