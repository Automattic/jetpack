<?php
/**
 * Tests for WPCOM_Online_Subscription_Service::is_current_user_subscribed().
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
require_once __DIR__ . '/mocks/class-blog-subscriber.php';
require_once __DIR__ . '/mocks/class-blog-subscription.php';
require_once __DIR__ . '/mocks/wpcom-subs-is-subscribed.php';

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service
 */
#[CoversClass( WPCOM_Online_Subscription_Service::class )]
class WPCOM_Online_Subscription_Service_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Email used for both the current user and the Blog_Subscriber mock.
	 */
	const SUBSCRIBER_EMAIL = 'reader@example.org';

	/**
	 * The logged-in user for the test, matched against Blog_Subscriber::$subscribers_by_email.
	 *
	 * @var integer
	 */
	private $user_id;

	/**
	 * The site being checked, matched against wpcom_subs_is_subscribed()'s blog_id arg.
	 *
	 * @var integer
	 */
	private $blog_id;

	public function set_up() {
		parent::set_up();

		$this->user_id = self::factory()->user->create(
			array(
				'user_email' => self::SUBSCRIBER_EMAIL,
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $this->user_id );
		$this->blog_id = get_current_blog_id();

		Blog_Subscriber::$subscribers_by_email           = array();
		Blog_Subscription::$status                       = '';
		$GLOBALS['wpcom_subs_is_subscribed_mock_return'] = false;
		$GLOBALS['wpcom_subs_is_subscribed_mock_calls']  = array();
	}

	public function tear_down() {
		Blog_Subscriber::$subscribers_by_email = array();
		Blog_Subscription::$status             = '';
		unset(
			$GLOBALS['wpcom_subs_is_subscribed_mock_return'],
			$GLOBALS['wpcom_subs_is_subscribed_mock_calls'],
			$GLOBALS['post']
		);
		parent::tear_down();
	}

	/**
	 * Marks the current user as an active email subscriber to the current blog.
	 *
	 * @param string $status The subscription status to simulate.
	 *
	 * @return void
	 */
	private function make_email_subscriber_active( string $status = 'active' ) {
		Blog_Subscriber::$subscribers_by_email = array( self::SUBSCRIBER_EMAIL => (object) array() );
		Blog_Subscription::$status             = $status;
	}

	/**
	 * Runs a callback while silencing the "failed to open stream" warning from
	 * include_once()'ing a WPCOM-only file that doesn't exist in the Jetpack test
	 * environment. This suite fails on any warning, so the expected one needs to
	 * be swallowed rather than left to bubble up.
	 *
	 * @param callable $callback The code to run.
	 *
	 * @return mixed
	 */
	private function without_wpcom_include_warning( callable $callback ) {
		set_error_handler( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.prevent_path_disclosure_set_error_handler
			static function ( $errno, $errstr ) {
				return (bool) str_contains( $errstr, 'email-subscriptions/subscriptions.php' );
			},
			E_WARNING
		);
		try {
			return $callback();
		} finally {
			restore_error_handler();
		}
	}

	/**
	 * Calls is_current_user_subscribed() on a fresh service instance.
	 *
	 * @return boolean
	 */
	private function is_current_user_subscribed() {
		return $this->without_wpcom_include_warning(
			static function () {
				return ( new WPCOM_Online_Subscription_Service() )->is_current_user_subscribed();
			}
		);
	}

	public function test_returns_false_when_neither_email_subscribed_nor_following() {
		$this->assertFalse( $this->is_current_user_subscribed() );
	}

	public function test_returns_true_for_active_email_subscriber_who_does_not_follow() {
		$this->make_email_subscriber_active();

		$this->assertTrue( $this->is_current_user_subscribed() );
	}

	public function test_returns_false_for_inactive_email_subscription_and_no_follow() {
		$this->make_email_subscriber_active( 'cancelled' );

		$this->assertFalse( $this->is_current_user_subscribed() );
	}

	public function test_returns_true_for_reader_follower_with_no_email_subscription() {
		$GLOBALS['wpcom_subs_is_subscribed_mock_return'] = true;

		$this->assertTrue( $this->is_current_user_subscribed() );
	}

	public function test_returns_true_when_both_email_subscribed_and_following() {
		$this->make_email_subscriber_active();
		$GLOBALS['wpcom_subs_is_subscribed_mock_return'] = true;

		$this->assertTrue( $this->is_current_user_subscribed() );
	}

	public function test_checks_reader_follow_status_for_current_user_and_site() {
		$this->is_current_user_subscribed();

		$this->assertSame(
			array(
				array(
					'user_id' => $this->user_id,
					'blog_id' => $this->blog_id,
				),
			),
			$GLOBALS['wpcom_subs_is_subscribed_mock_calls']
		);
	}

	/**
	 * Following in the Reader makes is_current_user_subscribed() true, but that must only
	 * unlock the free "subscribers" access level. Paid tiers are gated by a fully separate
	 * check (the user's actual paid subscriptions), so a Reader follower with no paid
	 * subscription must still be denied paid_subscribers content.
	 *
	 * @return void
	 */
	public function test_reader_follower_cannot_access_paid_subscribers_post_without_a_paid_subscription() {
		$GLOBALS['wpcom_subs_is_subscribed_mock_return'] = true;

		$author_id       = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$post_id         = self::factory()->post->create( array( 'post_author' => $author_id ) );
		$GLOBALS['post'] = get_post( $post_id );
		$service         = new WPCOM_Online_Subscription_Service();

		$this->assertTrue(
			$this->without_wpcom_include_warning(
				static function () use ( $service ) {
					return $service->is_current_user_subscribed();
				}
			),
			'Sanity check: the reader should be considered subscribed via the Reader follow.'
		);

		$this->assertFalse(
			$this->without_wpcom_include_warning(
				static function () use ( $service ) {
					return $service->visitor_can_view_content(
						array( 999999 ),
						Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS
					);
				}
			),
			'Following in the Reader must not unlock paid-tier content.'
		);
	}
}
