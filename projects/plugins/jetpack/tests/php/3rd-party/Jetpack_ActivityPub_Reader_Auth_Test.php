<?php
/**
 * Tests for the ActivityPub Reader-Auth permission shim.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once JETPACK__PLUGIN_DIR . '3rd-party/activitypub.php';

/**
 * Class Jetpack_ActivityPub_Reader_Auth_Test
 *
 * @covers ::jetpack_activitypub_reader_auth_check_permission
 * @covers ::jetpack_activitypub_reader_auth_is_blog_mode
 * @covers ::jetpack_activitypub_reader_auth_is_jetpack_signed
 * @covers ::jetpack_activitypub_reader_auth_is_oauth_request
 * @covers ::jetpack_activitypub_reader_auth_is_target_route
 */
#[CoversFunction( 'jetpack_activitypub_reader_auth_check_permission' )]
#[CoversFunction( 'jetpack_activitypub_reader_auth_is_blog_mode' )]
#[CoversFunction( 'jetpack_activitypub_reader_auth_is_jetpack_signed' )]
#[CoversFunction( 'jetpack_activitypub_reader_auth_is_oauth_request' )]
#[CoversFunction( 'jetpack_activitypub_reader_auth_is_target_route' )]
class Jetpack_ActivityPub_Reader_Auth_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Admin user id created per-test.
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
	 * Build user fixtures and put the site into a "connected, non-offline,
	 * not-Simple" state so the shim's connection guard does not short-circuit.
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_id      = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->subscriber_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		\Automattic\Jetpack\Status\Cache::clear();
		self::make_jetpack_appear_connected();
	}

	/**
	 * Reset state between tests.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		delete_option( 'activitypub_actor_mode' );
		self::clear_jetpack_connection_state();
		self::clear_rest_authentication_state();
		\Automattic\Jetpack\Status\Cache::clear();
		parent::tear_down();
	}

	/**
	 * Make is_connected() return true and is_offline_mode() return false.
	 *
	 * Storing real-looking Jetpack options is the lightest-weight way to make
	 * `Automattic\Jetpack\Connection\Manager::is_connected()` return true under
	 * `WP_UnitTestCase`, without standing up a full connection flow.
	 */
	private static function make_jetpack_appear_connected(): void {
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', '1.0.test-blog-token' );
		add_filter( 'jetpack_offline_mode', '__return_false', 99 );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Undo make_jetpack_appear_connected.
	 *
	 * Also resets the Connection_Manager's static memoization so a subsequent
	 * is_connected() call recomputes against the freshly-cleared options.
	 */
	private static function clear_jetpack_connection_state(): void {
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );
		remove_filter( 'jetpack_offline_mode', '__return_false', 99 );
		( new Connection_Manager() )->reset_connection_status();
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
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$instance_property->setAccessible( true );
			}
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
		$type_property   = $reflection->getProperty( 'rest_authentication_type' );

		// @todo Remove these calls once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$status_property->setAccessible( true );
			$type_property->setAccessible( true );
		}

		$status_property->setValue( $instance, true );
		$type_property->setValue( $instance, $type );
	}

	/**
	 * Build a request for a given route + method.
	 *
	 * @param string $route  REST route.
	 * @param string $method HTTP method.
	 * @return WP_REST_Request
	 */
	private static function make_request( string $route, string $method ): WP_REST_Request {
		return new WP_REST_Request( $method, $route );
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
		$this->assertSame( $expected, jetpack_activitypub_reader_auth_is_target_route( $request ) );
	}

	/**
	 * Data provider for is_target_route.
	 *
	 * @return array
	 */
	public static function target_route_provider(): array {
		return array(
			'inbox GET (actors)'                       => array( '/activitypub/1.0/actors/0/inbox', 'GET', true ),
			'inbox GET (users alias)'                  => array( '/activitypub/1.0/users/0/inbox', 'GET', true ),
			'inbox GET (trailing slash)'               => array( '/activitypub/1.0/actors/0/inbox/', 'GET', true ),
			'proxy POST'                               => array( '/activitypub/1.0/proxy', 'POST', true ),
			'proxy POST (trailing slash)'              => array( '/activitypub/1.0/proxy/', 'POST', true ),
			'outbox POST (actors)'                     => array( '/activitypub/1.0/actors/0/outbox', 'POST', true ),
			'outbox POST (users alias)'                => array( '/activitypub/1.0/users/0/outbox', 'POST', true ),
			'outbox POST (trailing slash)'             => array( '/activitypub/1.0/actors/0/outbox/', 'POST', true ),
			'inbox POST is wrong method'               => array( '/activitypub/1.0/actors/0/inbox', 'POST', false ),
			'outbox GET is wrong method'               => array( '/activitypub/1.0/actors/0/outbox', 'GET', false ),
			'proxy GET is wrong method'                => array( '/activitypub/1.0/proxy', 'GET', false ),
			'inbox GET (negative user_id rejected)'    => array( '/activitypub/1.0/actors/-1/inbox', 'GET', false ),
			'inbox GET (non-blog user_id rejected)'    => array( '/activitypub/1.0/actors/1/inbox', 'GET', false ),
			'outbox POST (non-blog user_id rejected)'  => array( '/activitypub/1.0/actors/42/outbox', 'POST', false ),
			'inbox GET (non-numeric user_id rejected)' => array( '/activitypub/1.0/actors/abc/inbox', 'GET', false ),
			'followers GET not a target'               => array( '/activitypub/1.0/actors/0/followers', 'GET', false ),
			'following GET not a target'               => array( '/activitypub/1.0/actors/0/following', 'GET', false ),
			'webfinger GET not a target'               => array( '/activitypub/1.0/webfinger', 'GET', false ),
			'actor GET not a target'                   => array( '/activitypub/1.0/actors/0', 'GET', false ),
			'wp/v2 namespace ignored'                  => array( '/wp/v2/posts', 'POST', false ),
			'inbox under wrong namespace ignored'      => array( '/other/1.0/actors/0/inbox', 'GET', false ),
		);
	}

	/**
	 * Confirm is_blog_mode reflects the activitypub_actor_mode option.
	 *
	 * The shim fails closed when the option is unset: the AP plugin's own
	 * default is user-mode (`ACTIVITYPUB_ACTOR_MODE = 'actor'`), so an
	 * unset option must not be treated as blog-mode.
	 */
	public function test_is_blog_mode_false_when_option_unset(): void {
		delete_option( 'activitypub_actor_mode' );
		$this->assertFalse( jetpack_activitypub_reader_auth_is_blog_mode() );
	}

	/**
	 * Explicit blog mode → true.
	 */
	public function test_is_blog_mode_explicit_blog(): void {
		update_option( 'activitypub_actor_mode', 'blog' );
		$this->assertTrue( jetpack_activitypub_reader_auth_is_blog_mode() );
	}

	/**
	 * User mode → false.
	 */
	public function test_is_blog_mode_user_mode_false(): void {
		update_option( 'activitypub_actor_mode', 'actor' );
		$this->assertFalse( jetpack_activitypub_reader_auth_is_blog_mode() );
	}

	/**
	 * Mixed actor_blog mode → true.
	 *
	 * On `actor_blog` sites the blog actor exists alongside per-user actors
	 * and behaves identically to pure blog-mode. Route patterns are pinned
	 * to `user_id=0`, so the grant cannot widen to arbitrary user actors.
	 */
	public function test_is_blog_mode_actor_blog_true(): void {
		update_option( 'activitypub_actor_mode', 'actor_blog' );
		$this->assertTrue( jetpack_activitypub_reader_auth_is_blog_mode() );
	}

	/**
	 * Unsigned request → is_jetpack_signed false.
	 */
	public function test_is_jetpack_signed_false_when_not_signed(): void {
		$this->assertFalse( jetpack_activitypub_reader_auth_is_jetpack_signed() );
	}

	/**
	 * User-token signed → is_jetpack_signed true.
	 */
	public function test_is_jetpack_signed_true_for_user_token(): void {
		self::set_jetpack_signed( 'user' );
		$this->assertTrue( jetpack_activitypub_reader_auth_is_jetpack_signed() );
	}

	/**
	 * Blog-token signed → is_jetpack_signed true.
	 */
	public function test_is_jetpack_signed_true_for_blog_token(): void {
		self::set_jetpack_signed( 'blog' );
		$this->assertTrue( jetpack_activitypub_reader_auth_is_jetpack_signed() );
	}

	/**
	 * Verify is_oauth_request returns false when the AP plugin's Server class is not loaded
	 * (the test environment never loads the AP plugin).
	 */
	public function test_is_oauth_request_false_when_ap_plugin_absent(): void {
		$this->assertFalse( jetpack_activitypub_reader_auth_is_oauth_request() );
	}

	/**
	 * When a real OAuth bearer is present, check_permission must defer to the
	 * plugin's normal verification — even if every other predicate is satisfied.
	 *
	 * Runs in a separate process so the stub `Activitypub\OAuth\Server` class
	 * doesn't pollute other tests that rely on its absence.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_check_permission_defers_when_oauth_request_present(): void {
		require __DIR__ . '/fixtures/Activitypub/OAuth/class-server.php';

		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		update_option( 'activitypub_actor_mode', 'blog' );
		self::set_jetpack_signed( 'user' );

		$request = self::make_request( '/activitypub/1.0/proxy', 'POST' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );

		// A non-null prior result must also be preserved verbatim when an OAuth bearer is
		// present: the shim must never substitute `true` over an existing decision.
		$this->assertFalse( jetpack_activitypub_reader_auth_check_permission( false, $request ) );
		$err = new WP_Error( 'oauth-denied' );
		$this->assertSame( $err, jetpack_activitypub_reader_auth_check_permission( $err, $request ) );
	}

	/**
	 * Non-null prior result is returned unchanged.
	 */
	public function test_check_permission_respects_prior_non_null_result(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertFalse( jetpack_activitypub_reader_auth_check_permission( false, $request ) );
		$this->assertSame( 0, jetpack_activitypub_reader_auth_check_permission( 0, $request ) );

		$err = new WP_Error( 'something' );
		$this->assertSame( $err, jetpack_activitypub_reader_auth_check_permission( $err, $request ) );
	}

	/**
	 * Off-allowlist route → null.
	 */
	public function test_check_permission_null_for_non_target_route(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/actors/0/followers', 'GET' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Wrong method → null.
	 */
	public function test_check_permission_null_for_wrong_method(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'POST' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Unsigned request → null (even with admin user + correct route).
	 */
	public function test_check_permission_null_when_not_signed(): void {
		wp_set_current_user( $this->admin_id );
		update_option( 'activitypub_actor_mode', 'blog' );
		// Deliberately NOT signed.

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Signed but not admin → null.
	 */
	public function test_check_permission_null_when_not_admin(): void {
		wp_set_current_user( $this->subscriber_id );
		update_option( 'activitypub_actor_mode', 'blog' );
		self::set_jetpack_signed( 'user' );

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Mixed `actor_blog` mode → true. The blog actor exists alongside
	 * per-user actors; route pinning to `user_id=0` keeps the grant
	 * scoped to the blog actor.
	 */
	public function test_check_permission_grants_actor_blog_mode(): void {
		wp_set_current_user( $this->admin_id );
		update_option( 'activitypub_actor_mode', 'actor_blog' );
		self::set_jetpack_signed( 'user' );

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertTrue( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Pure user-mode AP site → null. No blog actor exists, so `user_id=0`
	 * routes cannot be authorized.
	 */
	public function test_check_permission_null_in_user_mode(): void {
		wp_set_current_user( $this->admin_id );
		update_option( 'activitypub_actor_mode', 'actor' );
		self::set_jetpack_signed( 'user' );

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Offline-mode site → null (even with every other predicate satisfied).
	 */
	public function test_check_permission_null_when_offline(): void {
		$this->fully_authorise();
		add_filter( 'jetpack_offline_mode', '__return_true', 100 );

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );

		remove_filter( 'jetpack_offline_mode', '__return_true', 100 );
	}

	/**
	 * Wpcom Simple sites are out of scope — they share the AP OAuth datastore
	 * directly and don't need the bridge. Setting the IS_WPCOM constant must
	 * short-circuit even when every other predicate is satisfied.
	 */
	public function test_check_permission_null_on_wpcom_simple(): void {
		$this->fully_authorise();
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );

		\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
	}

	/**
	 * Disconnected site → null.
	 */
	public function test_check_permission_null_when_disconnected(): void {
		$this->fully_authorise();
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Happy paths — one for each target route.
	 */
	public function test_check_permission_grants_inbox_get(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/actors/0/inbox', 'GET' );

		$this->assertTrue( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Proxy POST happy path.
	 */
	public function test_check_permission_grants_proxy_post(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/proxy', 'POST' );

		$this->assertTrue( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Outbox POST happy path.
	 */
	public function test_check_permission_grants_outbox_post(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/actors/0/outbox', 'POST' );

		$this->assertTrue( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Blog-token signing is accepted too.
	 */
	public function test_check_permission_grants_blog_token_signed_request(): void {
		wp_set_current_user( $this->admin_id );
		update_option( 'activitypub_actor_mode', 'blog' );
		self::set_jetpack_signed( 'blog' );

		$request = self::make_request( '/activitypub/1.0/proxy', 'POST' );

		$this->assertTrue( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * Realistic blog-token shadow request: no current user, signed with blog token.
	 * Blog-token signing does not install a current user, so manage_options fails
	 * and the shim must abstain — even though the route, method, and mode are valid.
	 */
	public function test_check_permission_null_for_blog_token_without_admin(): void {
		wp_set_current_user( 0 );
		update_option( 'activitypub_actor_mode', 'blog' );
		self::set_jetpack_signed( 'blog' );

		$request = self::make_request( '/activitypub/1.0/proxy', 'POST' );

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, $request ) );
	}

	/**
	 * The defensive guards in is_target_route mean check_permission must
	 * not fatal on a non-WP_REST_Request payload — it should abstain.
	 */
	public function test_check_permission_handles_non_request_payloads(): void {
		$this->fully_authorise();

		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, null ) );
		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, 'not-a-request' ) );
		$this->assertNull( jetpack_activitypub_reader_auth_check_permission( null, new \stdClass() ) );
	}

	/**
	 * The filter is registered against activitypub_oauth_check_permission at priority 10.
	 */
	public function test_filter_is_registered(): void {
		$this->assertSame(
			10,
			has_filter( 'activitypub_oauth_check_permission', 'jetpack_activitypub_reader_auth_check_permission' )
		);
	}

	/**
	 * Apply the filter end-to-end. Catches regressions in the filter wiring that the
	 * direct function calls above miss — in particular, the `accepted_args = 2` setting
	 * which is load-bearing (without it, `$request` is dropped and every request is denied).
	 */
	public function test_filter_grants_when_applied_end_to_end(): void {
		$this->fully_authorise();
		$request = self::make_request( '/activitypub/1.0/proxy', 'POST' );

		$this->assertTrue(
			apply_filters( 'activitypub_oauth_check_permission', null, $request, 'write' )
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
