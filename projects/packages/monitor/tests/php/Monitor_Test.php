<?php
/**
 * Tests for the Monitor class.
 *
 * @package automattic/jetpack-monitor
 */

namespace Automattic\Jetpack\Monitor;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * @covers \Automattic\Jetpack\Monitor\Monitor
 */
#[CoversClass( Monitor::class )]
class Monitor_Test extends BaseTestCase {

	/**
	 * The XML-RPC body WordPress.com answers with.
	 *
	 * @var string
	 */
	private $wpcom_body = '';

	/**
	 * Leave no filters or constants behind.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer_as_wpcom' ) );
		// `Client::build_signed_request()` adds this on every call and never removes it.
		remove_all_filters( 'jetpack_constant_default_value' );
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Filter callback: answer the XML-RPC request with the test's fixture.
	 *
	 * @return array
	 */
	public function answer_as_wpcom() {
		return array(
			'headers'  => array(),
			'body'     => $this->wpcom_body,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * WordPress.com's answers to `setNotifications`, the choice sent, and what is returned and saved.
	 *
	 * @return array[]
	 */
	public static function provide_set_notifications() {
		$ok    = '<?xml version="1.0"?><methodResponse><params><param><value><boolean>1</boolean></value></param></params></methodResponse>';
		$fault = '<?xml version="1.0"?><methodResponse><fault><value><struct>'
			. '<member><name>faultCode</name><value><int>-32000</int></value></member>'
			. '<member><name>faultString</name><value><string>nope</string></value></member>'
			. '</struct></value></fault></methodResponse>';

		return array(
			'turned on'  => array( $ok, true, true, 1 ),
			'turned off' => array( $ok, false, true, 0 ),
			'fault'      => array( $fault, true, false, 'not saved' ),
		);
	}

	/**
	 * @dataProvider provide_set_notifications
	 *
	 * @param string     $wpcom_body WordPress.com's XML-RPC answer.
	 * @param bool       $enabled    The choice sent.
	 * @param bool       $succeeds   Whether `true` comes back rather than a WP_Error.
	 * @param int|string $saved      The local copy afterwards.
	 */
	#[DataProvider( 'provide_set_notifications' )]
	public function test_set_notifications_saves_the_choice_only_when_wpcom_accepts_it( $wpcom_body, $enabled, $succeeds, $saved ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'monitor_user',
				'user_pass'  => 'pass',
			)
		);
		wp_set_current_user( $user_id );
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
		Jetpack_Options::update_option( 'blog_token', 'abcdefghijkl.mnopqrstuvwx' );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "token.secret.$user_id" ) );
		$this->wpcom_body = $wpcom_body;
		add_filter( 'pre_http_request', array( $this, 'answer_as_wpcom' ) );

		$result = Monitor::set_notifications( $enabled );

		if ( $succeeds ) {
			$this->assertTrue( $result );
		} else {
			$this->assertInstanceOf( WP_Error::class, $result );
		}
		$this->assertSame( $saved, get_option( Monitor::notifications_copy_option_name( $user_id ), 'not saved' ) );
	}

	public function test_disconnect_forgets_only_linked_users_choices() {
		Jetpack_Options::update_option(
			'user_tokens',
			array(
				2 => 'token.secret.2',
				3 => 'token.secret.3',
			)
		);
		foreach ( array( 2, 3, 4 ) as $user_id ) {
			update_option( Monitor::notifications_copy_option_name( $user_id ), 1 );
		}

		Monitor::delete_all_notifications_copies();

		$this->assertFalse( get_option( Monitor::notifications_copy_option_name( 2 ) ) );
		$this->assertFalse( get_option( Monitor::notifications_copy_option_name( 3 ) ) );
		$this->assertSame( 1, (int) get_option( Monitor::notifications_copy_option_name( 4 ) ) );
	}

	public function test_add_standalone_module_does_not_duplicate() {
		$this->assertSame( array( 'protect', 'monitor' ), Monitor::add_standalone_module( array( 'protect', 'monitor' ) ) );
		$this->assertSame( array( 'protect', 'monitor' ), Monitor::add_standalone_module( array( 'protect' ) ) );
	}
}
