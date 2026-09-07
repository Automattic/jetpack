<?php
/**
 * Subscriber session detection for both login blocks.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use function Automattic\Jetpack\Extensions\Premium_Content\is_subscriber_logged_in as premium_content_is_logged_in;
use function Automattic\Jetpack\Extensions\Premium_Content\render_login_button_block;
use function Automattic\Jetpack\Extensions\Subscriber_Login\is_subscriber_logged_in as subscriber_is_logged_in;
use function Automattic\Jetpack\Extensions\Subscriber_Login\render_block;

require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/access-check.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/login-button/login-button.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriber-login/subscriber-login.php';

/**
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\is_subscriber_logged_in
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\render_login_button_block
 * @covers ::Automattic\Jetpack\Extensions\Subscriber_Login\is_subscriber_logged_in
 * @covers ::Automattic\Jetpack\Extensions\Subscriber_Login\render_block
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Premium_Content\is_subscriber_logged_in' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Premium_Content\render_login_button_block' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Subscriber_Login\is_subscriber_logged_in' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Subscriber_Login\render_block' )]
class Subscriber_Session_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test both login surfaces across host, WordPress session, and cookie states.
	 *
	 * @dataProvider subscriber_session_provider
	 * @param bool        $simple   Whether the site runs on WordPress.com Simple.
	 * @param bool        $wp_login Whether the visitor has a WordPress session.
	 * @param string|null $cookie   Subscriber cookie, or null when absent.
	 * @param bool        $expected Whether the login UI considers the visitor logged in.
	 */
	#[DataProvider( 'subscriber_session_provider' )]
	public function test_subscriber_session( $simple, $wp_login, $cookie, $expected ) {
		$cookie_name        = Abstract_Token_Subscription_Service::JWT_AUTH_TOKEN_COOKIE_NAME;
		$original_cookie    = $_COOKIE[ $cookie_name ] ?? null;
		$had_cookie         = array_key_exists( $cookie_name, $_COOKIE );
		$original_user      = get_current_user_id();
		$had_wpcom_override = array_key_exists( 'IS_WPCOM', Constants::$set_constants );
		$wpcom_override     = Constants::$set_constants['IS_WPCOM'] ?? null;

		try {
			Constants::set_constant( 'IS_WPCOM', $simple );
			wp_set_current_user( $wp_login ? self::factory()->user->create( array( 'role' => 'subscriber' ) ) : 0 );
			if ( null === $cookie ) {
				unset( $_COOKIE[ $cookie_name ] );
			} else {
				$_COOKIE[ $cookie_name ] = $cookie;
			}

			$this->assertSame( $expected, premium_content_is_logged_in() );
			$this->assertSame( $expected, subscriber_is_logged_in() );

			// Logged-out Simple rendering calls wpcom_logmein_redirect_url(), which is provided by wpcom.
			if ( $simple && ! $expected ) {
				return;
			}

			update_option( Jetpack_Memberships::$has_connected_account_option_name, 1 );
			$premium_content = render_login_button_block( array(), '<a>Log in</a>' );
			$subscriber      = render_block( array() );

			if ( $expected ) {
				$this->assertSame( '', $premium_content );
				$this->assertStringContainsString( '>Log out</a>', $subscriber );
				$this->assertStringNotContainsString( '>Log in</a>', $subscriber );
			} else {
				$this->assertStringContainsString( '>Log in</a>', $premium_content );
				$this->assertStringContainsString( '>Log in</a>', $subscriber );
				$this->assertStringContainsString( 'subscribe.wordpress.com/memberships/jwt/', $premium_content );
				$this->assertStringContainsString( 'subscribe.wordpress.com/memberships/jwt/', $subscriber );
			}
		} finally {
			wp_set_current_user( $original_user );
			if ( $had_cookie ) {
				$_COOKIE[ $cookie_name ] = $original_cookie;
			} else {
				unset( $_COOKIE[ $cookie_name ] );
			}
			if ( $had_wpcom_override ) {
				Constants::set_constant( 'IS_WPCOM', $wpcom_override );
			} else {
				Constants::clear_single_constant( 'IS_WPCOM' );
			}
		}
	}

	/**
	 * @return array
	 */
	public static function subscriber_session_provider() {
		// Session detection checks cookie presence; content access validates the actual JWT separately.
		return array(
			'self-hosted anonymous'       => array( false, false, null, false ),
			'self-hosted token only'      => array( false, false, 'subscriber-token', true ),
			'self-hosted WP session only' => array( false, true, null, false ),
			'self-hosted WP and token'    => array( false, true, 'subscriber-token', true ),
			'self-hosted empty cookie'    => array( false, false, '', false ),
			'self-hosted WP empty cookie' => array( false, true, '', false ),
			'Simple anonymous'            => array( true, false, null, false ),
			'Simple token only'           => array( true, false, 'subscriber-token', true ),
			'Simple WP session only'      => array( true, true, null, true ),
			'Simple WP and token'         => array( true, true, 'subscriber-token', true ),
		);
	}
}
