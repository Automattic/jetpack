<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Account_Protection;

use WorDBless\BaseTestCase;

/**
 * Tests for the Password_Manager class.
 */
class Password_Manager_Test extends BaseTestCase {
	public function test_validate_profile_update_nonce_failure() {
		$_POST['_wpnonce'] = 'invalid_nonce';
		$_POST['pass1']    = 'newpassword';

		$errors = new \WP_Error();
		$user   = (object) array( 'ID' => 1 );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$password_manager_mock   = new Password_Manager( $validation_service_mock );

		$password_manager_mock->validate_profile_update( $errors, true, $user );

		$this->assertTrue( $errors->has_errors() );
		$this->assertArrayHasKey( 'nonce_error', $errors->errors );
	}

	public function test_validate_profile_update_success() {
		$_POST['_wpnonce'] = 'update-user_1';
		$_POST['pass1']    = 'newpassword';

		$errors = new \WP_Error();
		$user   = (object) array( 'ID' => 1 );

		$fake_user            = new \WP_User();
		$fake_user->ID        = 1;
		$fake_user->user_pass = wp_hash_password( 'oldpassword' );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->once() )
			->method( 'return_first_validation_error' )
			->willReturn( '' );

		$password_manager_mock = $this->getMockBuilder( Password_Manager::class )
			->setConstructorArgs( array( $validation_service_mock ) )
			->onlyMethods( array( 'verify_profile_update_nonce', 'get_old_user_data' ) )
			->getMock();

		$password_manager_mock->expects( $this->once() )
			->method( 'verify_profile_update_nonce' )
			->willReturn( true );

		$password_manager_mock->expects( $this->once() )
			->method( 'get_old_user_data' )
			->willReturn( $fake_user );

		$password_manager_mock->validate_profile_update( $errors, true, $user );

		$this->assertFalse( $errors->has_errors() );
	}

	public function test_validate_password_reset_with_invalid_user() {
		$errors = new \WP_Error();
		$user   = new \WP_Error( 'invalid_user', 'Invalid user.' );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$password_manager_mock   = new Password_Manager( $validation_service_mock );

		$password_manager_mock->validate_password_reset( $errors, $user );

		$this->assertFalse( $errors->has_errors() );
	}

	public function test_validate_password_reset_with_valid_user() {
		$_POST['pass1'] = 'securepassword';

		$errors   = new \WP_Error();
		$user     = new \WP_User();
		$user->ID = 1;

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->once() )
			->method( 'return_first_validation_error' )
			->willReturn( '' );

		$password_manager_mock = new Password_Manager( $validation_service_mock );
		$password_manager_mock->validate_password_reset( $errors, $user );

		$this->assertFalse( $errors->has_errors() );
	}

	public function test_on_profile_update_with_valid_nonce() {
		$_POST['action']   = 'update';
		$_POST['_wpnonce'] = 'valid_nonce';
		$_POST['pass1']    = 'newpassword';

		$user_id                  = 1;
		$old_user_data            = new \WP_User();
		$old_user_data->user_pass = 'oldhashedpassword';

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$password_manager_mock   = $this->getMockBuilder( Password_Manager::class )
			->setConstructorArgs( array( $validation_service_mock ) )
			->onlyMethods( array( 'save_recent_password', 'verify_profile_update_nonce' ) )
			->getMock();

		$password_manager_mock->expects( $this->once() )
			->method( 'verify_profile_update_nonce' )
			->willReturn( true );

		$password_manager_mock->expects( $this->once() )
			->method( 'save_recent_password' )
			->with( $user_id, 'oldhashedpassword' );

		$password_manager_mock->on_profile_update( $user_id, $old_user_data, array() );
	}

	public function test_on_password_reset_saves_recent_password() {
		$user            = new \WP_User();
		$user->ID        = 1;
		$user->user_pass = 'hashedpassword';

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$password_manager_mock   = $this->getMockBuilder( Password_Manager::class )
			->setConstructorArgs( array( $validation_service_mock ) )
			->onlyMethods( array( 'save_recent_password' ) )
			->getMock();

		$password_manager_mock->expects( $this->once() )
			->method( 'save_recent_password' )
			->with( $user->ID, 'hashedpassword' );

		$password_manager_mock->on_password_reset( $user, 'newpassword' );
	}

	public function test_save_recent_password_stores_last_10_passwords() {
		$user_id         = 1;
		$password_hashes = array(
			'hash1',
			'hash2',
			'hash3',
			'hash4',
			'hash5',
			'hash6',
			'hash7',
			'hash8',
			'hash9',
			'hash10',
		);

		update_user_meta( $user_id, Config::VALIDATION_SERVICE_RECENT_PASSWORD_HASHES_USER_META_KEY, $password_hashes );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$password_manager_mock   = new Password_Manager( $validation_service_mock );
		$password_manager_mock->save_recent_password( $user_id, 'new_hash' );

		$stored_passwords = get_user_meta( $user_id, Config::VALIDATION_SERVICE_RECENT_PASSWORD_HASHES_USER_META_KEY, true );
		$this->assertCount( 10, $stored_passwords );
		$this->assertEquals( 'new_hash', $stored_passwords[0] );
	}
}
