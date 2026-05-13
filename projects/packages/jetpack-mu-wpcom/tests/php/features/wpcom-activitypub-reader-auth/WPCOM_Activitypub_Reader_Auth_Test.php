<?php
/**
 * Tests for the Reader Fediverse destination-side OAuth permission shim.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Connection\Rest_Authentication;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-activitypub-reader-auth/wpcom-activitypub-reader-auth.php';

/**
 * Tests for wpcom-activitypub-reader-auth.
 *
 * @covers ::wpcom_activitypub_reader_auth_check_permission
 * @covers ::wpcom_activitypub_reader_auth_is_blog_mode
 * @covers ::wpcom_activitypub_reader_auth_is_jetpack_signed
 * @covers ::wpcom_activitypub_reader_auth_is_oauth_request
 * @covers ::wpcom_activitypub_reader_auth_is_target_route
 */
#[CoversFunction( 'wpcom_activitypub_reader_auth_check_permission' )]
#[CoversFunction( 'wpcom_activitypub_reader_auth_is_blog_mode' )]
#[CoversFunction( 'wpcom_activitypub_reader_auth_is_jetpack_signed' )]
#[CoversFunction( 'wpcom_activitypub_reader_auth_is_oauth_request' )]
#[CoversFunction( 'wpcom_activitypub_reader_auth_is_target_route' )]
class WPCOM_Activitypub_Reader_Auth_Test extends \WorDBless\BaseTestCase {

	/**
	 * Admin user id created per-test (WorDBless wipes users between tests).
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber (non-admin) user id created per-test.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Build the user fixtures fresh for each test — WorDBless's
	 * `tear_down_wordbless()` clears all users on the way out.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'wpcom_ap_test_admin',
				'user_email' => 'wpcom_ap_test_admin@example.test',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'wpcom_ap_test_sub',
				'user_email' => 'wpcom_ap_test_sub@example.test',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Reset state between tests.
	 */
	public function tearDown(): void {
		wp_set_current_user( 0 );
		delete_option( 'activitypub_actor_mode' );
		self::clear_rest_authentication_state();
		parent::tearDown();
	}

	/**
	 * Reset the Jetpack-connection Rest_Authentication singleton so each test
	 * starts with no recorded signing state.
	 */
	private static function clear_rest_authentication_state(): void {
		if ( ! class_exists( Rest_Authentication::class ) ) {
			return;
		}
		$reflection = new \ReflectionClass( Rest_Authentication::class );
		if ( $reflection->hasProperty( 'instance' ) ) {
			$instance_property = $reflection->getProperty( 'instance' );
			$instance_property->setValue( null, null );
		}
	}

	/**
	 * Force Rest_Authentication into a "signed" state for the duration of a test.
	 *
	 * @param string $type 'user' or 'blog'.
	 */
	private static function set_jetpack_signed( string $type ): void {
		$instance   = Rest_Authentication::init();
		$reflection = new \ReflectionClass( $instance );

		$status_property = $reflection->getProperty( 'rest_authentication_status' );
		$status_property->setValue( $instance, true );

		$type_property = $reflection->getProperty( 'rest_authentication_type' );
		$type_property->setValue( $instance, $type );
	}

	/**
	 * Build a request for a given route + method.
	 */
	private static function make_request( string $route, string $method ): WP_REST_Request {
		$request = new WP_REST_Request( $method, $route );
		return $request;
	}

	/**
	 * Verify is_target_route returns the expected value for positive and negative cases.
	 *
	 * @param string $route Concrete route the AP plugin would dispatch.
	 * @param string $method HTTP method.
	 * @param bool   $expected Expected return value.
	 *
	 * @dataProvider target_route_provider
	 */
	#[DataProvider( 'target_route_provider' )]
	public function test_is_target_route( string $route, string $method, bool $expected ): void {
		$request = self::make_request( $route, $method );
		$this->assertSame( $expected, wpcom_activitypub_reader_auth_is_target_route( $request ) );
	}

	/**
	 * Data provider for is_target_route.
	 */
	public static function target_route_provider(): array {
		return array(
			'inbox GET (actors)'                   => array( '/activitypub/1.0/actors/0/inbox', 'GET', true ),
			'inbox GET (users alias)'              => array( '/activitypub/1.0/users/0/inbox', 'GET', true ),
			'inbox GET (negative user_id allowed)' => array( '/activitypub/1.0/actors/-1/inbox', 'GET', true ),
			'proxy POST'                           => array( '/activitypub/1.0/proxy', 'POST', true ),
			'outbox POST (actors)'                 => array( '/activitypub/1.0/actors/0/outbox', 'POST', true ),
			'outbox POST (users alias)'            => array( '/activitypub/1.0/users/0/outbox', 'POST', true ),
			'inbox POST is wrong method'           => array( '/activitypub/1.0/actors/0/inbox', 'POST', false ),
			'outbox GET is wrong method'           => array( '/activitypub/1.0/actors/0/outbox', 'GET', false ),
			'proxy GET is wrong method'            => array( '/activitypub/1.0/proxy', 'GET', false ),
			'followers GET not a target'           => array( '/activitypub/1.0/actors/0/followers', 'GET', false ),
			'following GET not a target'           => array( '/activitypub/1.0/actors/0/following', 'GET', false ),
			'webfinger GET not a target'           => array( '/activitypub/1.0/webfinger', 'GET', false ),
			'actor GET not a target'               => array( '/activitypub/1.0/actors/0', 'GET', false ),
			'wp/v2 namespace ignored'              => array( '/wp/v2/posts', 'POST', false ),
			'inbox under wrong namespace ignored'  => array( '/other/1.0/actors/0/inbox', 'GET', false ),
		);
	}

	/**
	 * Confirm is_blog_mode reflects the activitypub_actor_mode option.
	 */
	public function test_is_blog_mode_defaults_true(): void {
		delete_option( 'activitypub_actor_mode' );
		$this->assertTrue( wpcom_activitypub_reader_auth_is_blog_mode() );
	}

	public function test_is_blog_mode_explicit_blog(): void {
		update_option( 'activitypub_actor_mode', 'blog' );
		$this->assertTrue( wpcom_activitypub_reader_auth_is_blog_mode() );
	}

	public function test_is_blog_mode_user_mode_false(): void {
		update_option( 'activitypub_actor_mode', 'actor' );
		$this->assertFalse( wpcom_activitypub_reader_auth_is_blog_mode() );
	}

	/**
	 * Verify is_jetpack_signed returns true only when Rest_Authentication reports a signed request.
	 */
	public function test_is_jetpack_signed_false_when_not_signed(): void {
		$this->assertFalse( wpcom_activitypub_reader_auth_is_jetpack_signed() );
	}

	public function test_is_jetpack_signed_true_for_user_token(): void {
		self::set_jetpack_signed( 'user' );
		$this->assertTrue( wpcom_activitypub_reader_auth_is_jetpack_signed() );
	}

	public function test_is_jetpack_signed_true_for_blog_token(): void {
		self::set_jetpack_signed( 'blog' );
		$this->assertTrue( wpcom_activitypub_reader_auth_is_jetpack_signed() );
	}

	/**
	 * Verify is_oauth_request returns false when the AP plugin's Server class is not loaded
	 * (the test environment never loads the AP plugin).
	 */
	public function test_is_oauth_request_false_when_ap_plugin_absent(): void {
		$this->assertFalse( wpcom_activitypub_reader_auth_is_oauth_request() );
	}

	/**
	 * Non-null prior result is returned unchanged.
	 */
	public function test_check_permission_respects_prior_non_null_result(): void {
		$this->fully_authorise(); // Even with all conditions met.
		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertFalse( wpcom_activitypub_reader_auth_check_permission( false, $request ) );
		$this->assertSame( 0, wpcom_activitypub_reader_auth_check_permission( 0, $request ) );

		$err = new WP_Error( 'something' );
		$this->assertSame( $err, wpcom_activitypub_reader_auth_check_permission( $err, $request ) );
	}

	/**
	 * Off-allowlist route → null.
	 */
	public function test_check_permission_null_for_non_target_route(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/actors/0/followers', 'GET' );

		$this->assertNull( wpcom_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Wrong method → null.
	 */
	public function test_check_permission_null_for_wrong_method(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'POST' );

		$this->assertNull( wpcom_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Unsigned request → null (even with admin user + correct route).
	 */
	public function test_check_permission_null_when_not_signed(): void {
		wp_set_current_user( $this->admin_id );
		update_option( 'activitypub_actor_mode', 'blog' );
		// Deliberately NOT signed.

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertNull( wpcom_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Signed but not admin → null.
	 */
	public function test_check_permission_null_when_not_admin(): void {
		wp_set_current_user( $this->subscriber_id );
		update_option( 'activitypub_actor_mode', 'blog' );
		self::set_jetpack_signed( 'user' );

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertNull( wpcom_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * User-mode AP site → null.
	 */
	public function test_check_permission_null_in_user_mode(): void {
		wp_set_current_user( $this->admin_id );
		update_option( 'activitypub_actor_mode', 'actor' );
		self::set_jetpack_signed( 'user' );

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertNull( wpcom_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Happy paths — one for each target route.
	 */
	public function test_check_permission_grants_inbox_get(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertTrue( wpcom_activitypub_reader_auth_check_permission( null, $request ) );
	}

	public function test_check_permission_grants_proxy_post(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/proxy', 'POST' );

		$this->assertTrue( wpcom_activitypub_reader_auth_check_permission( null, $request ) );
	}

	public function test_check_permission_grants_outbox_post(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/actors/0/outbox', 'POST' );

		$this->assertTrue( wpcom_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Blog-token signing is accepted too.
	 */
	public function test_check_permission_grants_blog_token_signed_request(): void {
		wp_set_current_user( $this->admin_id );
		update_option( 'activitypub_actor_mode', 'blog' );
		self::set_jetpack_signed( 'blog' );

		$request = self::make_request( '/activitypub/1.0/proxy', 'POST' );

		$this->assertTrue( wpcom_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * The filter is registered against activitypub_oauth_check_permission at priority 10.
	 */
	public function test_filter_is_registered(): void {
		$this->assertSame(
			10,
			has_filter( 'activitypub_oauth_check_permission', 'wpcom_activitypub_reader_auth_check_permission' )
		);
	}

	/**
	 * Set the test fixture: admin user, blog-mode AP, user-token signed request.
	 */
	private function fully_authorise(): void {
		wp_set_current_user( $this->admin_id );
		update_option( 'activitypub_actor_mode', 'blog' );
		self::set_jetpack_signed( 'user' );
	}
}
