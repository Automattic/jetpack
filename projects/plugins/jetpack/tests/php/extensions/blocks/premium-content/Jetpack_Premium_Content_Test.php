<?php

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/access-check.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once __DIR__ . '/class-test-jetpack-token-subscription-service.php';

use Automattic\Jetpack\Extensions\Premium_Content\JWT;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Subscription_Service as Subscription_Service_Interface;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service;
use Automattic\Jetpack\VideoPress\Access_Control;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Automattic\Jetpack\Extensions\Premium_Content\Test_Jetpack_Token_Subscription_Service;
use function Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access;
use function Automattic\Jetpack\Extensions\Premium_Content\maybe_renew_session_cookie;
use function Automattic\Jetpack\Extensions\Premium_Content\prewarm_premium_content_session_cookie;
use function Automattic\Jetpack\Extensions\Premium_Content\subscription_service;
use function Automattic\Jetpack\Extensions\Premium_Content\visitor_can_access_plan_ids;
use function Automattic\Jetpack\Extensions\Premium_Content\visitor_has_subscription_access_to_plan_ids;
use const Automattic\Jetpack\Extensions\Premium_Content\PAYWALL_FILTER;

/**
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\get_subscriptions_for_logged_in_user
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\maybe_renew_session_cookie
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\prewarm_premium_content_session_cookie
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\visitor_can_access_plan_ids
 * @covers \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service
 */
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\current_visitor_can_access' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\get_subscriptions_for_logged_in_user' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\maybe_renew_session_cookie' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\prewarm_premium_content_session_cookie' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\visitor_can_access_plan_ids' )]
#[CoversClass( Abstract_Token_Subscription_Service::class )]
class Jetpack_Premium_Content_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	protected $product_id = 1234;

	/**
	 * Optional override for the refresh endpoint response. If null, refresh is blocked
	 * (simulates a transient 500). Tests can set this to control refresh behavior — an
	 * array shape for normal HTTP responses, or a WP_Error to simulate transport failure.
	 *
	 * @var array|\WP_Error|null
	 */
	protected $refresh_response_override = null;

	/**
	 * Number of times the refresh endpoint mock was hit during a test. Lets tests
	 * assert that refresh was (or was not) called, independent of the access outcome.
	 *
	 * @var int
	 */
	protected $refresh_call_count = 0;

	public function set_up() {
		parent::set_up();
		Jetpack_Memberships::clear_cache();
		Jetpack_Subscriptions::init();
		// Priority must be higher than wpcomsh's `WPCOMSH_Require_Connection_Owner` filter
		// (registered at 1000), which would otherwise force-return false in CI's wpcomsh
		// suite and break tier-aware tests that need `Jetpack_Memberships::get_all_*` to
		// see plans.
		add_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );
		// Refresh endpoint URL embeds the site id; without this it resolves to 0 and the
		// production code's `$site_id <= 0` guard short-circuits before any HTTP call.
		Jetpack_Options::update_option( 'id', 12345 );
		add_filter(
			PAYWALL_FILTER,
			function () {
				return new Test_Jetpack_Token_Subscription_Service();
			}
		);
		// Block or mock refresh endpoint HTTP calls in tests.
		add_filter( 'pre_http_request', array( $this, 'mock_refresh_endpoint' ), 10, 3 );
	}

	public function tear_down() {
		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		remove_all_filters( 'jetpack_is_connection_ready' );
		remove_all_filters( PAYWALL_FILTER );
		remove_all_filters( 'pre_http_request' );
		Jetpack_Options::delete_option( 'id' );
		$this->refresh_response_override = null;
		$this->refresh_call_count        = 0;
		unset( $_COOKIE['wp-jp-premium-content-session'] );
		parent::tear_down();
	}

	/**
	 * Intercept HTTP calls to the refresh endpoint. Returns the override if set,
	 * otherwise a transient 500 so refresh fails and existing behavior is preserved.
	 *
	 * @param mixed  $preempt Current preempt value.
	 * @param array  $args    Request args.
	 * @param string $url     Request URL.
	 * @return mixed
	 */
	public function mock_refresh_endpoint( $preempt, $args, $url ) {
		if ( false !== strpos( $url, 'memberships/token/refresh' ) ) {
			++$this->refresh_call_count;
			if ( null !== $this->refresh_response_override ) {
				return $this->refresh_response_override;
			}
			return array(
				'response' => array(
					'code'    => 500,
					'message' => 'blocked in tests',
				),
				'body'     => '',
				'headers'  => array(),
				'cookies'  => array(),
			);
		}
		return $preempt;
	}

	/**
	 * Retrieves payload for JWT token
	 *
	 * @param bool     $is_subscribed
	 * @param bool     $is_paid_subscriber
	 * @param int|null $subscription_end_date
	 * @return array
	 */
	private function get_payload( $is_subscribed, $is_paid_subscriber, $subscription_end_date = null, $status = null ) {
		$subscriptions = ! $is_paid_subscriber ? array() : array(
			$this->product_id => array(
				'status'     => $status ? $status : 'active',
				'end_date'   => $subscription_end_date ? $subscription_end_date : time() + HOUR_IN_SECONDS,
				'product_id' => $this->product_id,
			),
		);

		return array(
			'blog_sub'      => $is_subscribed ? 'active' : 'inactive',
			'subscriptions' => $subscriptions,
		);
	}

	/**
	 * Stubs Jetpack_Token_Subscription_Service in order to return the provided token.
	 *
	 * @param array $payload
	 * @return mixed
	 */
	private function set_returned_token( $payload ) {
		// We remove anything else
		$service = subscription_service();
		$this->assertTrue( is_a( $service, '\Tests\Automattic\Jetpack\Extensions\Premium_Content\Test_Jetpack_Token_Subscription_Service' ) );
		$_GET['token'] = JWT::encode( $payload, $service->get_key() );
	}

	private function set_up_users_and_plans() {
		// We create a paid subscriber
		$paid_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test-paid@example.com',
			)
		);

		$regular_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test-subscriber@example.com',
			)
		);

		$non_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test@example.com',
			)
		);

		// We create a plan
		$plan_id = $this->factory->post->create(
			array(
				'post_type' => Jetpack_Memberships::$post_type_plan,
			)
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $this->product_id );
		$this->factory->post->create();

		// We set the plan to the paid_subscriber_id
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subscriptions, $subscriber_id ) use ( $paid_subscriber_id, $plan_id ) {
				if ( $subscriber_id === $paid_subscriber_id ) {
					$subscriptions = array_merge( $subscriptions, array( $plan_id ) );
				}

				return $subscriptions;
			},
			10,
			2
		);

		return array( $non_subscriber_id, $regular_subscriber_id, $paid_subscriber_id, $plan_id );
	}

	/**
	 * Admin has access all the time
	 *
	 * @return void
	 */
	public function test_access_check_current_visitor_can_access_admin() {
		$admin_user_id = $this->factory->user->create(
			array(
				'user_email' => 'test-admin@example.com',
			)
		);

		get_user_by( 'id', $admin_user_id )->add_role( 'administrator' );
		$post_id         = $this->factory->post->create();
		$GLOBALS['post'] = get_post( $post_id );
		wp_set_current_user( $admin_user_id );
		$this->assertTrue( current_visitor_can_access( array(), array() ) );
	}

	/**
	 * Test current_visitor_can_access works for different types of users
	 *
	 * @return void
	 */
	public function test_access_check_current_visitor_can_access_regular_users() {
		$users_plans           = $this->set_up_users_and_plans();
		$non_subscriber_id     = $users_plans[0];
		$regular_subscriber_id = $users_plans[1];
		$paid_subscriber_id    = $users_plans[2];
		$plan_id               = $users_plans[3];
		$selected_plan_ids     = array( $plan_id );

		// We setup the token for the regular user
		wp_set_current_user( $non_subscriber_id );
		$payload = $this->get_payload( false, false );
		$this->set_returned_token( $payload );
		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => $selected_plan_ids ), array() ) );

		// We setup the token for the regular subscriber
		wp_set_current_user( $regular_subscriber_id );
		$payload = $this->get_payload( true, false );
		$this->set_returned_token( $payload );
		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => $selected_plan_ids ), array() ) );

		// We setup the token for the paid user
		wp_set_current_user( $paid_subscriber_id );
		$payload = $this->get_payload( true, true );
		$this->set_returned_token( $payload );
		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => $selected_plan_ids ), array() ) );
	}

	/**
	 * Atomic regression: a logged-in subscriber whose local user_id differs from their
	 * WPCOM user_id (the common case on Atomic, where the local wp_users table is
	 * autoincrement-independent from WPCOM global IDs) must still get access when their
	 * subscription is registered against the WPCOM id and the bridge is recorded in
	 * the `wpcom_user_id` user_meta.
	 *
	 * Without the fix, `current_visitor_can_access` only runs the
	 * `earn_get_user_subscriptions_for_site_id` filter when `is_wpcom_simple()` is true,
	 * so Atomic-hosted subscribers fall through to the JWT-cookie-only path and get gated.
	 *
	 * See https://linear.app/a8c/issue/CM-584
	 *
	 * @return void
	 */
	public function test_access_check_atomic_logged_in_tier_subscriber_uses_wpcom_user_id_meta() {
		$plan_id = $this->factory->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $this->product_id );
		update_post_meta( $plan_id, 'jetpack_memberships_type', Jetpack_Memberships::$type_tier );
		update_post_meta( $plan_id, 'jetpack_memberships_price', 15 );
		update_post_meta( $plan_id, 'jetpack_memberships_currency', 'CAD' );
		update_post_meta( $plan_id, 'jetpack_memberships_interval', '1 year' );

		$local_user_id = $this->factory->user->create(
			array( 'user_email' => 'atomic-subscriber@example.test' )
		);

		// Simulate Atomic: the WPCOM-side identity has a different ID than the local one.
		// SSO populates this user_meta as the bridge.
		$wpcom_user_id = 999999;
		update_user_meta( $local_user_id, 'wpcom_user_id', $wpcom_user_id );

		// Simulate Atomic: the local blog id (get_current_blog_id()) is independent from the
		// WordPress.com blog id. The Memberships filter only knows the WPCOM blog id, which the
		// subscription service resolves via Jetpack_Options. Make them deliberately different so
		// passing get_current_blog_id() to the filter would query the wrong site and fail.
		$wpcom_blog_id = 555;
		\Jetpack_Options::update_option( 'id', $wpcom_blog_id );
		$this->assertNotSame( $wpcom_blog_id, get_current_blog_id() );

		// The `earn_get_user_subscriptions_for_site_id` filter at WPCOM only knows about
		// WPCOM user IDs and the WPCOM blog id. It returns nothing when queried with a local
		// Atomic user_id or the local blog id.
		$product_id = $this->product_id;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subscriptions, $subscriber_id, $site_id ) use ( $wpcom_user_id, $wpcom_blog_id, $product_id ) {
				if ( (int) $subscriber_id === $wpcom_user_id && (int) $site_id === $wpcom_blog_id ) {
					$subscriptions[] = array(
						'product_id' => $product_id,
						'status'     => 'active',
						'end_date'   => gmdate( 'Y-m-d H:i:s', time() + HOUR_IN_SECONDS ),
					);
				}
				return $subscriptions;
			},
			10,
			3
		);

		wp_set_current_user( $local_user_id );
		// Intentionally do NOT set a JWT token — this simulates a returning subscriber
		// whose premium-content cookie expired or was never issued.

		$this->assertTrue(
			current_visitor_can_access(
				array( 'selectedPlanIds' => array( $plan_id ) ),
				array()
			)
		);
	}

	/**
	 * A freshly-verified magic-link token whose blog_subscriber email matches the local
	 * account's own email should self-heal the wpcom_user_id link (NL-805), so future
	 * requests can resolve subscriptions via the authoritative filter without another
	 * magic-link round trip once the token/cookie expires.
	 *
	 * @return void
	 */
	public function test_get_and_set_token_from_request_links_wpcom_user_id_when_email_matches() {
		$local_user_id = $this->factory->user->create(
			array( 'user_email' => 'matching@example.test' )
		);
		$wpcom_user_id = 999999;

		wp_set_current_user( $local_user_id );
		$this->assertSame( '', get_user_meta( $local_user_id, 'wpcom_user_id', true ) );

		$this->set_returned_token(
			array(
				'user_id'         => $wpcom_user_id,
				'blog_subscriber' => 'matching@example.test',
				'subscriptions'   => array(),
			)
		);

		subscription_service()->get_and_set_token_from_request();

		$this->assertSame( $wpcom_user_id, (int) get_user_meta( $local_user_id, 'wpcom_user_id', true ) );
	}

	/**
	 * The email match must be case-insensitive -- WordPress itself normalizes emails to
	 * lowercase in some paths but not all, and email addresses are case-insensitive by
	 * convention.
	 *
	 * @return void
	 */
	public function test_get_and_set_token_from_request_links_wpcom_user_id_with_case_insensitive_email_match() {
		$local_user_id = $this->factory->user->create(
			array( 'user_email' => 'Matching@Example.Test' )
		);
		$wpcom_user_id = 999999;

		wp_set_current_user( $local_user_id );
		$this->set_returned_token(
			array(
				'user_id'         => $wpcom_user_id,
				'blog_subscriber' => 'matching@example.test',
				'subscriptions'   => array(),
			)
		);

		subscription_service()->get_and_set_token_from_request();

		$this->assertSame( $wpcom_user_id, (int) get_user_meta( $local_user_id, 'wpcom_user_id', true ) );
	}

	/**
	 * A local account must never be linked to whichever WordPress.com session happens to
	 * be active in the browser (e.g. a shared device) when the two aren't otherwise the
	 * same person -- only a matching email is trusted as confirmation. The local
	 * account's own stored email is never proof of identity by itself (see NL-787's
	 * account-impersonation concern), so a mismatch must not link anything.
	 *
	 * @return void
	 */
	public function test_get_and_set_token_from_request_does_not_link_when_email_mismatch() {
		$local_user_id = $this->factory->user->create(
			array( 'user_email' => 'local-account@example.test' )
		);

		wp_set_current_user( $local_user_id );
		$this->set_returned_token(
			array(
				'user_id'         => 999999,
				'blog_subscriber' => 'someone-else@example.test',
				'subscriptions'   => array(),
			)
		);

		subscription_service()->get_and_set_token_from_request();

		$this->assertSame( '', get_user_meta( $local_user_id, 'wpcom_user_id', true ) );
	}

	/**
	 * An anonymous visitor (e.g. arriving via a ?token= magic link from a newsletter
	 * email, with no local WordPress session at all) has no local account to link --
	 * this must not error, and the token must still be returned normally.
	 *
	 * @return void
	 */
	public function test_get_and_set_token_from_request_does_not_link_when_not_logged_in() {
		wp_set_current_user( 0 );
		$this->set_returned_token(
			array(
				'user_id'         => 999999,
				'blog_subscriber' => 'someone@example.test',
				'subscriptions'   => array(),
			)
		);

		$token = subscription_service()->get_and_set_token_from_request();

		$this->assertNotEmpty( $token, 'The token should still be returned even with no local user to link.' );
	}

	/**
	 * A stale wpcom_user_id (e.g. left over from a previous WordPress.com account that
	 * used to own this email) must be corrected to match the freshly-verified token, not
	 * left alone just because some value was already present.
	 *
	 * @return void
	 */
	public function test_get_and_set_token_from_request_updates_stale_wpcom_user_id() {
		$local_user_id = $this->factory->user->create(
			array( 'user_email' => 'matching@example.test' )
		);
		update_user_meta( $local_user_id, 'wpcom_user_id', 111111 );

		wp_set_current_user( $local_user_id );
		$this->set_returned_token(
			array(
				'user_id'         => 999999,
				'blog_subscriber' => 'matching@example.test',
				'subscriptions'   => array(),
			)
		);

		subscription_service()->get_and_set_token_from_request();

		$this->assertSame( 999999, (int) get_user_meta( $local_user_id, 'wpcom_user_id', true ) );
	}

	/**
	 * Once the meta already matches the token, no redundant meta write should happen.
	 *
	 * @return void
	 */
	public function test_get_and_set_token_from_request_does_not_rewrite_when_already_linked() {
		$local_user_id = $this->factory->user->create(
			array( 'user_email' => 'matching@example.test' )
		);
		update_user_meta( $local_user_id, 'wpcom_user_id', 999999 );

		wp_set_current_user( $local_user_id );
		$this->set_returned_token(
			array(
				'user_id'         => 999999,
				'blog_subscriber' => 'matching@example.test',
				'subscriptions'   => array(),
			)
		);

		$update_count = 0;
		add_action(
			'updated_user_meta',
			static function ( $meta_id, $user_id, $meta_key ) use ( &$update_count ) {
				if ( 'wpcom_user_id' === $meta_key ) {
					++$update_count;
				}
			},
			10,
			3
		);

		subscription_service()->get_and_set_token_from_request();

		$this->assertSame( 0, $update_count, 'No meta write should happen when the value is already correct.' );
	}

	/**
	 * Regression guard: a logged-in user without `wpcom_user_id` user_meta (the typical
	 * Jetpack self-hosted case) must still be granted access via the JWT cookie path.
	 *
	 * The fix for CM-584 introduces a logged-in branch that queries the
	 * `earn_get_user_subscriptions_for_site_id` filter. That filter is only registered on
	 * WPCOM-hosted sites; on Jetpack self-hosted it returns the empty default, so the
	 * code must fall back to the JWT-cookie subscription source.
	 *
	 * @return void
	 */
	public function test_access_check_logged_in_subscriber_falls_back_to_jwt_when_filter_returns_nothing() {
		$plan_id = $this->factory->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $this->product_id );
		update_post_meta( $plan_id, 'jetpack_memberships_type', Jetpack_Memberships::$type_tier );
		update_post_meta( $plan_id, 'jetpack_memberships_price', 5 );
		update_post_meta( $plan_id, 'jetpack_memberships_currency', 'USD' );
		update_post_meta( $plan_id, 'jetpack_memberships_interval', '1 month' );

		$user_id = $this->factory->user->create(
			array( 'user_email' => 'selfhosted-subscriber@example.test' )
		);
		// Intentionally no `wpcom_user_id` user_meta — simulating Jetpack self-hosted.
		// No filter registered for `earn_get_user_subscriptions_for_site_id` either.

		wp_set_current_user( $user_id );
		$this->set_returned_token( $this->get_payload( true, true ) );

		$this->assertTrue(
			current_visitor_can_access(
				array( 'selectedPlanIds' => array( $plan_id ) ),
				array()
			)
		);
	}

	/**
	 * `maybe_renew_session_cookie` mints a fresh JWT when authoritative subscriptions exist
	 * and the visitor has no premium-content session cookie. The encoded token must round-trip
	 * through `decode_token` and yield the same `user_id` and `subscriptions` that came in.
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_mints_jwt_when_subscriptions_present_and_no_cookie() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );

		$paywall     = subscription_service();
		$raw         = array(
			array(
				'product_id' => $this->product_id,
				'status'     => 'active',
				'end_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
			),
		);
		$abbreviated = \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $raw );

		$token = maybe_renew_session_cookie( $paywall, 999999, $abbreviated );

		$this->assertIsString( $token );
		$payload = $paywall->decode_token( $token );
		$this->assertIsArray( $payload );
		$this->assertSame( 999999, (int) $payload['user_id'] );
		$subscriptions = (array) $payload['subscriptions'];
		$this->assertArrayHasKey( $this->product_id, $subscriptions );
		$this->assertSame( 'active', $subscriptions[ $this->product_id ]->status );
	}

	/**
	 * `maybe_renew_session_cookie` no-ops when there are no subscriptions to wrap.
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_returns_null_when_no_subscriptions() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );
		$paywall = subscription_service();
		$this->assertNull( maybe_renew_session_cookie( $paywall, 999999, array() ) );
	}

	/**
	 * `maybe_renew_session_cookie` no-ops when the visitor already has a session cookie —
	 * we don't want to clobber a valid token on every page load.
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_returns_null_when_cookie_already_present() {
		$paywall                                  = subscription_service();
		$existing_token                           = JWT::encode( $this->get_payload( true, true ), $paywall->get_key() );
		$_COOKIE['wp-jp-premium-content-session'] = $existing_token;

		$raw         = array(
			array(
				'product_id' => $this->product_id,
				'status'     => 'active',
				'end_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
			),
		);
		$abbreviated = \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $raw );

		$this->assertNull( maybe_renew_session_cookie( $paywall, 999999, $abbreviated ) );

		unset( $_COOKIE['wp-jp-premium-content-session'] );
	}

	/**
	 * `maybe_renew_session_cookie` should replace an invalid existing cookie instead of
	 * treating mere cookie presence as a valid cached session.
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_mints_jwt_when_existing_cookie_is_invalid() {
		$paywall                                  = subscription_service();
		$_COOKIE['wp-jp-premium-content-session'] = 'not-a-valid-jwt';

		$raw         = array(
			array(
				'product_id' => $this->product_id,
				'status'     => 'active',
				'end_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
			),
		);
		$abbreviated = \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $raw );

		$token = maybe_renew_session_cookie( $paywall, 999999, $abbreviated );

		$this->assertIsString( $token );
		$payload = $paywall->decode_token( $token );
		$this->assertIsArray( $payload );
		$this->assertSame( 999999, (int) $payload['user_id'] );

		unset( $_COOKIE['wp-jp-premium-content-session'] );
	}

	/**
	 * `maybe_renew_session_cookie` should mint its token from normalized subscriptions so
	 * inactive subscriptions are omitted and comp grants keep their tier-gating flag.
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_uses_normalized_subscriptions_for_payload() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );

		$paywall             = subscription_service();
		$comp_product_id     = $this->product_id;
		$inactive_product_id = $this->product_id + 1;
		$raw                 = array(
			array(
				'product_id' => $comp_product_id,
				'status'     => 'active',
				'end_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
				'is_comp'    => true,
			),
			array(
				'product_id' => $inactive_product_id,
				'status'     => 'inactive',
				'end_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
			),
		);
		$abbreviated         = \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $raw );

		$token = maybe_renew_session_cookie( $paywall, 999999, $abbreviated );

		$this->assertIsString( $token );
		$payload       = $paywall->decode_token( $token );
		$subscriptions = (array) $payload['subscriptions'];
		$this->assertArrayHasKey( $comp_product_id, $subscriptions );
		$this->assertObjectHasProperty( 'is_comp', $subscriptions[ $comp_product_id ] );
		$this->assertTrue( $subscriptions[ $comp_product_id ]->is_comp );
		$this->assertArrayNotHasKey( $inactive_product_id, $subscriptions );
	}

	/**
	 * `maybe_renew_session_cookie` must populate the $_COOKIE superglobal with the freshly
	 * minted token so the render path can read it within the same request (no double filter
	 * round-trip on the first visit).
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_populates_cookie_superglobal() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );

		$paywall     = subscription_service();
		$raw         = array(
			array(
				'product_id' => $this->product_id,
				'status'     => 'active',
				'end_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
			),
		);
		$abbreviated = \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $raw );

		$token = maybe_renew_session_cookie( $paywall, 999999, $abbreviated );

		$this->assertSame( $token, $_COOKIE['wp-jp-premium-content-session'] );

		unset( $_COOKIE['wp-jp-premium-content-session'] );
	}

	/**
	 * `maybe_renew_session_cookie` no-ops when the signing key is unavailable — we cannot mint a
	 * valid token, so the caller must fall back to the live filter rather than set a bogus cookie.
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_returns_null_without_signing_key() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );

		// No cookie is set, so `has_token_from_cookie()` is false and `decode_token()` is never
		// reached; the stub only needs to report a missing signing key.
		$keyless_paywall = new class() {
			public function get_key() {
				return false;
			}
		};

		$raw         = array(
			array(
				'product_id' => $this->product_id,
				'status'     => 'active',
				'end_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
			),
		);
		$abbreviated = \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $raw );

		$this->assertNull( maybe_renew_session_cookie( $keyless_paywall, 999999, $abbreviated ) );
		$this->assertArrayNotHasKey( 'wp-jp-premium-content-session', $_COOKIE );
	}

	/**
	 * Option A (cookie-first): a logged-in visitor whose valid session cookie already grants
	 * the tier must be served from the cookie WITHOUT querying the WPCOM filter — that is the
	 * fast cached path the self-heal exists to enable.
	 *
	 * @return void
	 */
	public function test_access_check_logged_in_with_valid_cookie_skips_filter() {
		unset( $_GET['token'] );

		$plan_id = $this->factory->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $this->product_id );
		update_post_meta( $plan_id, 'jetpack_memberships_type', Jetpack_Memberships::$type_tier );
		update_post_meta( $plan_id, 'jetpack_memberships_price', 15 );
		update_post_meta( $plan_id, 'jetpack_memberships_currency', 'CAD' );
		update_post_meta( $plan_id, 'jetpack_memberships_interval', '1 year' );

		$local_user_id = $this->factory->user->create();
		update_user_meta( $local_user_id, 'wpcom_user_id', 999999 );
		wp_set_current_user( $local_user_id );

		// A valid cookie that already grants the tier's product.
		$paywall                                  = subscription_service();
		$_COOKIE['wp-jp-premium-content-session'] = JWT::encode( $this->get_payload( true, true ), $paywall->get_key() );

		$filter_calls = 0;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subs ) use ( &$filter_calls ) {
				++$filter_calls;
				return $subs;
			},
			10,
			1
		);

		$can_view = current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() );

		$this->assertTrue( $can_view );
		$this->assertSame( 0, $filter_calls, 'Filter must not be queried when a valid cookie is present.' );

		unset( $_COOKIE['wp-jp-premium-content-session'] );
	}

	/**
	 * The template_redirect pre-warm hook mints the session cookie before output when the
	 * viewed post contains the block, the visitor is logged in, and no valid cookie exists.
	 *
	 * @return void
	 */
	public function test_prewarm_mints_cookie_when_block_present_and_no_cookie() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );
		unset( $_GET['token'] );

		$post_id = $this->factory->post->create(
			array( 'post_content' => '<!-- wp:premium-content/container --><!-- /wp:premium-content/container -->' )
		);

		$local_user_id = $this->factory->user->create();
		update_user_meta( $local_user_id, 'wpcom_user_id', 999999 );

		$product_id = $this->product_id;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subs, $subscriber_id ) use ( $product_id ) {
				if ( (int) $subscriber_id === 999999 ) {
					$subs[] = array(
						'product_id' => $product_id,
						'status'     => 'active',
						'end_date'   => gmdate( 'Y-m-d H:i:s', time() + HOUR_IN_SECONDS ),
					);
				}
				return $subs;
			},
			10,
			2
		);

		$this->go_to( get_permalink( $post_id ) );
		wp_set_current_user( $local_user_id );

		prewarm_premium_content_session_cookie();

		$this->assertNotEmpty( $_COOKIE['wp-jp-premium-content-session'] );
		$payload = subscription_service()->decode_token( $_COOKIE['wp-jp-premium-content-session'] );
		$this->assertSame( 999999, (int) $payload['user_id'] );

		unset( $_COOKIE['wp-jp-premium-content-session'] );
	}

	/**
	 * The pre-warm hook does nothing when the viewed post does not contain the block, so we
	 * never pay the filter round-trip on unrelated pages.
	 *
	 * @return void
	 */
	public function test_prewarm_noop_when_block_absent() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );
		unset( $_GET['token'] );

		$post_id = $this->factory->post->create(
			array( 'post_content' => 'Just a regular post with no premium content.' )
		);

		$local_user_id = $this->factory->user->create();
		update_user_meta( $local_user_id, 'wpcom_user_id', 999999 );

		$filter_calls = 0;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subs ) use ( &$filter_calls ) {
				++$filter_calls;
				return $subs;
			},
			10,
			1
		);

		$this->go_to( get_permalink( $post_id ) );
		wp_set_current_user( $local_user_id );

		prewarm_premium_content_session_cookie();

		$this->assertArrayNotHasKey( 'wp-jp-premium-content-session', $_COOKIE );
		$this->assertSame( 0, $filter_calls, 'Filter must not be queried on pages without the block.' );
	}

	/**
	 * The pre-warm hook does nothing for logged-out visitors — they rely on the `?token=` magic
	 * link, not a minted session cookie.
	 *
	 * @return void
	 */
	public function test_prewarm_noop_when_not_logged_in() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );
		wp_set_current_user( 0 );

		prewarm_premium_content_session_cookie();

		$this->assertArrayNotHasKey( 'wp-jp-premium-content-session', $_COOKIE );
	}

	/**
	 * The pre-warm hook bails (without querying the filter) when a valid session cookie already
	 * exists — there is nothing to heal and we must not pay the WPCOM round-trip.
	 *
	 * @return void
	 */
	public function test_prewarm_noop_when_valid_cookie_present() {
		unset( $_GET['token'] );

		$post_id = $this->factory->post->create(
			array( 'post_content' => '<!-- wp:premium-content/container --><!-- /wp:premium-content/container -->' )
		);

		$local_user_id = $this->factory->user->create();
		update_user_meta( $local_user_id, 'wpcom_user_id', 999999 );

		$paywall                                  = subscription_service();
		$_COOKIE['wp-jp-premium-content-session'] = JWT::encode( $this->get_payload( true, true ), $paywall->get_key() );

		$filter_calls = 0;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subs ) use ( &$filter_calls ) {
				++$filter_calls;
				return $subs;
			},
			10,
			1
		);

		$this->go_to( get_permalink( $post_id ) );
		wp_set_current_user( $local_user_id );

		prewarm_premium_content_session_cookie();

		$this->assertSame( 0, $filter_calls, 'Pre-warm must not query the filter when a valid cookie already exists.' );

		unset( $_COOKIE['wp-jp-premium-content-session'] );
	}

	/**
	 * The pre-warm hook does nothing for users who can edit the post — they already bypass
	 * gating in current_visitor_can_access(), so there is no cookie to mint and we must not
	 * pay the Memberships filter round-trip.
	 *
	 * @return void
	 */
	public function test_prewarm_noop_for_editors() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );
		unset( $_GET['token'] );

		$post_id = $this->factory->post->create(
			array( 'post_content' => '<!-- wp:premium-content/container --><!-- /wp:premium-content/container -->' )
		);

		$editor_id = $this->factory->user->create( array( 'role' => 'administrator' ) );

		$filter_calls = 0;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subs ) use ( &$filter_calls ) {
				++$filter_calls;
				return $subs;
			},
			10,
			1
		);

		$this->go_to( get_permalink( $post_id ) );
		wp_set_current_user( $editor_id );

		prewarm_premium_content_session_cookie();

		$this->assertSame( 0, $filter_calls, 'Pre-warm must not query the filter for users who can edit the post.' );
		$this->assertArrayNotHasKey( 'wp-jp-premium-content-session', $_COOKIE );
	}

	/**
	 * Test that plan id can be passed 2 ways
	 *
	 * @return void
	 */
	public function test_access_check_current_visitor_can_access_passing_plan_id() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$payload = $this->get_payload( true, true );
		$this->set_returned_token( $payload );
		// We check it fails if the plan is not passed
		$this->assertFalse( current_visitor_can_access( array(), array() ) );

		// The plan id can be passed in 2 ways.
		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		$this->assertTrue( current_visitor_can_access( array(), (object) array( 'context' => array( 'premium-content/planIds' => array( $plan_id ) ) ) ) );
	}

	/**
	 * Helper: build a mock 200 response from the refresh endpoint with a fresh JWT
	 * containing a subscription that expires in the future.
	 *
	 * @return array
	 */
	private function build_refresh_success_response() {
		$service       = subscription_service();
		$fresh_payload = array(
			'blog_sub'      => 'active',
			'subscriptions' => array(
				$this->product_id => array(
					'status'     => 'active',
					'end_date'   => time() + HOUR_IN_SECONDS,
					'product_id' => $this->product_id,
				),
			),
		);
		$fresh_token   = JWT::encode( $fresh_payload, $service->get_key() );
		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode(
				array(
					'success'   => true,
					'jwt_token' => $fresh_token,
				),
				JSON_UNESCAPED_SLASHES
			),
			'headers'  => array(),
			'cookies'  => array(),
		);
	}

	/**
	 * When the token contains a stale (expired) end_date and the refresh endpoint
	 * returns a fresh token with a valid subscription, access should be granted.
	 * This covers the core renewal lockout bug.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_grants_access_on_successful_refresh() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		// Stale token — end_date in the past.
		$stale_payload = $this->get_payload( true, true, time() - 2 * DAY_IN_SECONDS );
		$this->set_returned_token( $stale_payload );

		// Refresh endpoint returns a fresh token with a valid future end_date.
		$this->refresh_response_override = $this->build_refresh_success_response();

		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
	}

	/**
	 * Newsletter-tier subscribers (`jetpack_memberships_type=tier`) route through
	 * `maybe_gate_access_for_user_if_tier` in access-check.php rather than the
	 * non-tier `visitor_can_view_content` path. Verify that the refresh-before-deny
	 * logic also fires for the tier path when the token references the requested
	 * tier's product_id but with a stale end_date. This is the population most
	 * likely to hit the renewal-lockout bug in production.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_grants_tier_access_on_successful_refresh() {
		$paid_subscriber_id = $this->factory->user->create(
			array( 'user_email' => 'tier-paid@example.com' )
		);
		wp_set_current_user( $paid_subscriber_id );

		// Create a newsletter tier whose product_id matches the test's token product_id.
		$tier_plan_id = $this->factory->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $tier_plan_id, 'jetpack_memberships_product_id', $this->product_id );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_site_subscriber', true );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_price', 10 );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_currency', 'USD' );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_interval', '1 month' );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_type', 'tier' );

		// Stale token — product_id matches the tier, but end_date is past.
		$stale_payload = $this->get_payload( true, true, time() - 2 * DAY_IN_SECONDS );
		$this->set_returned_token( $stale_payload );

		$this->refresh_response_override = $this->build_refresh_success_response();

		$this->assertTrue(
			current_visitor_can_access(
				array( 'selectedPlanIds' => array( $tier_plan_id ) ),
				array()
			),
			'Tier subscriber with a stale end_date should regain access after the refresh.'
		);
		$this->assertSame( 1, $this->refresh_call_count, 'Refresh endpoint should be called exactly once for the tier path.' );
	}

	/**
	 * The tier path should NOT trigger a refresh when the token has no subscription
	 * matching any of the required tiers — same narrowing as the non-tier path, to
	 * keep refresh traffic limited to the renewal-stale case (not free subscribers
	 * or tier mismatches).
	 *
	 * @return void
	 */
	public function test_refresh_not_called_for_tier_when_token_has_no_matching_product() {
		$regular_subscriber_id = $this->factory->user->create(
			array( 'user_email' => 'tier-free@example.com' )
		);
		wp_set_current_user( $regular_subscriber_id );

		$tier_plan_id = $this->factory->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $tier_plan_id, 'jetpack_memberships_product_id', $this->product_id );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_site_subscriber', true );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_price', 10 );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_currency', 'USD' );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_interval', '1 month' );
		update_post_meta( $tier_plan_id, 'jetpack_memberships_type', 'tier' );

		// Free subscriber: blog_sub active, no paid subscriptions in token.
		$payload = $this->get_payload( true, false );
		$this->set_returned_token( $payload );

		$this->assertFalse(
			current_visitor_can_access(
				array( 'selectedPlanIds' => array( $tier_plan_id ) ),
				array()
			)
		);
		$this->assertSame( 0, $this->refresh_call_count, 'Refresh endpoint must not fire for a free subscriber on a tier-gated post.' );
	}

	/**
	 * When the refresh endpoint returns 200 with a token whose subscriptions no
	 * longer include the required plan (e.g. the subscription was cancelled),
	 * access should be denied.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_denies_when_fresh_token_has_no_subscription() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$stale_payload = $this->get_payload( true, true, time() - 2 * DAY_IN_SECONDS );
		$this->set_returned_token( $stale_payload );

		// Refresh returns a token with no subscriptions (cancelled).
		$service                         = subscription_service();
		$empty_token                     = JWT::encode(
			array(
				'blog_sub'      => 'active',
				'subscriptions' => array(),
			),
			$service->get_key()
		);
		$this->refresh_response_override = array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode(
				array(
					'success'   => true,
					'jwt_token' => $empty_token,
				),
				JSON_UNESCAPED_SLASHES
			),
			'headers'  => array(),
			'cookies'  => array(),
		);

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
	}

	/**
	 * 200 + `{ success: true }` but with a missing / non-string `jwt_token` is a
	 * malformed response shape, not an auth failure. Treat as transient: deny
	 * access (no fresh token to validate against), but DON'T clear the cookie —
	 * otherwise a server-side response-shape bug at wpcom would mass-log-out
	 * subscribers.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_treats_malformed_success_as_transient() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$stale_payload                            = $this->get_payload( true, true, time() - 2 * DAY_IN_SECONDS );
		$service                                  = subscription_service();
		$token_string                             = JWT::encode( $stale_payload, $service->get_key() );
		$_COOKIE['wp-jp-premium-content-session'] = $token_string;
		$_GET['token']                            = $token_string;

		// success: true but no jwt_token field — malformed response.
		$this->refresh_response_override = array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode( array( 'success' => true ), JSON_UNESCAPED_SLASHES ),
			'headers'  => array(),
			'cookies'  => array(),
		);

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		$this->assertSame( 1, $this->refresh_call_count, 'Refresh should have been attempted.' );
		$this->assertSame( $token_string, $_COOKIE['wp-jp-premium-content-session'] ?? null, 'Cookie must be preserved on malformed success response so the next request can retry.' );
	}

	/**
	 * When the refresh endpoint returns a transient failure (5xx), access is
	 * denied AND the cookie is left intact — this is what distinguishes the
	 * transient branch from the deterministic `success: false` branch, so we
	 * assert both halves explicitly.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_denies_on_transient_failure() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$stale_payload                            = $this->get_payload( true, true, time() - 2 * DAY_IN_SECONDS );
		$service                                  = subscription_service();
		$token_string                             = JWT::encode( $stale_payload, $service->get_key() );
		$_COOKIE['wp-jp-premium-content-session'] = $token_string;
		$_GET['token']                            = $token_string;

		$this->refresh_response_override = array(
			'response' => array(
				'code'    => 500,
				'message' => 'Server Error',
			),
			'body'     => '',
			'headers'  => array(),
			'cookies'  => array(),
		);

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		$this->assertSame( 1, $this->refresh_call_count, 'Refresh should have been attempted for a stale token with matching product_id.' );
		$this->assertSame( $token_string, $_COOKIE['wp-jp-premium-content-session'] ?? null, 'Cookie must be preserved on transient failure so the next request can retry.' );
	}

	/**
	 * When the refresh endpoint returns 200 + { success: false } (wpcom refused the
	 * refresh — token no longer eligible, or signature/site/user check failed),
	 * access is denied AND the cookie is cleared so the subscriber re-authenticates
	 * on next visit.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_clears_cookie_on_unauthorized() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$stale_payload                            = $this->get_payload( true, true, time() - 2 * DAY_IN_SECONDS );
		$service                                  = subscription_service();
		$token_string                             = JWT::encode( $stale_payload, $service->get_key() );
		$_COOKIE['wp-jp-premium-content-session'] = $token_string;
		$_GET['token']                            = $token_string;

		$this->refresh_response_override = array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode(
				array(
					'success' => false,
					'error'   => 'token-too-old',
				),
				JSON_UNESCAPED_SLASHES
			),
			'headers'  => array(),
			'cookies'  => array(),
		);

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		// Cookie should be cleared from $_COOKIE (cannot assert setcookie header from PHPUnit).
		$this->assertArrayNotHasKey( 'wp-jp-premium-content-session', $_COOKIE );
	}

	/**
	 * A WP_Error from the HTTP layer (e.g. network timeout) is treated the same
	 * as a 5xx: deny access, leave the cookie intact for the next request to retry.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_treats_wp_error_as_transient() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$stale_payload                            = $this->get_payload( true, true, time() - 2 * DAY_IN_SECONDS );
		$service                                  = subscription_service();
		$token_string                             = JWT::encode( $stale_payload, $service->get_key() );
		$_COOKIE['wp-jp-premium-content-session'] = $token_string;
		$_GET['token']                            = $token_string;

		$this->refresh_response_override = new WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out' );

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		$this->assertSame( 1, $this->refresh_call_count, 'Refresh should have been attempted for a stale token with matching product_id.' );
		$this->assertSame( $token_string, $_COOKIE['wp-jp-premium-content-session'] ?? null, 'Cookie must be preserved on WP_Error so the next request can retry.' );
	}

	/**
	 * A token with no subscription matching any required plan (free subscriber on a
	 * paid post, or tier mismatch) must NOT trigger a refresh — refresh can only
	 * resolve stale-end_date for an existing matching subscription, not conjure a
	 * subscription that never existed. This guards against refresh-on-every-render
	 * for the (much larger) never-paid and tier-mismatch populations.
	 *
	 * @return void
	 */
	public function test_refresh_not_called_when_token_has_no_matching_product() {
		$users_plans           = $this->set_up_users_and_plans();
		$regular_subscriber_id = $users_plans[1];
		$plan_id               = $users_plans[3];

		wp_set_current_user( $regular_subscriber_id );
		// Free subscriber: blog_sub active, no paid subscriptions in token.
		$payload = $this->get_payload( true, false );
		$this->set_returned_token( $payload );

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		$this->assertSame( 0, $this->refresh_call_count, 'Refresh endpoint should not be called when the token has no matching product_id.' );
	}

	/**
	 * An active subscription with a future end_date should not trigger a refresh
	 * at all — no HTTP call is made.
	 *
	 * @return void
	 */
	public function test_refresh_not_called_when_subscription_is_active() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$valid_payload = $this->get_payload( true, true, time() + HOUR_IN_SECONDS );
		$this->set_returned_token( $valid_payload );

		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		$this->assertSame( 0, $this->refresh_call_count, 'Refresh endpoint should not be called when the token is still active.' );
	}

	/**
	 * Create a plan post mapped to the test product_id and return its ID.
	 *
	 * @return int
	 */
	private function create_plan_for_product() {
		$plan_id = $this->factory->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $this->product_id );
		return $plan_id;
	}

	/**
	 * Build a token payload for a single active subscription with the given end_date.
	 *
	 * @param int|string $subscription_end_date Unix timestamp or datetime string for the end_date.
	 * @return array
	 */
	private function get_subscription_payload( $subscription_end_date ) {
		return array(
			'blog_sub'      => 'active',
			'subscriptions' => array(
				$this->product_id => array(
					'status'     => 'active',
					'end_date'   => $subscription_end_date,
					'product_id' => $this->product_id,
				),
			),
		);
	}

	/**
	 * Core of the NL-735 fix: a subscription whose exact end_date timestamp has passed but whose
	 * end_date DAY is still today keeps access through end-of-day (UTC). This is the incident —
	 * a same-day auto-renewal that billing had not yet finished processing.
	 *
	 * @return void
	 */
	public function test_validate_subscriptions_grants_access_through_end_of_end_date_day() {
		$plan_id = $this->create_plan_for_product();
		// Start of today (UTC): the exact timestamp is in the past, but the day is not over.
		$expired_earlier_today = strtotime( gmdate( 'Y-m-d 00:00:00' ) . ' UTC' );
		$subs                  = array(
			$this->product_id => (object) array( 'end_date' => $expired_earlier_today ),
		);

		$this->assertTrue(
			Abstract_Token_Subscription_Service::validate_subscriptions( array( $plan_id ), $subs ),
			'A subscription whose end_date is earlier today should keep access until end of day.'
		);
	}

	/**
	 * Once the end_date day is fully over, access is denied — end-of-day is the boundary, not a
	 * multi-day grace.
	 *
	 * @return void
	 */
	public function test_validate_subscriptions_denies_access_after_end_of_end_date_day() {
		$plan_id = $this->create_plan_for_product();
		$subs    = array(
			$this->product_id => (object) array( 'end_date' => time() - DAY_IN_SECONDS ),
		);

		$this->assertFalse(
			Abstract_Token_Subscription_Service::validate_subscriptions( array( $plan_id ), $subs ),
			'A subscription whose end_date day has fully passed should be denied.'
		);
	}

	/**
	 * Regression guard: a subscription with a future end_date still validates.
	 *
	 * @return void
	 */
	public function test_validate_subscriptions_grants_future_subscription() {
		$plan_id = $this->create_plan_for_product();
		$subs    = array(
			$this->product_id => (object) array( 'end_date' => time() + DAY_IN_SECONDS ),
		);

		$this->assertTrue(
			Abstract_Token_Subscription_Service::validate_subscriptions( array( $plan_id ), $subs )
		);
	}

	/**
	 * The end_date may be a datetime string (as memberships store it) rather than an int
	 * timestamp; end-of-day handling must work either way.
	 *
	 * @return void
	 */
	public function test_validate_subscriptions_handles_string_end_date_through_end_of_day() {
		$plan_id = $this->create_plan_for_product();
		$subs    = array(
			// A datetime string earlier today (UTC), the format memberships persist.
			$this->product_id => (object) array( 'end_date' => gmdate( 'Y-m-d 00:00:00' ) ),
		);

		$this->assertTrue(
			Abstract_Token_Subscription_Service::validate_subscriptions( array( $plan_id ), $subs ),
			'A string end_date earlier today should still grant access through end of day.'
		);
	}

	/**
	 * End-to-end mirror of the NL-735 incident on the non-tier path: a paid subscriber whose
	 * token end_date passed earlier today (a same-day auto-renewal still processing) keeps
	 * access — and, because validation succeeds directly, no refresh HTTP call is made.
	 *
	 * @return void
	 */
	public function test_access_check_grants_access_through_end_of_day() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$expired_earlier_today = strtotime( gmdate( 'Y-m-d 00:00:00' ) . ' UTC' );
		$this->set_returned_token( $this->get_subscription_payload( $expired_earlier_today ) );

		$this->assertTrue(
			current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ),
			'A subscriber whose end_date is earlier today should retain access through end of day.'
		);
		$this->assertSame( 0, $this->refresh_call_count, 'End-of-day access should be granted directly, without a refresh call.' );
	}

	/**
	 * Counterpart: once the end_date day has fully passed the token no longer grants access, and
	 * the refresh attempt (mocked to 500) cannot save it, so access is denied.
	 *
	 * @return void
	 */
	public function test_access_check_denies_after_end_of_day() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$this->set_returned_token( $this->get_subscription_payload( time() - 2 * DAY_IN_SECONDS ) );

		$this->assertFalse(
			current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ),
			'A subscription whose end_date day has passed should be denied.'
		);
	}

	/**
	 * Create a newsletter tier plan mapped to $product_id at the given monthly price.
	 *
	 * @param int $product_id The plan's WordPress.com product id.
	 * @param int $price      The plan's monthly price.
	 * @return int The plan post id.
	 */
	private function create_tier_plan( $product_id, $price ) {
		$plan_id = $this->factory->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $product_id );
		update_post_meta( $plan_id, 'jetpack_memberships_type', Jetpack_Memberships::$type_tier );
		update_post_meta( $plan_id, 'jetpack_memberships_price', $price );
		update_post_meta( $plan_id, 'jetpack_memberships_currency', 'USD' );
		update_post_meta( $plan_id, 'jetpack_memberships_interval', '1 month' );
		return $plan_id;
	}

	/**
	 * Build a token payload for a subscriber holding a single active subscription to $product_id.
	 *
	 * @param int $product_id The product id the subscriber holds.
	 * @return array
	 */
	private function tier_token_payload( $product_id ) {
		return array(
			'blog_sub'      => 'active',
			'subscriptions' => array(
				$product_id => array(
					'status'     => 'active',
					'end_date'   => time() + HOUR_IN_SECONDS,
					'product_id' => $product_id,
				),
			),
		);
	}

	/**
	 * Set up two newsletter tiers ($5 and $50) and a post restricted to the $50 tier.
	 *
	 * @return array{0:int,1:int,2:int,3:int} [ post_id, pricey_plan_id, cheap_product_id, pricey_product_id ]
	 */
	private function set_up_two_tier_gated_post() {
		$cheap_product_id  = 5001;
		$pricey_product_id = 5002;

		$this->create_tier_plan( $cheap_product_id, 5 );
		$pricey_plan_id = $this->create_tier_plan( $pricey_product_id, 50 );

		$post_id = $this->factory->post->create();
		update_post_meta( $post_id, Jetpack_Memberships::$post_access_level_meta_name, Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS );
		update_post_meta( $post_id, Jetpack_Memberships::$post_access_tier_meta_name, $pricey_plan_id );

		return array( $post_id, $pricey_plan_id, $cheap_product_id, $pricey_product_id );
	}

	/**
	 * A cheaper-tier subscriber is denied a higher-tier post when checked outside the loop, as during a render.
	 *
	 * @return void
	 */
	public function test_user_can_view_post_enforces_tier_when_checked_outside_the_loop() {
		list( $post_id, , $cheap_product_id ) = $this->set_up_two_tier_gated_post();

		// An anonymous visitor identified only by their memberships token.
		wp_set_current_user( 0 );
		$this->set_returned_token( $this->tier_token_payload( $cheap_product_id ) );

		// Guard against test order: an earlier test may have left $GLOBALS['post'] set, which would
		// make get_the_ID() return an id instead of false and mask the outside-the-loop condition.
		unset( $GLOBALS['post'] );

		// Precondition: this really runs outside the loop.
		$this->assertFalse( get_the_ID(), 'Precondition: the test must run outside the loop.' );

		$this->assertFalse(
			Jetpack_Memberships::user_can_view_post( $post_id ),
			'A subscriber on the cheaper tier must be denied a higher-tier post even when the check runs outside the loop.'
		);
	}

	/**
	 * A subscriber on the required tier is still granted access outside the loop.
	 *
	 * @return void
	 */
	public function test_user_can_view_post_grants_matching_tier_outside_the_loop() {
		list( $post_id, , , $pricey_product_id ) = $this->set_up_two_tier_gated_post();

		wp_set_current_user( 0 );
		$this->set_returned_token( $this->tier_token_payload( $pricey_product_id ) );

		// Guard against test order (see the companion test): keep this check genuinely outside the loop.
		unset( $GLOBALS['post'] );

		$this->assertTrue(
			Jetpack_Memberships::user_can_view_post( $post_id ),
			'A subscriber on the required tier must retain access outside the loop, confirming the fix does not over-deny.'
		);
	}

	/**
	 * Called with no id during a render, the check still resolves the loop post and denies a cheaper tier.
	 *
	 * @return void
	 */
	public function test_user_can_view_post_enforces_tier_in_the_loop_unchanged() {
		list( $post_id, , $cheap_product_id ) = $this->set_up_two_tier_gated_post();

		// Put the tier-gated post in the loop so get_the_ID() resolves it, then call with no id.
		$GLOBALS['post'] = get_post( $post_id );

		wp_set_current_user( 0 );
		$this->set_returned_token( $this->tier_token_payload( $cheap_product_id ) );

		// Precondition: we are in the loop and it resolves to the gated post.
		$this->assertSame( $post_id, get_the_ID(), 'Precondition: the test must run inside the loop on the gated post.' );

		$this->assertFalse(
			Jetpack_Memberships::user_can_view_post(),
			'A cheaper-tier subscriber must be denied a higher-tier post in the loop.'
		);

		unset( $GLOBALS['post'] );
	}

	/**
	 * The shared block gate expands tiers for an explicit post, so a $50 subscriber passes a $5 gate.
	 *
	 * @return void
	 */
	public function test_visitor_can_access_plan_ids_expands_tiers_for_an_explicit_post() {
		$cheap_product_id  = 6001;
		$pricey_product_id = 6002;

		$cheap_plan_id = $this->create_tier_plan( $cheap_product_id, 5 );
		$this->create_tier_plan( $pricey_product_id, 50 );

		$post_id = $this->factory->post->create();

		// The out-of-loop case the extraction exists for: no loop post to fall back on.
		wp_set_current_user( 0 );
		unset( $GLOBALS['post'] );
		$this->assertFalse( get_the_ID(), 'Precondition: the test must run outside the loop.' );

		$this->set_returned_token( $this->tier_token_payload( $pricey_product_id ) );

		$this->assertTrue(
			visitor_can_access_plan_ids( array( $cheap_plan_id ), $post_id ),
			'A subscriber on the pricier tier must be granted content gated to the cheaper tier, as they are on the page itself.'
		);
	}

	/**
	 * Tier expansion still denies a cheaper tier content gated to a pricier one.
	 *
	 * @return void
	 */
	public function test_visitor_can_access_plan_ids_still_denies_a_cheaper_tier() {
		$cheap_product_id  = 6003;
		$pricey_product_id = 6004;

		$this->create_tier_plan( $cheap_product_id, 5 );
		$pricey_plan_id = $this->create_tier_plan( $pricey_product_id, 50 );

		$post_id = $this->factory->post->create();

		wp_set_current_user( 0 );
		unset( $GLOBALS['post'] );

		$this->set_returned_token( $this->tier_token_payload( $cheap_product_id ) );

		$this->assertFalse(
			visitor_can_access_plan_ids( array( $pricey_plan_id ), $post_id ),
			'A subscriber on the cheaper tier must not reach content gated to a pricier tier.'
		);
	}

	/**
	 * @dataProvider subscription_editor_capabilities
	 * @param bool $can_read Whether the editor has the read capability.
	 */
	#[DataProvider( 'subscription_editor_capabilities' )]
	public function test_subscription_access_does_not_inherit_editor_preview( $can_read ) {
		$post_id = $this->create_subscription_editor_post( $can_read );
		$service = new Test_Jetpack_Token_Subscription_Service();
		$level   = Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS;

		$this->assertTrue( $service->visitor_can_view_content( array( 9999 ), $level, $post_id ) );
		$this->assertFalse( $service->visitor_has_subscription_access( array( 9999 ), $level, $post_id ) );
		$this->assertTrue( $service->visitor_can_view_content( array( 9999 ), $level, $post_id ) );
	}

	/**
	 * @dataProvider subscription_editor_capabilities
	 * @param bool $can_read Whether the editor has the read capability.
	 */
	#[DataProvider( 'subscription_editor_capabilities' )]
	public function test_subscription_access_does_not_reuse_cached_editor_membership_grant( $can_read ) {
		$post_id = $this->create_subscription_editor_post( $can_read );
		$plan_id = $this->create_tier_plan( 7001, 5 );
		update_post_meta( $post_id, Jetpack_Memberships::$post_access_level_meta_name, Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS );
		update_post_meta( $post_id, Jetpack_Memberships::$post_access_tier_meta_name, $plan_id );

		$this->assertTrue( Jetpack_Memberships::user_can_view_post( $post_id ) );
		$this->assertFalse( Jetpack_Memberships::user_has_subscription_access( $post_id ) );
		$this->assertTrue( Jetpack_Memberships::user_can_view_post( $post_id ) );
	}

	/**
	 * @dataProvider subscription_editor_plan_cases
	 * @param bool $can_read Whether the editor has the read capability.
	 * @param bool $is_tier Whether the block uses a newsletter tier.
	 */
	#[DataProvider( 'subscription_editor_plan_cases' )]
	public function test_block_subscription_access_does_not_inherit_editor_preview( $can_read, $is_tier ) {
		$post_id = $this->create_subscription_editor_post( $can_read );
		$plan_id = $is_tier ? $this->create_tier_plan( 7002, 5 ) : $this->create_subscription_plan( 7002 );

		$GLOBALS['post'] = get_post( $post_id );
		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		$this->assertFalse( visitor_has_subscription_access_to_plan_ids( array( $plan_id ), $post_id ) );
		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		unset( $GLOBALS['post'] );
	}

	public function test_subscription_access_preserves_paid_tier_expansion_and_exact_plans() {
		$post_id = $this->create_subscription_editor_post( true );
		$cheap   = $this->create_tier_plan( 7003, 5 );
		$pricey  = $this->create_tier_plan( 7004, 50 );
		$regular = $this->create_subscription_plan( 7005 );

		$this->set_returned_token( $this->tier_token_payload( 7004 ) );
		$this->assertTrue( visitor_has_subscription_access_to_plan_ids( array( $cheap ), $post_id ) );
		$this->assertTrue( visitor_has_subscription_access_to_plan_ids( array( $pricey ), $post_id ) );
		$this->assertFalse( visitor_has_subscription_access_to_plan_ids( array( $regular ), $post_id ) );

		$this->set_returned_token( $this->tier_token_payload( 7003 ) );
		$this->assertFalse( visitor_has_subscription_access_to_plan_ids( array( $pricey ), $post_id ) );

		$this->set_returned_token( $this->tier_token_payload( 7005 ) );
		$this->assertTrue( visitor_has_subscription_access_to_plan_ids( array( $regular ), $post_id ) );
	}

	public function test_membership_subscription_access_grants_a_matching_paid_subscriber() {
		$plan_id = $this->create_tier_plan( 7007, 50 );
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		update_post_meta( $post_id, Jetpack_Memberships::$post_access_level_meta_name, Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS );
		update_post_meta( $post_id, Jetpack_Memberships::$post_access_tier_meta_name, $plan_id );
		wp_set_current_user( 0 );
		unset( $GLOBALS['post'] );
		$this->set_returned_token( $this->tier_token_payload( 7007 ) );

		$this->assertTrue( Jetpack_Memberships::user_has_subscription_access( $post_id ) );
	}

	public function test_subscription_access_restores_editor_preview_after_an_exception() {
		$post_id  = $this->create_subscription_editor_post( true );
		$service  = new Test_Jetpack_Token_Subscription_Service();
		$level    = Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS;
		$expected = new RuntimeException( 'Subscription observer failed.' );
		$throw    = /** @return never */ static function () use ( $expected ) {
			throw $expected;
		};
		add_action( 'earn_user_has_access', $throw );
		try {
			$service->visitor_has_subscription_access( array( 9999 ), $level, $post_id );
			$this->fail( 'The subscription observer should throw.' );
		} catch ( RuntimeException $error ) {
			$this->assertSame( $expected, $error );
		} finally {
			remove_action( 'earn_user_has_access', $throw );
		}

		$this->assertTrue( $service->visitor_can_view_content( array( 9999 ), $level, $post_id ) );
	}

	public function test_online_subscription_access_does_not_inherit_editor_preview() {
		$post_id = $this->create_subscription_editor_post( true );
		$service = new class() extends WPCOM_Online_Subscription_Service {
			public function is_current_user_subscribed(): bool {
				return false;
			}
		};
		$level   = Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS;
		add_filter( 'earn_get_user_subscriptions_for_site_id', '__return_empty_array', PHP_INT_MAX );

		$this->assertTrue( $service->visitor_can_view_content( array( 9999 ), $level, $post_id ) );
		$this->assertFalse( $service->visitor_has_subscription_access( array( 9999 ), $level, $post_id ) );
		$this->assertTrue( $service->visitor_can_view_content( array( 9999 ), $level, $post_id ) );
	}

	public function test_legacy_subscription_service_still_renders_but_cannot_grant_playback() {
		$plan_id = $this->create_subscription_plan( 7008 );
		$service = new class() implements Subscription_Service_Interface {
			/** @var int */
			public $view_calls = 0;

			public static function available() {
				return true;
			}

			public function initialize() {}

			public function visitor_can_view_content( $valid_plan_ids, $access_level ) {
				++$this->view_calls;
				return ! empty( $valid_plan_ids ) && 'paid_subscribers' === $access_level;
			}

			public function is_current_user_pending_subscriber(): bool {
				return false;
			}

			public function access_url( $mode = 'subscribe' ) {
				return '#' . $mode;
			}
		};
		add_filter(
			PAYWALL_FILTER,
			static function () use ( $service ) {
				return $service;
			},
			PHP_INT_MAX
		);
		// The factory warns about external implementers even though it returns their service.
		$this->setExpectedIncorrectUsage( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\subscription_service' );
		wp_set_current_user( 0 );
		$post_id         = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$GLOBALS['post'] = get_post( $post_id );

		$this->assertTrue( visitor_can_access_plan_ids( array( $plan_id ), $post_id ) );
		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		$this->assertSame( 2, $service->view_calls );
		$this->assertFalse( visitor_has_subscription_access_to_plan_ids( array( $plan_id ), $post_id ) );
		$this->assertSame( 2, $service->view_calls, 'Playback does not use the rendering check.' );
		unset( $GLOBALS['post'] );
	}

	/**
	 * @dataProvider videopress_editor_gate_cases
	 * @param bool   $can_read Whether the editor has the read capability.
	 * @param string $gate Post, block, or empty block restriction.
	 */
	#[DataProvider( 'videopress_editor_gate_cases' )]
	public function test_videopress_denies_unpaid_embedding_post_editors( $can_read, $gate ) {
		$post_id = $this->create_subscription_editor_post( $can_read );
		$guid    = 'EdIt7001';
		$plan_id = $this->create_tier_plan( 7006, 5 );
		$this->create_unreadable_private_video( $guid );
		$content = '<!-- wp:videopress/video {"guid":"' . $guid . '"} /-->';
		if ( 'post' === $gate ) {
			update_post_meta( $post_id, Jetpack_Memberships::$post_access_level_meta_name, Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS );
			update_post_meta( $post_id, Jetpack_Memberships::$post_access_tier_meta_name, $plan_id );
			$this->assertTrue( Jetpack_Memberships::user_can_view_post( $post_id ) );
		} else {
			$attributes = 'block' === $gate ? wp_json_encode( array( 'selectedPlanIds' => array( $plan_id ) ), JSON_UNESCAPED_SLASHES ) : '{}';
			$content    = '<!-- wp:premium-content/container ' . $attributes . ' -->'
				. '<!-- wp:premium-content/subscriber-view -->' . $content . '<!-- /wp:premium-content/subscriber-view -->'
				. '<!-- /wp:premium-content/container -->';
		}
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => wp_slash( $content ),
			)
		);
		delete_transient( 'videopress_guids_' . $post_id );
		$this->assertContains( $guid, Access_Control::build_and_cache_post_guids( $post_id ) );
		add_filter( 'jetpack_active_modules', array( $this, 'activate_videopress_subscriptions' ) );
		try {
			foreach ( array( 0, 1, $plan_id ) as $submitted_plan ) {
				$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, $submitted_plan ) );
			}
		} finally {
			remove_filter( 'jetpack_active_modules', array( $this, 'activate_videopress_subscriptions' ) );
		}
	}

	/** @return array */
	public static function subscription_editor_capabilities() {
		return array(
			'without read' => array( false ),
			'with read'    => array( true ),
		);
	}

	/** @return array */
	public static function subscription_editor_plan_cases() {
		return array(
			'tier without read'     => array( false, true ),
			'tier with read'        => array( true, true ),
			'non-tier without read' => array( false, false ),
			'non-tier with read'    => array( true, false ),
		);
	}

	/** @return array */
	public static function videopress_editor_gate_cases() {
		return array(
			'post without read'        => array( false, 'post' ),
			'post with read'           => array( true, 'post' ),
			'block without read'       => array( false, 'block' ),
			'block with read'          => array( true, 'block' ),
			'empty block without read' => array( false, 'empty' ),
			'empty block with read'    => array( true, 'empty' ),
		);
	}

	/**
	 * @param array $modules Active modules.
	 * @return array
	 */
	public function activate_videopress_subscriptions( $modules ) {
		$modules[] = 'subscriptions';
		return $modules;
	}

	/**
	 * @param bool $can_read Whether the editor has the read capability.
	 * @return int
	 */
	private function create_subscription_editor_post( $can_read ) {
		unset( $_GET['token'], $_COOKIE['wp-jp-premium-content-session'], $GLOBALS['post'] );
		$user_id = self::factory()->user->create( array( 'role' => 'contributor' ) );
		$user    = get_userdata( $user_id );
		$user->add_cap( 'publish_posts' );
		$user->add_cap( 'edit_published_posts' );
		$user->add_cap( 'read', $can_read );
		wp_set_current_user( $user_id );
		$post_id = self::factory()->post->create(
			array(
				'post_author' => $user_id,
				'post_status' => 'publish',
			)
		);
		$this->assertTrue( current_user_can( 'edit_post', $post_id ) );
		$this->assertSame( $can_read, current_user_can( 'read_post', $post_id ) );
		$this->assertFalse( current_user_can( 'upload_files' ) );
		return $post_id;
	}

	/**
	 * @param int $product_id The product identifier.
	 * @return int
	 */
	private function create_subscription_plan( $product_id ) {
		$plan_id = self::factory()->post->create( array( 'post_type' => Jetpack_Memberships::$post_type_plan ) );
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $product_id );
		return $plan_id;
	}

	/**
	 * @param string $guid Video identifier.
	 */
	private function create_unreadable_private_video( $guid ) {
		$owner_id  = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$parent_id = self::factory()->post->create(
			array(
				'post_author' => $owner_id,
				'post_status' => 'private',
			)
		);
		$video_id  = self::factory()->post->create(
			array(
				'post_author'    => $owner_id,
				'post_parent'    => $parent_id,
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
			)
		);
		update_post_meta( $video_id, 'videopress_guid', $guid );
		wp_update_attachment_metadata( $video_id, array( 'videopress' => array( 'privacy_setting' => VIDEOPRESS_PRIVACY::IS_PRIVATE ) ) );
		$this->assertFalse( current_user_can( 'read_post', $video_id ) );
	}
}
