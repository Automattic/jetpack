<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Account_Protection;

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

	public function test_render_page_redirects_to_admin_page_if_user_already_logged_in(): void {
		$sut = $this->createPartialMock( Password_Detection::class, array( 'redirect_and_exit' ) );
		$sut->expects( $this->once() )
			->method( 'redirect_and_exit' )
			->with( 'http://example.org/wp-admin/' );

		$mock_user = $this->createMock( \WP_User::class );
		$mock_user->expects( $this->once() )
			->method( 'exists' )
			->willReturn( true );

		global $current_user;
		$previous_current_user   = $current_user;
		$GLOBALS['current_user'] = $mock_user;

		$sut->render_page();

		$GLOBALS['current_user'] = $previous_current_user;
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

	public function test_render_page_checks_2fa_code_successfully(): void {
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

		unset( $_GET['token'] );
		unset( $_POST['verify'] );
		unset( $_POST['user_input'] );
		unset( $_POST['_wpnonce_verify'] );
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

		$sentence = htmlentities(
			'We\'ve noticed that your current password may have been compromised in a public leak. To keep your account safe, we\'ve added an extra layer of security.',
			ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401
		);

		$this->expectOutputRegex( '@' . $sentence . '@' );
		$sut->render_content( $user, 'my_cool_token' );
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
}
