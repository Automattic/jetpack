<?php
/**
 * Tests for the blocked login page.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection_Blocked_Login_Page;
use Automattic\Jetpack\Waf\Waf_Blocked_Login_Page;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Blocked login page test case.
 */
class BlockedLoginPageTest extends WorDBless\BaseTestCase {

	/**
	 * Connect the site so recovery requests reach `pre_http_request`.
	 */
	public function setUp(): void {
		parent::setUp();

		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', 1234 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Clean up each test.
	 */
	public function tearDown(): void {
		$_POST    = array();
		$_GET     = array();
		$_REQUEST = array();
		$_COOKIE  = array();
		remove_all_filters( 'pre_http_request' );
		Constants::clear_constants();
		Jetpack_Options::delete_option( array( 'blog_token', 'id' ) );

		parent::tearDown();
	}

	/**
	 * Create a user.
	 *
	 * @param int      $registered_ago Seconds since registration.
	 * @param int|null $key_issued_ago Seconds since the reset key was issued, or null for no key.
	 * @param bool     $nag            The default_password_nag value.
	 *
	 * @return WP_User
	 */
	private function create_user( $registered_ago, $key_issued_ago, $nag ) {
		$user_id = wp_insert_user(
			array(
				'user_login'          => 'blocked-user',
				'user_email'          => 'blocked-user@example.com',
				'user_pass'           => 'password',
				'user_registered'     => gmdate( 'Y-m-d H:i:s', time() - $registered_ago ),
				'user_activation_key' => null === $key_issued_ago ? '' : ( time() - $key_issued_ago ) . ':hash',
			)
		);
		update_user_meta( $user_id, 'default_password_nag', $nag );

		return get_userdata( $user_id );
	}

	/**
	 * Data provider for test_user_has_unfinished_registration.
	 *
	 * @return array
	 */
	public static function provide_registration_states() {
		return array(
			'registered, link unused'                 => array( 60, 60, true, true ),
			'old account with nag, lost-password key' => array( YEAR_IN_SECONDS, 60, true, false ),
			'registration link expired'               => array( 2 * DAY_IN_SECONDS, 2 * DAY_IN_SECONDS, true, false ),
			'registered, logged in since'             => array( 60, null, true, false ),
			'password set, lost-password key'         => array( YEAR_IN_SECONDS, 60, false, false ),
		);
	}

	/**
	 * Test detection of users who haven't used their registration set-password link.
	 *
	 * @dataProvider provide_registration_states
	 *
	 * @param int      $registered_ago Seconds since registration.
	 * @param int|null $key_issued_ago Seconds since the reset key was issued, or null for no key.
	 * @param bool     $nag            The default_password_nag value.
	 * @param bool     $expected       Expected result.
	 */
	#[DataProvider( 'provide_registration_states' )]
	public function test_user_has_unfinished_registration( $registered_ago, $key_issued_ago, $nag, $expected ) {
		$page = new Brute_Force_Protection_Blocked_Login_Page( '1.2.3.4' );

		$this->assertSame( $expected, $page->user_has_unfinished_registration( $this->create_user( $registered_ago, $key_issued_ago, $nag ) ) );
	}

	/**
	 * Data provider for test_send_recovery_email.
	 *
	 * @return array
	 */
	public static function provide_recovery_requests() {
		return array(
			'brute force, unfinished registration' => array( Brute_Force_Protection_Blocked_Login_Page::class, null, false ),
			'brute force, password set'            => array( Brute_Force_Protection_Blocked_Login_Page::class, YEAR_IN_SECONDS, true ),
			'IP block list, unfinished'            => array( Waf_Blocked_Login_Page::class, null, true ),
		);
	}

	/**
	 * Test which recovery requests reach WordPress.com.
	 *
	 * @dataProvider provide_recovery_requests
	 *
	 * @param string   $page_class       Blocked login page class.
	 * @param int|null $registered_ago   Seconds since registration, or null for a just-registered user with an unused link.
	 * @param bool     $expect_request   Whether a request to WordPress.com is expected.
	 */
	#[DataProvider( 'provide_recovery_requests' )]
	public function test_send_recovery_email( $page_class, $registered_ago, $expect_request ) {
		if ( null === $registered_ago ) {
			$this->create_user( 60, 60, true );
		} else {
			$this->create_user( $registered_ago, null, false );
		}
		$_POST['email'] = 'blocked-user@example.com';

		$requested = false;
		add_filter(
			'pre_http_request',
			function () use ( &$requested ) {
				$requested = true;
				return new WP_Error( 'blocked', 'No HTTP in tests.' );
			}
		);

		$result = ( new $page_class( '1.2.3.4' ) )->send_recovery_email();

		$this->assertSame( $expect_request, $requested );
		if ( ! $expect_request ) {
			$this->assertInstanceOf( WP_Error::class, $result );
			$this->assertSame( 'password_not_set', $result->get_error_code() );
		}
	}

	/**
	 * Data provider for test_set_password_link_skips_block.
	 *
	 * @return array
	 */
	public static function provide_password_reset_requests() {
		return array(
			'valid key in link'   => array( 'rp', 'link', true, true ),
			'valid key in cookie' => array( 'resetpass', 'cookie', true, true ),
			'invalid key'         => array( 'rp', 'link', false, false ),
			'not a reset action'  => array( 'login', 'link', true, false ),
		);
	}

	/**
	 * Test that only set-password requests with a valid key skip the blocked page.
	 *
	 * @dataProvider provide_password_reset_requests
	 *
	 * @param string $action    The wp-login.php action.
	 * @param string $key_from  Where the key is sent: 'link' or 'cookie'.
	 * @param bool   $valid_key Whether to send the user's real reset key.
	 * @param bool   $expected  Expected result.
	 */
	#[DataProvider( 'provide_password_reset_requests' )]
	public function test_set_password_link_skips_block( $action, $key_from, $valid_key, $expected ) {
		if ( ! defined( 'COOKIEHASH' ) ) {
			define( 'COOKIEHASH', 'test' );
		}
		$key = get_password_reset_key( $this->create_user( 60, null, true ) );
		$key = $valid_key ? $key : 'wrong-key';

		$_REQUEST['action'] = $action;
		if ( 'link' === $key_from ) {
			$_GET['key']   = $key;
			$_GET['login'] = 'blocked-user';
		} else {
			$_COOKIE[ 'wp-resetpass-' . COOKIEHASH ] = 'blocked-user:' . $key;
		}

		$protection = ( new ReflectionClass( Brute_Force_Protection::class ) )->newInstanceWithoutConstructor();
		$this->assertSame( $expected, $protection->is_valid_password_reset_request() );
	}
}
