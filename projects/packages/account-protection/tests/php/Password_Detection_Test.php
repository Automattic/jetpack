<?php

namespace Automattic\Jetpack\Account_Protection;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the Password_Detection class.
 */
class Password_Detection_Test extends BaseTestCase {
	public function test_login_form_password_detection_does_not_ask_validation_service_if_user_doesnt_require_protection(): void {
		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->never() )
			->method( 'is_leaked_password' );

		$sut = new Password_Detection( null, $validation_service_mock );

		$user   = new \WP_User();
		$return = $sut->login_form_password_detection( $user, 'pw' );
		$this->assertSame( $user, $return, 'User should be returned.' );
	}

	/**
	 * A user without a publishing role on the current site is checked against the rest of the network.
	 *
	 * @dataProvider provide_network_role_cases
	 *
	 * @param bool $is_multisite         Whether the site is part of a network.
	 * @param bool $can_publish_here     Whether the user can publish on the current site.
	 * @param bool $password_is_correct  Whether the submitted password is correct.
	 * @param bool $publishes_elsewhere  Whether the user can publish on another site.
	 * @param int  $expected_lookups     How many times the other sites should be consulted.
	 * @param int  $expected_leak_checks How many times the password should be checked for leaks.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_network_role_cases' )]
	public function test_login_form_password_detection_considers_roles_on_other_network_sites( bool $is_multisite, bool $can_publish_here, bool $password_is_correct, bool $publishes_elsewhere, int $expected_lookups, int $expected_leak_checks ): void {
		$check_password = $password_is_correct ? '__return_true' : '__return_false';
		add_filter( 'check_password', $check_password );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->exactly( $expected_leak_checks ) )
			->method( 'is_leaked_password' )
			->willReturn( false );

		$sut = $this->getMockBuilder( Password_Detection::class )
			->setConstructorArgs( array( null, $validation_service_mock ) )
			->onlyMethods( array( 'is_multisite', 'user_can_publish_on_another_site' ) )
			->getMock();
		$sut->expects( $this->atMost( 1 ) )->method( 'is_multisite' )->willReturn( $is_multisite );
		$sut->expects( $this->exactly( $expected_lookups ) )
			->method( 'user_can_publish_on_another_site' )
			->willReturn( $publishes_elsewhere );

		$user            = new \WP_User();
		$user->ID        = 1;
		$user->user_pass = 'pw';
		if ( $can_publish_here ) {
			$user->add_cap( 'publish_posts' );
		}

		$return = $sut->login_form_password_detection( $user, 'pw' );

		remove_filter( 'check_password', $check_password );

		$this->assertSame( $user, $return, 'User should be returned.' );
	}

	public static function provide_network_role_cases(): array {
		return array(
			'network, publishes on another site'     => array( true, false, true, true, 1, 1 ),
			'network, publishes nowhere'             => array( true, false, true, false, 1, 0 ),
			'network, wrong password skips the scan' => array( true, false, false, true, 0, 0 ),
			'network, publishes on the current site' => array( true, true, true, false, 0, 1 ),
			'single site never looks at other sites' => array( false, false, true, true, 0, 0 ),
		);
	}

	public function test_login_form_password_detection_does_not_ask_validation_service_if_user_requires_protection_filter_applied(): void {
		add_filter( Config::PREFIX . '_user_requires_protection', '__return_false' );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->never() )
			->method( 'is_leaked_password' );

		$sut = new Password_Detection( null, $validation_service_mock );

		$user            = new \WP_User();
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );
		$return = $sut->login_form_password_detection( $user, 'pw' );
		$this->assertSame( $user, $return, 'User should be returned.' );

		remove_filter( Config::PREFIX . '_user_requires_protection', '__return_false' );
	}

	public function test_login_form_password_detection_does_not_ask_validation_service_if_user_has_wrong_password(): void {
		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->never() )
			->method( 'is_leaked_password' );

		$sut = new Password_Detection( null, $validation_service_mock );

		$user            = new \WP_User();
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );
		$return = $sut->login_form_password_detection( $user, 'pw' );
		$this->assertSame( $user, $return, 'User should be returned.' );
	}

	public function test_login_form_password_detection_asks_validation_service_if_user_has_correct_password(): void {
		add_filter( 'check_password', '__return_true' );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->once() )
			->method( 'is_leaked_password' )
			->with( 'pw' )
			->willReturn( false );

		$sut = new Password_Detection( null, $validation_service_mock );

		$user            = new \WP_User();
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );
		$return = $sut->login_form_password_detection( $user, 'pw' );

		$this->assertSame( $user, $return, 'User should be returned.' );

		remove_filter( 'check_password', '__return_true' );
	}

	public function test_login_form_password_detection_sends_email_and_redirects_for_leaked_password(): void {
		add_filter( 'check_password', '__return_true' );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->once() )
			->method( 'is_leaked_password' )
			->with( 'pw' )
			->willReturn( true );

		$auth_code = '123456';

		$user            = new \WP_User();
		$user->ID        = 1;
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );

		$email_service_mock = $this->createMock( Email_Service::class );
		$email_service_mock->expects( $this->once() )
			->method( 'generate_auth_code' )
			->willReturn( $auth_code );
		$email_service_mock->expects( $this->once() )
			->method( 'api_send_auth_email' )
			->with( $user->ID, $auth_code )
			->willReturn( true );

		$sut = $this->createPartialMock( Password_Detection::class, array( 'redirect_and_exit' ) );
		$sut->__construct( $email_service_mock, $validation_service_mock );

		$sut->expects( $this->once() )
				->method( 'redirect_and_exit' )
				->with(
					$this->callback(
						function ( $url ) {
							$parsed = wp_parse_url( $url );
							parse_str( $parsed['query'], $query );
							return isset( $query['token'] ) &&
							strlen( $query['token'] ) === 32 &&
							str_starts_with( $url, 'http://example.org/wp-login.php?action=password-detection&token=' );
						}
					)
				);

		$sut->login_form_password_detection( $user, 'pw' );

		remove_filter( 'check_password', '__return_true' );
	}

	public function test_login_form_password_detection_sets_transient_error_if_unable_to_send_mail(): void {
		add_filter( 'check_password', '__return_true' );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->once() )
			->method( 'is_leaked_password' )
			->with( 'pw' )
			->willReturn( true );

		$user            = new \WP_User();
		$user->ID        = 1;
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );

		$email_service_mock = $this->createMock( Email_Service::class );
		$email_service_mock->expects( $this->once() )
			->method( 'generate_auth_code' )
			->willReturn( '123456' );
		$email_service_mock->expects( $this->once() )
			->method( 'api_send_auth_email' )
			->with( $user->ID, '123456' )
			->willReturn( new \WP_Error( 'email_send_error', 'Failed to send authentication code. Please try again.' ) );

			$sut = $this->createPartialMock( Password_Detection::class, array( 'redirect_and_exit' ) );
			$sut->__construct( $email_service_mock, $validation_service_mock );

			$sut->expects( $this->once() )
				->method( 'redirect_and_exit' )
				->with(
					$this->callback(
						function ( $url ) {
							$parsed = wp_parse_url( $url );
							parse_str( $parsed['query'], $query );
							return isset( $query['token'] ) &&
							strlen( $query['token'] ) === 32 &&
							str_starts_with( $url, 'http://example.org/wp-login.php?action=password-detection&token=' );
						}
					)
				);

		$sut->login_form_password_detection( $user, 'pw' );

		$transient_data = get_transient( Config::PREFIX . "_error_{$user->ID}" );
		$this->assertSame(
			array(
				'code'    => 'email_send_error',
				'message' => 'Failed to send authentication code. Please try again.',
			),
			$transient_data,
			'Should have set the correct error message.'
		);

		remove_filter( 'check_password', '__return_true' );
	}

	public function test_set_transient_success_sets_correct_transient() {
		$sut          = new Password_Detection();
		$user_id      = 1;
		$success_data = array(
			'code'    => 'success_code',
			'message' => 'Success message',
		);

		$sut->set_transient_success( $user_id, $success_data );

		$this->assertSame(
			$success_data,
			get_transient( Config::PREFIX . "_success_{$user_id}" )
		);
	}

	public function test_set_transient_error_sets_correct_transient() {
		$sut        = new Password_Detection();
		$user_id    = 1;
		$error_data = array(
			'code'    => 'error_code',
			'message' => 'Error message',
		);

		$sut->set_transient_error( $user_id, $error_data );

		$this->assertSame(
			$error_data,
			get_transient( Config::PREFIX . "_error_{$user_id}" )
		);
	}

	public function test_extract_and_clear_transient_data_retrieves_and_deletes_transient() {
		$transient_key  = 'test_transient';
		$transient_data = array(
			'message' => 'Test Message',
			'code'    => 'test_code',
		);

		set_transient( $transient_key, $transient_data );

		$sut    = new Password_Detection();
		$result = $sut->extract_and_clear_transient_data( $transient_key );

		$this->assertSame( $transient_data, $result );
		$this->assertFalse( get_transient( $transient_key ) );
	}

	public function test_render_page_redirects_to_dashboard_if_user_already_logged_in(): void {
		$dashboard_url = static function () {
			return 'http://example.org/site-two/wp-admin/';
		};
		add_filter( 'user_dashboard_url', $dashboard_url );

		$sut = $this->createPartialMock( Password_Detection::class, array( 'redirect_and_exit' ) );
		$sut->expects( $this->once() )
			->method( 'redirect_and_exit' )
			->with( 'http://example.org/site-two/wp-admin/' );

		$mock_user = $this->createMock( \WP_User::class );
		$mock_user->expects( $this->once() )
			->method( 'exists' )
			->willReturn( true );

		global $current_user;
		$previous_current_user   = $current_user;
		$GLOBALS['current_user'] = $mock_user;

		$sut->render_page();

		$GLOBALS['current_user'] = $previous_current_user;
		remove_filter( 'user_dashboard_url', $dashboard_url );
	}

	public function test_render_page_redirects_to_login_if_transient_data_is_not_available(): void {
		$sut = $this->createPartialMock( Password_Detection::class, array( 'redirect_and_exit' ) );
		$sut->expects( $this->once() )
			->method( 'redirect_and_exit' )
			->with( 'http://example.org/wp-login.php' );

		$sut->render_page();
	}

	public function test_render_page_redirects_to_login_if_user_with_id_from_transient_does_not_exist(): void {
		$_GET['token'] = 'my_cool_token';
		set_transient( Config::PREFIX . '_my_cool_token', array( 'user_id' => 123 ) );

		$sut = $this->createPartialMock( Password_Detection::class, array( 'redirect_and_exit', 'load_user' ) );
		$sut->expects( $this->once() )
			->method( 'load_user' )
			->with( 123 )
			->willReturn( false );
		$sut->expects( $this->once() )
			->method( 'redirect_and_exit' )
			->with( 'http://example.org/wp-login.php' );

		$sut->render_page();

		unset( $_GET['token'] );
	}

	/**
	 * @dataProvider failed_attempts_below_limit_data_provider
	 *
	 * @param int $failed_attempts Wrong codes entered before the correct one.
	 */
	#[DataProvider( 'failed_attempts_below_limit_data_provider' )]
	public function test_render_page_checks_2fa_code_successfully( int $failed_attempts ): void {
		$_GET['token']            = 'my_cool_token';
		$_POST['verify']          = '1';
		$_POST['user_input']      = '123456';
		$_POST['_wpnonce_verify'] = wp_create_nonce( 'verify_action' );

		set_transient(
			Config::PREFIX . '_my_cool_token',
			array(
				'user_id'   => 123,
				'auth_code' => '123456',
			)
		);
		set_transient( Config::PREFIX . '_failed_attempts_my_cool_token_123456', $failed_attempts );
		set_site_transient( Config::PREFIX . '_failed_attempts_user_123', $failed_attempts );
		set_site_transient( Email_Service::get_user_email_count_key( 123 ), 2 );

		$user            = new \WP_User();
		$user->ID        = 123;
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );

		$sut = $this->createPartialMock( Password_Detection::class, array( 'load_user', 'render_content' ) );
		$sut->expects( $this->once() )
			->method( 'load_user' )
			->with( 123 )
			->willReturn( $user );
		$sut->expects( $this->once() )
			->method( 'render_content' )
			->with( $user, 'my_cool_token' );

		$calls        = 0;
		$call_counter = function () use ( &$calls ) {
			++$calls;
			return false;
		};

		add_filter( 'send_auth_cookies', $call_counter );

		$sut->render_page();

		remove_filter( 'send_auth_cookies', $call_counter );

		$this->assertSame( 1, $calls, 'send_auth_cookies filter should have been called once' );
		$this->assertFalse( get_transient( Config::PREFIX . '_failed_attempts_my_cool_token_123456' ) );
		$this->assertFalse( get_site_transient( Config::PREFIX . '_failed_attempts_user_123' ) );
		$this->assertFalse( get_site_transient( Email_Service::get_user_email_count_key( 123 ) ) );

		unset( $_GET['token'] );
		unset( $_POST['verify'] );
		unset( $_POST['user_input'] );
		unset( $_POST['_wpnonce_verify'] );
	}

	public static function failed_attempts_below_limit_data_provider(): array {
		return array(
			'no wrong codes'      => array( 0 ),
			'one below the limit' => array( Config::PASSWORD_DETECTION_FAILED_ATTEMPT_LIMIT - 1 ),
		);
	}

	public function test_render_page_sets_transient_error_if_2fa_code_is_wrong(): void {
		$_GET['token']            = 'my_cool_token';
		$_POST['verify']          = '1';
		$_POST['user_input']      = '837467'; // intentionally wrong
		$_POST['_wpnonce_verify'] = wp_create_nonce( 'verify_action' );

		set_transient(
			Config::PREFIX . '_my_cool_token',
			array(
				'user_id'   => 123,
				'auth_code' => '123456',
			)
		);

		$user            = new \WP_User();
		$user->ID        = 123;
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );

		$sut = $this->createPartialMock( Password_Detection::class, array( 'load_user', 'render_content' ) );
		$sut->expects( $this->once() )
			->method( 'load_user' )
			->with( 123 )
			->willReturn( $user );
		$sut->expects( $this->once() )
			->method( 'render_content' )
			->with( $user, 'my_cool_token' );

		$sut->render_page();

		$error = get_transient( Config::PREFIX . '_error_123' );

		$this->assertSame(
			array(
				'code'    => 'auth_code_error',
				'message' => 'Authentication code verification failed. Please try again.',
			),
			$error,
			'Error message is not as expected.'
		);

		unset( $_GET['token'] );
		unset( $_POST['verify'] );
		unset( $_POST['user_input'] );
		unset( $_POST['_wpnonce_verify'] );
	}

	public function test_render_page_sets_transient_error_if_2fa_nonce_is_wrong(): void {
		$_GET['token']            = 'my_cool_token';
		$_POST['verify']          = '1';
		$_POST['_wpnonce_verify'] = 'wrong nonce'; // intentionally wrong

		set_transient(
			Config::PREFIX . '_my_cool_token',
			array(
				'user_id'   => 123,
				'auth_code' => '123456',
			)
		);

		$user             = new \WP_User();
		$user->ID         = 123;
		$user->user_email = 'email@example.com';
		$user->user_pass  = 'pw';
		$user->add_cap( 'publish_posts' );

		$sut = $this->createPartialMock( Password_Detection::class, array( 'load_user', 'render_content' ) );
		$sut->expects( $this->once() )
			->method( 'load_user' )
			->with( 123 )
			->willReturn( $user );
		$sut->expects( $this->once() )
			->method( 'render_content' )
			->with( $user, 'my_cool_token' );

		$sut->render_page();

		$error = get_transient( Config::PREFIX . '_error_123' );

		$this->assertSame(
			array(
				'code'    => 'verify_nonce_error',
				'message' => 'Verify nonce verification failed. Please try again.',
			),
			$error,
			'Error message is not as expected.'
		);

		unset( $_GET['token'] );
		unset( $_POST['verify'] );
		unset( $_POST['_wpnonce_verify'] );
	}

	public function test_render_page_resends_mail_successfully(): void {
		$_GET['token']        = 'my_cool_token';
		$_GET['resend_email'] = '1';
		$_GET['_wpnonce']     = wp_create_nonce( 'resend_email_nonce' );

		set_transient(
			Config::PREFIX . '_my_cool_token',
			array(
				'user_id'   => 123,
				'auth_code' => '123456',
			)
		);

		$user            = new \WP_User();
		$user->ID        = 123;
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );

		$email_service_mock = $this->createMock( Email_Service::class );
		$email_service_mock->expects( $this->once() )
			->method( 'resend_auth_email' )
			->with(
				$user->ID,
				array(
					'user_id'   => 123,
					'auth_code' => '123456',
				),
				'my_cool_token'
			)
			->willReturn( true );

		$sut = $this->getMockBuilder( Password_Detection::class )
			->setConstructorArgs( array( $email_service_mock ) )
			->onlyMethods( array( 'load_user', 'redirect_and_exit' ) )
			->getMock();
		$sut->expects( $this->once() )
			->method( 'load_user' )
			->with( 123 )
			->willReturn( $user );
		$sut->expects( $this->once() )
			->method( 'redirect_and_exit' )
			->with( 'http://example.org/wp-login.php?action=password-detection&token=my_cool_token' );

		$sut->render_page();

		unset( $_GET['token'] );
		unset( $_GET['resend_email'] );
		unset( $_GET['_wpnonce'] );
	}

	public function test_render_content_explains_the_2fa_form(): void {
		$user             = new \WP_User();
		$user->ID         = 123;
		$user->user_email = 'john.doe@example.com';

		$sut = $this->getMockBuilder( Password_Detection::class )
			->onlyMethods( array( 'exit' ) )
			->getMock();

		$sut->expects( $this->once() )
			->method( 'exit' );

		ob_start();
		$sut->render_content( $user, 'my_cool_token' );
		$output = ob_get_clean();

		$this->assertMatchesRegularExpression(
			'@Jetpack Account Protection</a>\s+has flagged that your password may appear in a known data breach\.@',
			$output
		);
		$this->assertStringContainsString(
			htmlentities(
				'This security feature was automatically activated with a recent Jetpack update to help keep your account safe.',
				ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401
			),
			$output
		);
		$this->assertStringContainsString(
			htmlentities(
				'As an extra layer of security, we\'ve sent a verification code to your WordPress profile email address (j*******@e******.com).',
				ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401
			),
			$output
		);
		$this->assertStringContainsString(
			htmlentities(
				'Please check your inbox and enter the code below to complete your login:',
				ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401
			),
			$output
		);
	}

	public function test_render_content_links_to_the_users_dashboard_after_verification(): void {
		set_transient(
			Config::PREFIX . '_success_123',
			array(
				'code'    => 'auth_code_success',
				'message' => 'Verified.',
			)
		);

		$dashboard_url = static function ( $url, $user_id, $path ) {
			return "http://example.org/site-two/wp-admin/{$path}?user={$user_id}";
		};
		add_filter( 'user_dashboard_url', $dashboard_url, 10, 3 );

		$user             = new \WP_User();
		$user->ID         = 123;
		$user->user_email = 'john.doe@example.com';

		$sut = $this->getMockBuilder( Password_Detection::class )
			->onlyMethods( array( 'exit' ) )
			->getMock();

		$sut->expects( $this->once() )
			->method( 'exit' );

		ob_start();
		$sut->render_content( $user, 'my_cool_token' );
		$output = ob_get_clean();

		remove_filter( 'user_dashboard_url', $dashboard_url, 10 );

		$this->assertStringContainsString( 'href="http://example.org/site-two/wp-admin/profile.php#password?user=123"', $output );
		$this->assertStringContainsString( 'href="http://example.org/site-two/wp-admin/?user=123"', $output );
	}

	public function test_render_content_shows_transient_error_if_set(): void {
		$error = array(
			'code'    => 'error',
			'message' => 'This is a error message to test things with.',
		);

		set_transient( Config::PREFIX . '_error_123', $error );

		$user             = new \WP_User();
		$user->ID         = 123;
		$user->user_email = 'john.doe@example.com';

		$sut = $this->getMockBuilder( Password_Detection::class )
			->onlyMethods( array( 'exit' ) )
			->getMock();

		$sut->expects( $this->once() )
			->method( 'exit' );

		$this->expectOutputRegex( '@' . $error['message'] . '@' );
		$sut->render_content( $user, 'my_cool_token' );
	}

	/**
	 * Tests that login_form_password_detection handles a NULL user gracefully without causing fatal errors.
	 */
	public function test_login_form_password_detection_handles_null_user_gracefully(): void {
		$sut    = new Password_Detection();
		$return = $sut->login_form_password_detection( null, 'password' );

		// Assert that we reached this point (no fatal error occurred) and that NULL is returned
		$this->assertNull( $return, 'NULL should be returned when a NULL user is provided.' );
	}

	/**
	 * Tests that login_form_password_detection handles a NULL password gracefully without causing fatal errors.
	 */
	public function test_login_form_password_detection_handles_null_password_gracefully(): void {
		$sut       = new Password_Detection();
		$some_user = new \WP_User();
		$return    = $sut->login_form_password_detection( $some_user, null );

		// Assert that that \WP_User is returned.
		$this->assertSame( $some_user, $return, 'User should be returned when a NULL password is provided.' );
	}

	/**
	 * Tests that login_form_password_detection handles a missing password argument gracefully.
	 *
	 * Other plugins hooking into the `authenticate` filter may call the callback without
	 * supplying the password argument. The parameter defaults to null so this must not fatal.
	 */
	public function test_login_form_password_detection_handles_missing_password_argument_gracefully(): void {
		$sut       = new Password_Detection();
		$some_user = new \WP_User();

		// Intentionally omit the password argument to exercise the default value.
		$return = $sut->login_form_password_detection( $some_user );

		// Assert that the \WP_User is returned unchanged.
		$this->assertSame( $some_user, $return, 'User should be returned when the password argument is omitted.' );
	}

	/**
	 * Submit a code on the verification page of user 123 and count the logins it causes.
	 *
	 * @param string $code       The submitted code.
	 * @param bool   $lock_taken Whether the attempt lock can be taken.
	 * @return int
	 */
	private function submit_code( string $code, bool $lock_taken = true ): int {
		$_GET['token']            = 'my_cool_token';
		$_POST['verify']          = '1';
		$_POST['user_input']      = $code;
		$_POST['_wpnonce_verify'] = wp_create_nonce( 'verify_action' );

		$user            = new \WP_User();
		$user->ID        = 123;
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );

		$sut = $this->createPartialMock( Password_Detection::class, array( 'load_user', 'render_content', 'acquire_attempt_lock', 'release_attempt_lock' ) );
		$sut->method( 'load_user' )->willReturn( $user );
		$sut->expects( $this->once() )->method( 'render_content' );
		$sut->method( 'acquire_attempt_lock' )->willReturn( $lock_taken );
		$sut->expects( $this->exactly( $lock_taken ? 1 : 0 ) )->method( 'release_attempt_lock' );

		$logins        = 0;
		$login_counter = function () use ( &$logins ) {
			++$logins;
			return false;
		};
		add_filter( 'send_auth_cookies', $login_counter );
		delete_transient( Config::PREFIX . '_error_123' );

		$sut->render_page();

		remove_filter( 'send_auth_cookies', $login_counter );
		unset( $_GET['token'], $_POST['verify'], $_POST['user_input'], $_POST['_wpnonce_verify'] );

		return $logins;
	}

	/**
	 * Store the verification of user 123 with the given code.
	 *
	 * @param string $code The code.
	 */
	private function store_code( string $code ): void {
		set_transient(
			Config::PREFIX . '_my_cool_token',
			array(
				'user_id'   => 123,
				'auth_code' => $code,
				'requests'  => 1,
			)
		);
	}

	public function test_render_page_stops_accepting_a_code_after_too_many_wrong_tries(): void {
		$this->store_code( '123456' );
		set_transient( Config::PREFIX . '_failed_attempts_my_cool_token_123456', Config::PASSWORD_DETECTION_FAILED_ATTEMPT_LIMIT - 1 );

		$this->submit_code( '837467' );
		$this->assertSame( 'auth_code_attempt_limit_exceeded', get_transient( Config::PREFIX . '_error_123' )['code'] );
		$this->assertSame( 1, get_site_transient( Config::PREFIX . '_failed_attempts_user_123' ) );

		$this->assertSame( 0, $this->submit_code( '123456' ), 'The correct code should not log the user in once the limit is reached.' );
		$this->assertSame( 'auth_code_attempt_limit_exceeded', get_transient( Config::PREFIX . '_error_123' )['code'] );
	}

	public function test_render_page_accepts_a_newly_sent_code(): void {
		set_transient( Config::PREFIX . '_failed_attempts_my_cool_token_123456', Config::PASSWORD_DETECTION_FAILED_ATTEMPT_LIMIT );
		$this->store_code( '654321' );

		$this->assertSame( 1, $this->submit_code( '654321' ) );
	}

	public function test_render_page_does_not_check_a_code_while_another_is_being_checked(): void {
		$this->store_code( '123456' );

		$this->assertSame( 0, $this->submit_code( '123456', false ), 'The correct code should not log the user in without the lock.' );
		$this->assertSame( 'auth_code_error', get_transient( Config::PREFIX . '_error_123' )['code'] );

		$this->submit_code( '837467', false );
		$this->assertFalse( get_site_transient( Config::PREFIX . '_failed_attempts_user_123' ), 'A code that was not checked should not be counted.' );
	}

	public function test_login_form_password_detection_does_not_send_email_past_the_user_limit(): void {
		add_filter( 'check_password', '__return_true' );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->once() )->method( 'is_leaked_password' )->willReturn( true );

		$user            = new \WP_User();
		$user->ID        = 1;
		$user->user_pass = 'pw';
		$user->add_cap( 'publish_posts' );

		$email_service_mock = $this->createMock( Email_Service::class );
		$email_service_mock->method( 'generate_auth_code' )->willReturn( '123456' );
		$email_service_mock->expects( $this->once() )->method( 'user_email_limit_reached' )->with( 1 )->willReturn( true );
		$email_service_mock->expects( $this->never() )->method( 'api_send_auth_email' );
		$email_service_mock->expects( $this->never() )->method( 'count_user_email' );

		$sut = $this->createPartialMock( Password_Detection::class, array( 'redirect_and_exit' ) );
		$sut->__construct( $email_service_mock, $validation_service_mock );
		$sut->expects( $this->once() )
			->method( 'redirect_and_exit' )
			->with( $this->stringStartsWith( 'http://example.org/wp-login.php?action=password-detection&token=' ) );

		$sut->login_form_password_detection( $user, 'pw' );

		remove_filter( 'check_password', '__return_true' );

		$this->assertSame( 'email_request_limit_exceeded', get_transient( Config::PREFIX . '_error_1' )['code'] );
	}

	public function test_render_page_stops_accepting_codes_after_too_many_wrong_tries_for_user(): void {
		$this->store_code( '123456' );
		set_site_transient( Config::PREFIX . '_failed_attempts_user_123', Config::PASSWORD_DETECTION_USER_FAILED_ATTEMPT_LIMIT );

		$this->assertSame( 0, $this->submit_code( '123456' ) );
		$this->assertSame( 'auth_code_user_attempt_limit_exceeded', get_transient( Config::PREFIX . '_error_123' )['code'] );
	}
}
