<?php
/**
 * Testing functions in the Automattic\Jetpack\Connection\SSO class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Connection\SSO\Helpers;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\RequiresMethod;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * SSO class test suite.
 */
class SSO_Test extends BaseTestCase {

	/**
	 * SSO instance.
	 *
	 * @var SSO
	 */
	private $sso;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->sso = SSO::get_instance();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		unset(
			$_COOKIE[ SSO::BROKER_COOKIE ],
			$_COOKIE['jetpack_sso_nonce'],
			$_COOKIE['jetpack_sso_wpcom_referrer'],
			$_GET['redirect_to'],
			$_GET['jetpack-sso-show-default-form'],
			$_SERVER['HTTP_REFERER'],
			$GLOBALS['action']
		);
		wp_set_current_user( 0 );
		$this->set_sso_user_for_2fa( null );
		parent::tear_down();
	}

	/**
	 * Invoke a private method on an object via reflection.
	 *
	 * @param object $object     The object.
	 * @param string $method     The method name.
	 * @param array  $parameters The parameters.
	 * @return mixed
	 */
	private function invoke_private_method( $object, $method, $parameters = array() ) {
		$reflection = new \ReflectionClass( get_class( $object ) );
		$method     = $reflection->getMethod( $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invokeArgs( $object, $parameters );
	}

	/**
	 * Invoke a private static method via reflection.
	 *
	 * @param string $class      The class name.
	 * @param string $method     The method name.
	 * @param array  $parameters The parameters.
	 * @return mixed
	 */
	private function invoke_private_static_method( $class, $method, $parameters = array() ) {
		$reflection = new \ReflectionClass( $class );
		$method     = $reflection->getMethod( $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invokeArgs( null, $parameters );
	}

	/**
	 * Set the private static $sso_user_for_2fa property via reflection.
	 *
	 * @param object|null $user The user object (or null) to store.
	 */
	private function set_sso_user_for_2fa( $user ) {
		$reflection = new \ReflectionClass( SSO::class );
		$property   = $reflection->getProperty( 'sso_user_for_2fa' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $user );
	}

	// ──────────────────────────────────────────────
	// Singleton
	// ──────────────────────────────────────────────

	/**
	 * Test get_instance returns an SSO object.
	 */
	public function test_get_instance_returns_sso_object() {
		$this->assertInstanceOf( SSO::class, $this->sso );
	}

	/**
	 * Test get_instance returns the same object on subsequent calls.
	 */
	public function test_get_instance_returns_same_instance() {
		$instance_a = SSO::get_instance();
		$instance_b = SSO::get_instance();
		$this->assertSame( $instance_a, $instance_b );
	}

	// ──────────────────────────────────────────────
	// sync_sso_callables
	// ──────────────────────────────────────────────

	/**
	 * Test that sync_sso_callables merges SSO callables.
	 */
	public function test_sync_sso_callables_merges_sso_callables() {
		$existing  = array( 'existing_callable' => 'some_function' );
		$callables = $this->sso->sync_sso_callables( $existing );

		$this->assertArrayHasKey( 'existing_callable', $callables );
		$this->assertArrayHasKey( 'sso_is_two_step_required', $callables );
		$this->assertArrayHasKey( 'sso_should_hide_login_form', $callables );
		$this->assertArrayHasKey( 'sso_match_by_email', $callables );
		$this->assertArrayHasKey( 'sso_new_user_override', $callables );
		$this->assertArrayHasKey( 'sso_bypass_default_login_form', $callables );
	}

	/**
	 * Test that sync_sso_callables points to the correct Helpers methods.
	 */
	public function test_sync_sso_callables_references_helpers_methods() {
		$callables = $this->sso->sync_sso_callables( array() );

		$this->assertSame( array( Helpers::class, 'is_two_step_required' ), $callables['sso_is_two_step_required'] );
		$this->assertSame( array( Helpers::class, 'should_hide_login_form' ), $callables['sso_should_hide_login_form'] );
		$this->assertSame( array( Helpers::class, 'match_by_email' ), $callables['sso_match_by_email'] );
		$this->assertSame( array( Helpers::class, 'new_user_override' ), $callables['sso_new_user_override'] );
		$this->assertSame( array( Helpers::class, 'bypass_login_forward_wpcom' ), $callables['sso_bypass_default_login_form'] );
	}

	// ──────────────────────────────────────────────
	// sso_reminder_logout_wpcom
	// ──────────────────────────────────────────────

	/**
	 * Test that the logout reminder is added when the user logs out.
	 */
	public function test_sso_reminder_logout_wpcom_adds_message_on_loggedout() {
		$errors = new WP_Error( 'loggedout', 'You are now logged out.' );
		$result = $this->sso->sso_reminder_logout_wpcom( $errors );

		$this->assertNotEmpty( $result->get_error_messages( 'jetpack-sso-show-logout' ) );
		$this->assertStringContainsString( 'wordpress.com/me', $result->get_error_messages( 'jetpack-sso-show-logout' )[0] );
	}

	/**
	 * Test that no reminder is added when no loggedout error exists.
	 */
	public function test_sso_reminder_logout_wpcom_no_message_without_loggedout() {
		$errors = new WP_Error( 'invalid_username', 'Invalid username.' );
		$result = $this->sso->sso_reminder_logout_wpcom( $errors );

		$this->assertEmpty( $result->get_error_messages( 'jetpack-sso-show-logout' ) );
	}

	/**
	 * Test that an empty WP_Error is returned unchanged.
	 */
	public function test_sso_reminder_logout_wpcom_returns_empty_errors_unchanged() {
		$errors = new WP_Error();
		$result = $this->sso->sso_reminder_logout_wpcom( $errors );

		$this->assertEmpty( $result->get_error_codes() );
	}

	// ──────────────────────────────────────────────
	// xmlrpc_methods
	// ──────────────────────────────────────────────

	/**
	 * Test that xmlrpc_methods adds jetpack.userDisconnect.
	 */
	public function test_xmlrpc_methods_adds_user_disconnect() {
		$methods = $this->sso->xmlrpc_methods( array() );
		$this->assertArrayHasKey( 'jetpack.userDisconnect', $methods );
	}

	/**
	 * Test that xmlrpc_methods preserves existing methods.
	 */
	public function test_xmlrpc_methods_preserves_existing() {
		$methods = $this->sso->xmlrpc_methods( array( 'existing.method' => 'callback' ) );
		$this->assertArrayHasKey( 'existing.method', $methods );
		$this->assertArrayHasKey( 'jetpack.userDisconnect', $methods );
	}

	// ──────────────────────────────────────────────
	// Validation methods
	// ──────────────────────────────────────────────

	/**
	 * Test validate_jetpack_sso_require_two_step returns 1 for truthy value.
	 */
	public function test_validate_require_two_step_truthy() {
		$this->assertSame( 1, $this->sso->validate_jetpack_sso_require_two_step( true ) );
	}

	/**
	 * Test validate_jetpack_sso_require_two_step returns 0 for falsy value.
	 */
	public function test_validate_require_two_step_falsy() {
		$this->assertSame( 0, $this->sso->validate_jetpack_sso_require_two_step( false ) );
	}

	/**
	 * Test validate_jetpack_sso_match_by_email returns 1 for truthy value.
	 */
	public function test_validate_match_by_email_truthy() {
		$this->assertSame( 1, $this->sso->validate_jetpack_sso_match_by_email( true ) );
	}

	/**
	 * Test validate_jetpack_sso_match_by_email returns 0 for falsy value.
	 */
	public function test_validate_match_by_email_falsy() {
		$this->assertSame( 0, $this->sso->validate_jetpack_sso_match_by_email( false ) );
	}

	// ──────────────────────────────────────────────
	// login_body_class
	// ──────────────────────────────────────────────

	/**
	 * Test that login_body_class leaves classes unchanged for non-SSO actions.
	 */
	public function test_login_body_class_unchanged_for_non_sso_action() {
		global $action;
		$action  = 'postpass';
		$classes = $this->sso->login_body_class( array( 'existing' ) );

		$this->assertSame( array( 'existing' ), $classes );
	}

	/**
	 * Test that login_body_class adds jetpack-sso for login action.
	 */
	public function test_login_body_class_adds_jetpack_sso_for_login_action() {
		global $action;
		$action  = 'login';
		$classes = $this->sso->login_body_class( array() );

		$this->assertContains( 'jetpack-sso', $classes );
	}

	/**
	 * Test that login_body_class adds jetpack-sso-form-display when SSO login is shown.
	 */
	public function test_login_body_class_adds_form_display_when_sso_shown() {
		global $action;
		$action  = 'login';
		$classes = $this->sso->login_body_class( array() );

		$this->assertContains( 'jetpack-sso', $classes );
		$this->assertContains( 'jetpack-sso-form-display', $classes );
	}

	/**
	 * Test that login_body_class does not add form-display when show-default-form param is set.
	 */
	public function test_login_body_class_no_form_display_when_default_form_requested() {
		global $action;
		$action                                = 'login';
		$_GET['jetpack-sso-show-default-form'] = '1';
		$classes                               = $this->sso->login_body_class( array() );

		$this->assertContains( 'jetpack-sso', $classes );
		$this->assertNotContains( 'jetpack-sso-form-display', $classes );
	}

	// ──────────────────────────────────────────────
	// profile_page_url
	// ──────────────────────────────────────────────

	/**
	 * Test that profile_page_url returns the admin profile URL.
	 */
	public function test_profile_page_url() {
		$url = SSO::profile_page_url();
		$this->assertStringContainsString( 'profile.php', $url );
	}

	// ──────────────────────────────────────────────
	// get_user_by_wpcom_id
	// ──────────────────────────────────────────────

	/**
	 * Test get_user_by_wpcom_id returns null when no user found.
	 */
	public function test_get_user_by_wpcom_id_returns_null_when_not_found() {
		$this->assertNull( SSO::get_user_by_wpcom_id( 99999 ) );
	}

	/**
	 * Test get_user_by_wpcom_id returns the correct user.
	 *
	 * @requires function WP_User_Query::prepare_query
	 */
	#[RequiresMethod( \WP_User_Query::class, 'prepare_query' )]
	public function test_get_user_by_wpcom_id_returns_correct_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'sso_wpcom_lookup',
				'user_pass'  => 'password',
			)
		);
		update_user_meta( $user_id, 'wpcom_user_id', 44444 );

		$probe = new \WP_User_Query(
			array(
				'meta_key'   => 'wpcom_user_id',
				'meta_value' => 44444,
				'number'     => 1,
			)
		);
		if ( empty( $probe->get_results() ) ) {
			wp_delete_user( $user_id );
			$this->markTestSkipped( 'WP_User_Query meta queries not supported in this environment.' );
		}

		$found = SSO::get_user_by_wpcom_id( 44444 );

		$this->assertNotNull( $found );
		$this->assertEquals( $user_id, $found->ID );

		wp_delete_user( $user_id );
	}

	// ──────────────────────────────────────────────
	// get_user_data / is_user_connected
	// ──────────────────────────────────────────────

	/**
	 * Test get_user_data returns stored meta.
	 */
	public function test_get_user_data_returns_stored_meta() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'connected_user',
				'user_email' => 'connected@example.com',
				'user_pass'  => 'password123',
			)
		);

		$wpcom_data = (object) array(
			'ID'           => 999,
			'display_name' => 'Connected User',
			'email'        => 'connected@example.com',
		);
		update_user_meta( $user_id, 'wpcom_user_data', $wpcom_data );

		$data = $this->sso->get_user_data( $user_id );
		$this->assertEquals( $wpcom_data, $data );

		wp_delete_user( $user_id );
	}

	/**
	 * Test is_user_connected returns falsy when no data.
	 */
	public function test_is_user_connected_returns_falsy_when_no_data() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'disconnected_user',
				'user_email' => 'disconnected@example.com',
				'user_pass'  => 'password123',
			)
		);

		$this->assertEmpty( $this->sso->is_user_connected( $user_id ) );

		wp_delete_user( $user_id );
	}

	/**
	 * Test is_user_connected returns truthy when data exists.
	 */
	public function test_is_user_connected_returns_truthy_when_data_exists() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'user_with_data',
				'user_email' => 'withdata@example.com',
				'user_pass'  => 'password123',
			)
		);

		update_user_meta(
			$user_id,
			'wpcom_user_data',
			(object) array(
				'ID'    => 888,
				'email' => 'withdata@example.com',
			)
		);

		$this->assertNotEmpty( $this->sso->is_user_connected( $user_id ) );

		wp_delete_user( $user_id );
	}

	// ──────────────────────────────────────────────
	// build_sso_button_url
	// ──────────────────────────────────────────────

	/**
	 * Test build_sso_button_url includes jetpack-sso action by default.
	 */
	public function test_build_sso_button_url_includes_action() {
		$url = $this->sso->build_sso_button_url();
		$this->assertStringContainsString( 'action=jetpack-sso', $url );
	}

	/**
	 * Test build_sso_button_url includes custom arguments.
	 */
	public function test_build_sso_button_url_includes_custom_args() {
		$url = $this->sso->build_sso_button_url( array( 'force_reauth' => '1' ) );
		$this->assertStringContainsString( 'force_reauth=1', $url );
		$this->assertStringContainsString( 'action=jetpack-sso', $url );
	}

	/**
	 * Test build_sso_button_url includes redirect_to from GET param.
	 */
	public function test_build_sso_button_url_includes_redirect_to() {
		$_GET['redirect_to'] = 'http://example.org/wp-admin/';
		$url                 = $this->sso->build_sso_button_url();
		$this->assertStringContainsString( 'redirect_to=', $url );
	}

	// ──────────────────────────────────────────────
	// build_sso_button
	// ──────────────────────────────────────────────

	/**
	 * Test build_sso_button returns HTML with a link.
	 */
	public function test_build_sso_button_returns_html_link() {
		$button = $this->sso->build_sso_button();
		$this->assertStringContainsString( '<a ', $button );
		$this->assertStringContainsString( 'jetpack-sso', $button );
		$this->assertStringContainsString( 'button', $button );
	}

	/**
	 * Test build_sso_button with primary class.
	 */
	public function test_build_sso_button_primary_class() {
		$button = $this->sso->build_sso_button( array(), true );
		$this->assertStringContainsString( 'button-primary', $button );
	}

	/**
	 * Test build_sso_button without primary class.
	 */
	public function test_build_sso_button_no_primary_class() {
		$button = $this->sso->build_sso_button( array(), false );
		$this->assertStringNotContainsString( 'button-primary', $button );
	}

	// ──────────────────────────────────────────────
	// get_sso_base_url
	// ──────────────────────────────────────────────

	/**
	 * Test get_sso_base_url returns WordPress.com by default.
	 */
	public function test_get_sso_base_url_returns_wpcom_by_default() {
		$this->assertSame( 'https://wordpress.com/wp-login.php', SSO::get_sso_base_url() );
	}

	/**
	 * Test get_sso_base_url returns broker URL when authorized.
	 */
	public function test_get_sso_base_url_returns_broker_url_when_authorized() {
		$nonce                         = 'test_nonce_base';
		$_COOKIE[ SSO::BROKER_COOKIE ] = $nonce;
		$_COOKIE['jetpack_sso_nonce']  = $nonce;
		Constants::set_constant( 'JETPACK_SSO_BROKER_URL', 'https://broker.example.com/sso' );

		$this->assertSame( 'https://broker.example.com/sso', SSO::get_sso_base_url() );
	}

	/**
	 * Test get_sso_base_url falls back to WordPress.com when live referrer is WordPress.com.
	 */
	public function test_get_sso_base_url_falls_back_when_referrer_is_wpcom() {
		$nonce                         = 'test_nonce_ref';
		$_COOKIE[ SSO::BROKER_COOKIE ] = $nonce;
		$_COOKIE['jetpack_sso_nonce']  = $nonce;
		Constants::set_constant( 'JETPACK_SSO_BROKER_URL', 'https://broker.example.com/sso' );
		$_SERVER['HTTP_REFERER'] = 'https://wordpress.com/sites/example.com';

		$this->assertSame( 'https://wordpress.com/wp-login.php', SSO::get_sso_base_url() );
	}

	/**
	 * Test get_sso_base_url falls back to WordPress.com when the referrer cookie is set.
	 */
	public function test_get_sso_base_url_falls_back_when_referrer_cookie_set() {
		$nonce                                 = 'test_nonce_cookie_ref';
		$_COOKIE[ SSO::BROKER_COOKIE ]         = $nonce;
		$_COOKIE['jetpack_sso_nonce']          = $nonce;
		$_COOKIE['jetpack_sso_wpcom_referrer'] = '1';
		Constants::set_constant( 'JETPACK_SSO_BROKER_URL', 'https://broker.example.com/sso' );

		$this->assertSame( 'https://wordpress.com/wp-login.php', SSO::get_sso_base_url() );
	}

	// ──────────────────────────────────────────────
	// get_broker_url / get_broker_auth_url
	// ──────────────────────────────────────────────

	/**
	 * Test get_broker_url returns false when not authorized.
	 */
	public function test_get_broker_url_returns_false_when_not_authorized() {
		Constants::set_constant( 'JETPACK_SSO_BROKER_URL', 'https://broker.example.com/sso' );
		$this->assertFalse( SSO::get_broker_url() );
	}

	/**
	 * Test get_broker_url returns URL when authorized.
	 */
	public function test_get_broker_url_returns_url_when_authorized() {
		$nonce                         = 'broker_nonce_1';
		$_COOKIE[ SSO::BROKER_COOKIE ] = $nonce;
		$_COOKIE['jetpack_sso_nonce']  = $nonce;
		Constants::set_constant( 'JETPACK_SSO_BROKER_URL', 'https://broker.example.com/sso' );

		$this->assertSame( 'https://broker.example.com/sso', SSO::get_broker_url() );
	}

	/**
	 * Test get_broker_url returns false when cookies don't match.
	 */
	public function test_get_broker_url_returns_false_when_cookies_mismatch() {
		$_COOKIE[ SSO::BROKER_COOKIE ] = 'nonce_a';
		$_COOKIE['jetpack_sso_nonce']  = 'nonce_b';
		Constants::set_constant( 'JETPACK_SSO_BROKER_URL', 'https://broker.example.com/sso' );

		$this->assertFalse( SSO::get_broker_url() );
	}

	/**
	 * Test get_broker_url returns false when constant is not set.
	 */
	public function test_get_broker_url_returns_false_when_no_constant() {
		$nonce                         = 'broker_nonce_2';
		$_COOKIE[ SSO::BROKER_COOKIE ] = $nonce;
		$_COOKIE['jetpack_sso_nonce']  = $nonce;

		$this->assertFalse( SSO::get_broker_url() );
	}

	/**
	 * Test get_broker_auth_url returns false when not authorized.
	 */
	public function test_get_broker_auth_url_returns_false_when_not_authorized() {
		Constants::set_constant( 'JETPACK_SSO_BROKER_AUTH_URL', 'https://broker-auth.example.com/auth' );
		$this->assertFalse( SSO::get_broker_auth_url() );
	}

	/**
	 * Test get_broker_auth_url returns URL when authorized.
	 */
	public function test_get_broker_auth_url_returns_url_when_authorized() {
		$nonce                         = 'auth_nonce_1';
		$_COOKIE[ SSO::BROKER_COOKIE ] = $nonce;
		$_COOKIE['jetpack_sso_nonce']  = $nonce;
		Constants::set_constant( 'JETPACK_SSO_BROKER_AUTH_URL', 'https://broker-auth.example.com/auth' );

		$this->assertSame( 'https://broker-auth.example.com/auth', SSO::get_broker_auth_url() );
	}

	// ──────────────────────────────────────────────
	// validate_broker_url (via public methods)
	// ──────────────────────────────────────────────

	/**
	 * Test that broker URL validation rejects HTTP URLs.
	 */
	public function test_broker_url_rejects_http() {
		$nonce                         = 'validate_nonce_1';
		$_COOKIE[ SSO::BROKER_COOKIE ] = $nonce;
		$_COOKIE['jetpack_sso_nonce']  = $nonce;
		Constants::set_constant( 'JETPACK_SSO_BROKER_URL', 'http://insecure.example.com/sso' );

		$this->assertFalse( SSO::get_broker_url() );
	}

	/**
	 * Test that broker URL validation rejects empty strings.
	 */
	public function test_broker_url_rejects_empty_string() {
		$nonce                         = 'validate_nonce_2';
		$_COOKIE[ SSO::BROKER_COOKIE ] = $nonce;
		$_COOKIE['jetpack_sso_nonce']  = $nonce;
		Constants::set_constant( 'JETPACK_SSO_BROKER_URL', '' );

		$this->assertFalse( SSO::get_broker_url() );
	}

	/**
	 * Test that broker URL validation accepts valid HTTPS URLs.
	 */
	public function test_broker_url_accepts_valid_https() {
		$nonce                         = 'validate_nonce_3';
		$_COOKIE[ SSO::BROKER_COOKIE ] = $nonce;
		$_COOKIE['jetpack_sso_nonce']  = $nonce;
		Constants::set_constant( 'JETPACK_SSO_BROKER_URL', 'https://valid.example.com/path?query=1' );

		$result = SSO::get_broker_url();
		$this->assertNotFalse( $result );
		$this->assertStringStartsWith( 'https://', $result );
	}

	// ──────────────────────────────────────────────
	// BROKER_COOKIE constant
	// ──────────────────────────────────────────────

	/**
	 * Test that BROKER_COOKIE constant is defined.
	 */
	public function test_broker_cookie_constant_defined() {
		$this->assertSame( 'jetpack_sso_broker', SSO::BROKER_COOKIE );
	}

	// ──────────────────────────────────────────────
	// verify_user_token
	// ──────────────────────────────────────────────

	/**
	 * Test verify_user_token returns true when user_token_valid is true and user matches.
	 */
	public function test_verify_user_token_fast_path_valid() {
		$tokens    = $this->createMock( Tokens::class );
		$user_data = (object) array( 'user_token_valid' => true );

		$result = $this->invoke_private_method(
			$this->sso,
			'verify_user_token',
			array( 42, $user_data, $tokens, 42 )
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test verify_user_token disconnects and returns false when user_token_valid is false.
	 */
	public function test_verify_user_token_fast_path_invalid() {
		$tokens = $this->createMock( Tokens::class );
		$tokens->expects( $this->once() )
			->method( 'disconnect_user' )
			->with( 42 );

		$user_data = (object) array( 'user_token_valid' => false );

		$result = $this->invoke_private_method(
			$this->sso,
			'verify_user_token',
			array( 42, $user_data, $tokens, 42 )
		);

		$this->assertFalse( $result );
	}

	/**
	 * Test verify_user_token proceeds without verifying when the token was validated for a different user.
	 *
	 * The validateResult response can't be trusted for this user, so login proceeds
	 * (no extra token-health call) and the wpcom_user_id meta set during this login
	 * means the next SSO login validates the token via the fast path.
	 */
	public function test_verify_user_token_user_mismatch_proceeds_without_verification() {
		$tokens = $this->createMock( Tokens::class );
		$tokens->expects( $this->never() )
			->method( 'disconnect_user' );
		$tokens->expects( $this->never() )
			->method( 'validate' );

		// user_token_valid is false, but it was validated for user 99, not user 42.
		$user_data = (object) array( 'user_token_valid' => false );

		$result = $this->invoke_private_method(
			$this->sso,
			'verify_user_token',
			array( 42, $user_data, $tokens, 99 )
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test verify_user_token proceeds without verifying when no signed token was sent.
	 *
	 * When no signed token was sent (no wpcom_user_id meta), the validateResult
	 * response has no user_token_valid field to trust, so login proceeds without an
	 * extra token-health call.
	 */
	public function test_verify_user_token_no_signed_token_proceeds_without_verification() {
		$tokens = $this->createMock( Tokens::class );
		$tokens->expects( $this->never() )
			->method( 'disconnect_user' );
		$tokens->expects( $this->never() )
			->method( 'validate' );

		$user_data = (object) array( 'ID' => 123 );

		$result = $this->invoke_private_method(
			$this->sso,
			'verify_user_token',
			array( 42, $user_data, $tokens, 0 )
		);

		$this->assertTrue( $result );
	}

	// ──────────────────────────────────────────────
	// set_wpcom_user_id_meta
	// ──────────────────────────────────────────────

	/**
	 * Test set_wpcom_user_id_meta sets meta on the target user.
	 */
	public function test_set_wpcom_user_id_meta_sets_meta() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'sso_meta_test_user',
				'user_pass'  => 'password',
			)
		);

		$this->invoke_private_static_method(
			SSO::class,
			'set_wpcom_user_id_meta',
			array( $user_id, 12345 )
		);

		$this->assertEquals( 12345, get_user_meta( $user_id, 'wpcom_user_id', true ) );

		wp_delete_user( $user_id );
	}

	/**
	 * Test set_wpcom_user_id_meta removes stale meta from other users.
	 *
	 * Note: WP_User_Query meta queries require a full WordPress database.
	 * This test is skipped in WorDBless environments.
	 *
	 * @requires function WP_User_Query::prepare_query
	 */
	#[RequiresMethod( \WP_User_Query::class, 'prepare_query' )]
	public function test_set_wpcom_user_id_meta_removes_stale_meta() {
		$user_a = wp_insert_user(
			array(
				'user_login' => 'sso_meta_user_a',
				'user_pass'  => 'password',
			)
		);
		$user_b = wp_insert_user(
			array(
				'user_login' => 'sso_meta_user_b',
				'user_pass'  => 'password',
			)
		);

		update_user_meta( $user_b, 'wpcom_user_id', 12345 );

		// Verify WP_User_Query meta queries work in this environment.
		$probe = new \WP_User_Query(
			array(
				'meta_key'   => 'wpcom_user_id',
				'meta_value' => 12345,
				'fields'     => 'ID',
			)
		);
		if ( empty( $probe->get_results() ) ) {
			wp_delete_user( $user_a );
			wp_delete_user( $user_b );
			$this->markTestSkipped( 'WP_User_Query meta queries not supported in this environment.' );
		}

		$this->invoke_private_static_method(
			SSO::class,
			'set_wpcom_user_id_meta',
			array( $user_a, 12345 )
		);

		$this->assertEquals( 12345, get_user_meta( $user_a, 'wpcom_user_id', true ) );
		$this->assertEmpty( get_user_meta( $user_b, 'wpcom_user_id', true ) );

		wp_delete_user( $user_a );
		wp_delete_user( $user_b );
	}

	/**
	 * Test set_wpcom_user_id_meta handles multiple stale users.
	 *
	 * @requires function WP_User_Query::prepare_query
	 */
	#[RequiresMethod( \WP_User_Query::class, 'prepare_query' )]
	public function test_set_wpcom_user_id_meta_removes_from_multiple_stale_users() {
		$user_a = wp_insert_user(
			array(
				'user_login' => 'sso_multi_a',
				'user_pass'  => 'password',
			)
		);
		$user_b = wp_insert_user(
			array(
				'user_login' => 'sso_multi_b',
				'user_pass'  => 'password',
			)
		);
		$user_c = wp_insert_user(
			array(
				'user_login' => 'sso_multi_c',
				'user_pass'  => 'password',
			)
		);

		update_user_meta( $user_b, 'wpcom_user_id', 99999 );
		update_user_meta( $user_c, 'wpcom_user_id', 99999 );

		$probe = new \WP_User_Query(
			array(
				'meta_key'   => 'wpcom_user_id',
				'meta_value' => 99999,
				'fields'     => 'ID',
			)
		);
		if ( empty( $probe->get_results() ) ) {
			wp_delete_user( $user_a );
			wp_delete_user( $user_b );
			wp_delete_user( $user_c );
			$this->markTestSkipped( 'WP_User_Query meta queries not supported in this environment.' );
		}

		$this->invoke_private_static_method(
			SSO::class,
			'set_wpcom_user_id_meta',
			array( $user_a, 99999 )
		);

		$this->assertEquals( 99999, get_user_meta( $user_a, 'wpcom_user_id', true ) );
		$this->assertEmpty( get_user_meta( $user_b, 'wpcom_user_id', true ) );
		$this->assertEmpty( get_user_meta( $user_c, 'wpcom_user_id', true ) );

		wp_delete_user( $user_a );
		wp_delete_user( $user_b );
		wp_delete_user( $user_c );
	}

	/**
	 * Test set_wpcom_user_id_meta does not remove meta from the target user when re-setting.
	 */
	public function test_set_wpcom_user_id_meta_preserves_target_user_meta() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'sso_preserve_test',
				'user_pass'  => 'password',
			)
		);

		update_user_meta( $user_id, 'wpcom_user_id', 55555 );

		// Re-set the same meta on the same user.
		$this->invoke_private_static_method(
			SSO::class,
			'set_wpcom_user_id_meta',
			array( $user_id, 55555 )
		);

		$this->assertEquals( 55555, get_user_meta( $user_id, 'wpcom_user_id', true ) );

		wp_delete_user( $user_id );
	}

	// ──────────────────────────────────────────────
	// get_signed_user_token_for_wpcom_id
	// ──────────────────────────────────────────────

	/**
	 * Test get_signed_user_token_for_wpcom_id returns empty when wpcom_user_id is 0.
	 */
	public function test_get_signed_token_returns_empty_for_zero_wpcom_id() {
		$result = $this->invoke_private_method(
			$this->sso,
			'get_signed_user_token_for_wpcom_id',
			array( 0 )
		);

		$this->assertSame( '', $result['signed_token'] );
		$this->assertSame( 0, $result['local_user_id'] );
	}

	/**
	 * Test get_signed_user_token_for_wpcom_id returns empty when no local user has the meta.
	 */
	public function test_get_signed_token_returns_empty_when_no_user_found() {
		$result = $this->invoke_private_method(
			$this->sso,
			'get_signed_user_token_for_wpcom_id',
			array( 999999 )
		);

		$this->assertSame( '', $result['signed_token'] );
		$this->assertSame( 0, $result['local_user_id'] );
	}

	/**
	 * Test get_signed_user_token_for_wpcom_id returns empty when user exists but has no token.
	 */
	public function test_get_signed_token_returns_empty_when_no_token() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'sso_no_token_user',
				'user_pass'  => 'password',
			)
		);
		update_user_meta( $user_id, 'wpcom_user_id', 77777 );

		$result = $this->invoke_private_method(
			$this->sso,
			'get_signed_user_token_for_wpcom_id',
			array( 77777 )
		);

		$this->assertSame( '', $result['signed_token'] );
		$this->assertSame( 0, $result['local_user_id'] );

		wp_delete_user( $user_id );
	}

	// ──────────────────────────────────────────────
	// add_two_factor_session_meta
	// ──────────────────────────────────────────────

	/**
	 * Test that the session is tagged when the stored SSO user matches.
	 */
	public function test_add_two_factor_session_meta_tags_matching_user() {
		$this->set_sso_user_for_2fa( (object) array( 'ID' => 42 ) );

		$session = SSO::add_two_factor_session_meta( array(), 42 );

		$this->assertArrayHasKey( 'two-factor-login', $session );
		$this->assertIsInt( $session['two-factor-login'] );
	}

	/**
	 * Test that the session is left untouched for a non-matching user.
	 */
	public function test_add_two_factor_session_meta_skips_non_matching_user() {
		$this->set_sso_user_for_2fa( (object) array( 'ID' => 42 ) );

		$session = SSO::add_two_factor_session_meta( array(), 99 );

		$this->assertArrayNotHasKey( 'two-factor-login', $session );
	}

	/**
	 * Test that the session is untouched when no SSO user is stored.
	 */
	public function test_add_two_factor_session_meta_no_op_without_stored_user() {
		$this->set_sso_user_for_2fa( null );

		$session = SSO::add_two_factor_session_meta( array( 'existing' => 'value' ), 42 );

		$this->assertSame( array( 'existing' => 'value' ), $session );
	}

	/**
	 * Test that the stored user is cleared after a successful tag, so a
	 * second session for the same user is not tagged again.
	 */
	public function test_add_two_factor_session_meta_clears_stored_user_after_use() {
		$this->set_sso_user_for_2fa( (object) array( 'ID' => 42 ) );

		$first  = SSO::add_two_factor_session_meta( array(), 42 );
		$second = SSO::add_two_factor_session_meta( array(), 42 );

		$this->assertArrayHasKey( 'two-factor-login', $first );
		$this->assertArrayNotHasKey( 'two-factor-login', $second );
	}
}
