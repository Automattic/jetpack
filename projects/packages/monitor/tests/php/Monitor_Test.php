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

	const WPCOM_OK = '<?xml version="1.0"?><methodResponse><params><param><value><boolean>1</boolean></value></param></params></methodResponse>';

	const WPCOM_FAULT = '<?xml version="1.0"?><methodResponse><fault><value><struct>'
		. '<member><name>faultCode</name><value><int>-32000</int></value></member>'
		. '<member><name>faultString</name><value><string>nope</string></value></member>'
		. '</struct></value></fault></methodResponse>';

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
		foreach ( array( 'jetpack_get_available_standalone_modules', 'jetpack_activate_module_monitor', 'jetpack_unlinked_user', 'deleted_user', 'jetpack_site_before_disconnected' ) as $hook ) {
			remove_all_filters( $hook );
		}
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
	 * Log in a user linked to WordPress.com, which answers XML-RPC calls with `$wpcom_body`.
	 *
	 * @param string $wpcom_body WordPress.com's XML-RPC answer.
	 * @return int The user's ID.
	 */
	private function connect_user_answered_by( $wpcom_body ) {
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
		return $user_id;
	}

	/**
	 * WordPress.com's answers to `setNotifications`, the choice sent, and what is returned and saved.
	 *
	 * @return array[]
	 */
	public static function provide_set_notifications() {
		return array(
			'turned on'  => array( self::WPCOM_OK, true, true, 1 ),
			'turned off' => array( self::WPCOM_OK, false, true, 0 ),
			'fault'      => array( self::WPCOM_FAULT, true, false, 'not saved' ),
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
		$user_id = $this->connect_user_answered_by( $wpcom_body );

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

	/**
	 * WordPress.com's answer to the subscription, the local copy before activation, and after it.
	 *
	 * @return array[]
	 */
	public static function provide_activation() {
		return array(
			'accepted'               => array( self::WPCOM_OK, null, 1 ),
			'rejected'               => array( self::WPCOM_FAULT, null, 'not saved' ),
			'rejected with old copy' => array( self::WPCOM_FAULT, 0, 'not saved' ),
		);
	}

	/**
	 * @dataProvider provide_activation
	 *
	 * @param string     $wpcom_body WordPress.com's XML-RPC answer.
	 * @param int|null   $previous   The local copy before activation, or null for none.
	 * @param int|string $saved      The local copy afterwards.
	 */
	#[DataProvider( 'provide_activation' )]
	public function test_activation_subscribes_the_user_without_failing_on_rejection( $wpcom_body, $previous, $saved ) {
		$user_id = $this->connect_user_answered_by( $wpcom_body );
		if ( null !== $previous ) {
			update_option( Monitor::notifications_copy_option_name( $user_id ), $previous );
		}
		Monitor::init();

		do_action( 'jetpack_activate_module_monitor' );

		$this->assertSame( $saved, get_option( Monitor::notifications_copy_option_name( $user_id ), 'not saved' ) );
	}

	public function test_init_wires_the_hooks() {
		Monitor::init();

		$this->assertSame( 10, has_filter( 'jetpack_get_available_standalone_modules', array( Monitor::class, 'add_standalone_module' ) ) );
		$this->assertSame( 10, has_action( 'jetpack_activate_module_monitor', array( Monitor::class, 'activate_module' ) ) );
		$this->assertSame( 10, has_action( 'jetpack_unlinked_user', array( Monitor::class, 'delete_notifications_copy' ) ) );
		$this->assertSame( 10, has_action( 'deleted_user', array( Monitor::class, 'delete_notifications_copy' ) ) );
		$this->assertSame( 10, has_action( 'jetpack_site_before_disconnected', array( Monitor::class, 'delete_all_notifications_copies' ) ) );
	}

	public function test_add_standalone_module_adds_monitor() {
		$this->assertSame( array( 'protect', 'monitor' ), Monitor::add_standalone_module( array( 'protect' ) ) );
	}
}
