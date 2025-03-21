<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Account_Protection;

use WorDBless\BaseTestCase;

/**
 * Tests for the Validation_Service class.
 */
class Validation_Service_Test extends BaseTestCase {

	public function test_returns_false_if_not_connected() {
		$connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->disableOriginalConstructor()
			->getMock();

		$connection->expects( $this->once() )
			->method( 'is_connected' )
			->willReturn( false );

		$validation_service = new Validation_Service( $connection );
		$this->assertFalse( $validation_service->is_leaked_password( 'somepassword' ) );
	}

	private function get_connection_manager() {
		$connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->disableOriginalConstructor()
			->getMock();

		return $connection;
	}

	private function get_connected_connection_manager() {
		$connection = $this->get_connection_manager();

		$connection->expects( $this->once() )
			->method( 'is_connected' )
			->willReturn( true );

		return $connection;
	}

	public function test_returns_false_if_remote_request_fails() {

		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->onlyMethods( array( 'request_suffixes' ) )
			->getMock();

		$validation_service->expects( $this->once() )
			->method( 'request_suffixes' )
			->willReturn( new \WP_Error( 'something went wrong' ) );

		$this->assertFalse( $validation_service->is_leaked_password( 'somepassword' ) );
	}

	public function test_returns_false_if_response_code_is_not_200() {

		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->onlyMethods( array( 'request_suffixes' ) )
			->getMock();

		$validation_service->expects( $this->once() )
			->method( 'request_suffixes' )
			->willReturn(
				array(
					'response' => array(
						'code' => 404,
					),
				)
			);

		$this->assertFalse( $validation_service->is_leaked_password( 'somepassword' ) );
	}

	public function test_returns_false_if_response_code_is_empty_body() {
		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->onlyMethods( array( 'request_suffixes' ) )
			->getMock();

		$validation_service->expects( $this->once() )
			->method( 'request_suffixes' )
			->willReturn(
				array(
					'response' => array(
						'code' => 200,
					),
					'body'     => '',
				)
			);

		$this->assertFalse( $validation_service->is_leaked_password( 'somepassword' ) );
	}

	public function test_get_validation_initial_state_base_conditions() {
		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$state              = $validation_service->get_validation_initial_state( false );

		$this->assertArrayHasKey( 'core', $state );
		$this->assertArrayHasKey( 'contains_backslash', $state );
		$this->assertArrayHasKey( 'invalid_length', $state );
		$this->assertArrayHasKey( 'leaked', $state );
	}

	public function test_get_validation_initial_state_with_user_specific() {
		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$state              = $validation_service->get_validation_initial_state( true );

		$this->assertArrayHasKey( 'matches_user_data', $state );
		$this->assertArrayHasKey( 'recent', $state );
	}

	public function test_get_validation_state_base() {
		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connection_manager() ) )
			->onlyMethods( array( 'contains_backslash', 'is_invalid_length', 'is_leaked_password' ) )
			->getMock();

		$validation_service->expects( $this->once() )->method( 'contains_backslash' )->willReturn( false );
		$validation_service->expects( $this->once() )->method( 'is_invalid_length' )->willReturn( false );
		$validation_service->expects( $this->once() )->method( 'is_leaked_password' )->willReturn( false );

		$state = $validation_service->get_validation_state( 'securepassword', false );

		$this->assertFalse( $state['contains_backslash']['status'] );
		$this->assertFalse( $state['invalid_length']['status'] );
		$this->assertFalse( $state['leaked']['status'] );
	}

	public function test_get_validation_state_user_specific() {
		$user     = new \WP_User();
		$user->ID = 1;

		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connection_manager() ) )
			->onlyMethods( array( 'matches_user_data', 'is_recent_password_hash' ) )
			->getMock();

		$validation_service->expects( $this->once() )->method( 'matches_user_data' )->willReturn( true );
		$validation_service->expects( $this->once() )->method( 'is_recent_password_hash' )->willReturn( false );

		$state = $validation_service->get_validation_state( 'securepassword', true );

		$this->assertTrue( $state['matches_user_data']['status'] );
		$this->assertFalse( $state['recent']['status'] );
	}

	public function test_get_validation_errors_empty_password() {
		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$errors             = $validation_service->get_validation_errors( '' );

		$this->assertContains( '<strong>Error:</strong> The password cannot be a space or all spaces.', $errors );
	}

	public function test_get_validation_errors_all_base_except_empty_password() {
		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connection_manager() ) )
			->onlyMethods( array( 'contains_backslash', 'is_invalid_length', 'is_leaked_password' ) )
			->getMock();

		$validation_service->expects( $this->once() )->method( 'contains_backslash' )->willReturn( true );
		$validation_service->expects( $this->once() )->method( 'is_invalid_length' )->willReturn( true );
		$validation_service->expects( $this->once() )->method( 'is_leaked_password' )->willReturn( true );

		$errors = $validation_service->get_validation_errors( 'password' );

		$this->assertContains( '<strong>Error:</strong> Passwords may not contain the character "\\".', $errors );
		$this->assertContains( '<strong>Error:</strong> The password must be between 6 and 150 characters.', $errors );
		$this->assertContains( '<strong>Error:</strong> The password was found in a public leak.', $errors );
	}

	public function test_get_validation_errors_user_specific() {
		$user     = new \stdClass();
		$user->ID = 1;

		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connection_manager() ) )
			->onlyMethods( array( 'matches_user_data', 'is_recent_password_hash' ) )
			->getMock();

		$validation_service->expects( $this->once() )->method( 'matches_user_data' )->willReturn( true );
		$validation_service->expects( $this->once() )->method( 'is_recent_password_hash' )->willReturn( true );

		$errors = $validation_service->get_validation_errors( 'password', true, $user );

		$this->assertContains( '<strong>Error:</strong> The password matches new user data.', $errors );
		$this->assertContains( '<strong>Error:</strong> The password was used recently.', $errors );
	}

	public function test_returns_true_if_password_contains_backslash() {
		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertTrue( $validation_service->contains_backslash( 'password\\' ) );
	}

	public function test_returns_false_if_password_is_too_short() {
		$short_password = 'short';

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertTrue( $validation_service->is_invalid_length( $short_password ) );
	}

	public function test_returns_false_if_password_is_too_long() {
		$long_password = str_repeat( 'a', 151 );

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertTrue( $validation_service->is_invalid_length( $long_password ) );
	}

	public function test_returns_true_if_password_matches_user_data() {
		$user             = new \WP_User();
		$user->user_email = 'example@wordpress.com';

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertTrue( $validation_service->matches_user_data( $user, 'WordPress' ) );
	}

	public function test_returns_false_if_password_matches_user_data_with_null_user() {
		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertFalse( $validation_service->matches_user_data( null, 'password' ) );
	}

	public function test_returns_true_if_password_is_compromised() {
		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->onlyMethods( array( 'request_suffixes' ) )
			->getMock();

		$validation_service->expects( $this->once() )
			->method( 'request_suffixes' )
			->willReturn(
				array(
					'response' => array(
						'code' => 200,
					),
					'body'     => json_encode(
						array(
							'compromised' => array( 'c90fcfd699f0ddbdcb30c2c9183d2d933ea' ),
						)
					),
				)
			);

		$this->assertTrue( $validation_service->is_leaked_password( 'somepassword' ) );
	}

	public function test_returns_true_if_password_is_common() {
		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->onlyMethods( array( 'request_suffixes' ) )
			->getMock();

		$validation_service->expects( $this->once() )
			->method( 'request_suffixes' )
			->willReturn(
				array(
					'response' => array(
						'code' => 200,
					),
					'body'     => json_encode(
						array(
							'common' => array( 'c90fcfd699f0ddbdcb30c2c9183d2d933ea' ),
						)
					),
				)
			);

		$this->assertTrue( $validation_service->is_leaked_password( 'somepassword' ) );
	}

	public function test_returns_false_if_password_is_not_leaked() {
		$validation_service = $this->getMockBuilder( Validation_Service::class )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->onlyMethods( array( 'request_suffixes' ) )
			->getMock();

		$validation_service->expects( $this->once() )
			->method( 'request_suffixes' )
			->willReturn(
				array(
					'response' => array(
						'code' => 200,
					),
					'body'     => json_encode(
						array(
							'compromised' => array( '1234' ),
							'common'      => array(),
						)
					),
				)
			);

		$this->assertFalse( $validation_service->is_leaked_password( 'somepassword' ) );
	}

	public function test_returns_true_if_password_is_current_password() {
		$user = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'somepassword',
				'user_email' => 'admin@admin.com',
				'role'       => 'administrator',
			)
		);

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertTrue( $validation_service->is_current_password( $user, 'somepassword' ) );
	}

	public function test_returns_false_if_password_is_current_password_with_invalid_user() {
		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertFalse( $validation_service->is_current_password( 99999, 'somepassword' ) );
	}

	public function test_returns_false_if_password_is_not_current_password() {
		$user = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'somepassword',
				'user_email' => 'admin@admin.com',
				'role'       => 'administrator',
			)
		);

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertFalse( $validation_service->is_current_password( $user, 'anotherpassword' ) );
	}

	public function test_returns_true_if_password_was_recently_used() {
		$user            = new \WP_User();
		$user->user_pass = wp_hash_password( 'somepassword' );
		$user->ID        = 1;

		update_user_meta( $user->ID, Config::RECENT_PASSWORD_HASHES_USER_META_KEY, array( $user->user_pass ) );

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertTrue( $validation_service->is_recent_password_hash( $user, 'somepassword' ) );
	}

	public function test_returns_false_if_no_recent_passwords() {
		$user     = new \WP_User();
		$user->ID = 1;

		delete_user_meta( $user->ID, Config::RECENT_PASSWORD_HASHES_USER_META_KEY );

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertFalse( $validation_service->is_recent_password_hash( $user, 'somepassword' ) );
	}

	public function test_returns_false_if_password_was_not_recently_used() {
		$user            = new \WP_User();
		$user->user_pass = wp_hash_password( 'somepassword' );
		$user->ID        = 1;

		update_user_meta( $user->ID, Config::RECENT_PASSWORD_HASHES_USER_META_KEY, array( $user->user_pass ) );

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertFalse( $validation_service->is_recent_password_hash( $user, 'anotherpassword' ) );
	}
}
