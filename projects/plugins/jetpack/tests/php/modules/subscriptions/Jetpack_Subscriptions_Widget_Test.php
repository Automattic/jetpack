<?php
/**
 * Tests for Jetpack_Subscriptions_Widget::is_current_user_subscribed() on WordPress.com.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
require_once JETPACK__PLUGIN_DIR . 'tests/php/extensions/blocks/premium-content/mocks/class-blog-subscriber.php';
require_once JETPACK__PLUGIN_DIR . 'tests/php/extensions/blocks/premium-content/mocks/class-blog-subscription.php';
require_once JETPACK__PLUGIN_DIR . 'tests/php/extensions/blocks/premium-content/mocks/wpcom-subs-is-subscribed.php';

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers \Jetpack_Subscriptions_Widget
 */
#[CoversClass( Jetpack_Subscriptions_Widget::class )]
class Jetpack_Subscriptions_Widget_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
	use Without_WPCOM_Include_Warning;

	const SUBSCRIBER_EMAIL = 'reader@example.org';

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider provide_wpcom_subscription_states
	 *
	 * @param bool $following Whether the reader follows the site in the Reader.
	 * @param bool $logged_in Whether the reader is logged in.
	 * @param bool $expected  Whether the widget should treat the reader as subscribed.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'provide_wpcom_subscription_states' )]
	public function test_wpcom_subscribed_check_counts_reader_follows( $following, $logged_in, $expected ) {
		define( 'IS_WPCOM', true );

		if ( $logged_in ) {
			wp_set_current_user( self::factory()->user->create( array( 'user_email' => self::SUBSCRIBER_EMAIL ) ) );
		}
		$GLOBALS['wpcom_subs_is_subscribed_mock_return'] = $following;
		// On WordPress.com the check ignores ?subscribe=success, so seeding it must not flip the result.
		$_GET['subscribe'] = 'success';

		$subscribed = $this->run_without_wpcom_include_warning( array( Jetpack_Subscriptions_Widget::class, 'is_current_user_subscribed' ) );

		$this->assertSame( $expected, $subscribed );
	}

	/**
	 * Data provider for test_wpcom_subscribed_check_counts_reader_follows.
	 *
	 * @return array
	 */
	public static function provide_wpcom_subscription_states() {
		return array(
			'Reader follower with no email subscription' => array( true, true, true ),
			'logged-in reader who does not follow'       => array( false, true, false ),
			'logged out, even after ?subscribe=success'  => array( true, false, false ),
		);
	}
}
