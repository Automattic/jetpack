<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Account_Protection;

use WorDBless\BaseTestCase;

/**
 * Tests for the Password_Manager class.
 */
class Password_Manager_Test extends BaseTestCase {
	public function test_validate_profile_update_success() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => wp_hash_password( 'oldpassword' ),
				'user_email' => 'admin@admin.com',
				'role'       => 'administrator',
			)
		);

		$errors = new \WP_Error();
		$user   = (object) array(
			'ID'        => $user_id,
			'user_pass' => wp_hash_password( 'newpassword' ),
		);

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$validation_service_mock->expects( $this->once() )
			->method( 'get_validation_errors' )
			->willReturn( array() );

		$password_manager_mock = new Password_Manager( $validation_service_mock );
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
			->method( 'get_validation_errors' )
			->willReturn( array() );

		$password_manager_mock = new Password_Manager( $validation_service_mock );
		$password_manager_mock->validate_password_reset( $errors, $user );

		$this->assertFalse( $errors->has_errors() );
	}

	private function create_password_manager_mocks() {
		$validation_service_mock = $this->createMock( Validation_Service::class );
		$password_manager_mock   = $this->getMockBuilder( Password_Manager::class )
			->setConstructorArgs( array( $validation_service_mock ) )
			->onlyMethods( array( 'save_recent_password_hash' ) )
			->getMock();

		return $password_manager_mock;
	}

	public function test_on_profile_update_with_valid_nonce() {
		$_POST['action'] = 'update';

		$user_id                  = 1;
		$old_user_data            = new \WP_User();
		$old_user_data->user_pass = 'oldhashedpassword';

		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->once() )
			->method( 'save_recent_password_hash' )
			->with( $user_id, 'oldhashedpassword' );

		$password_manager_mock->on_profile_update(
			$user_id,
			$old_user_data
		);
	}

	public function test_on_profile_update_stdclass_with_user_pass() {
		$_POST['action'] = 'update';

		$user_id                  = 1;
		$old_user_data            = new \stdClass();
		$old_user_data->user_pass = 'old_password_hash';

		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->once() )
			->method( 'save_recent_password_hash' )
			->with( $user_id, 'old_password_hash' );

		$password_manager_mock->on_profile_update(
			$user_id,
			$old_user_data
		);
	}

	public function test_on_profile_update_stdclass_without_user_pass() {
		$_POST['action'] = 'update';

		$user_id       = 1;
		$old_user_data = new \stdClass();
		// Intentionally not setting user_pass

		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->never() )
			->method( 'save_recent_password_hash' );

		$password_manager_mock->on_profile_update(
			$user_id,
			$old_user_data
		);
	}

	public function test_on_profile_update_stdclass_with_empty_user_pass() {
		$_POST['action'] = 'update';

		$user_id                  = 1;
		$old_user_data            = new \stdClass();
		$old_user_data->user_pass = '';

		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->never() )
			->method( 'save_recent_password_hash' );

		$password_manager_mock->on_profile_update(
			$user_id,
			$old_user_data
		);
	}

	public function test_on_profile_update_with_null_user_data() {
		$_POST['action'] = 'update';

		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->never() )
			->method( 'save_recent_password_hash' );

		$password_manager_mock->on_profile_update( 1, null );
	}

	public function test_on_password_reset_saves_recent_password() {
		$user            = new \WP_User();
		$user->ID        = 1;
		$user->user_pass = 'hashedpassword';

		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->once() )
			->method( 'save_recent_password_hash' )
			->with( $user->ID, 'hashedpassword' );

		$password_manager_mock->on_password_reset( $user );
	}

	public function test_on_password_reset_with_stdclass() {
		$user            = new \stdClass();
		$user->ID        = 1;
		$user->user_pass = 'hashedpassword';

		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->once() )
			->method( 'save_recent_password_hash' )
			->with( $user->ID, 'hashedpassword' );

		$password_manager_mock->on_password_reset( $user );
	}

	public function test_on_password_reset_without_user_pass() {
		$user     = new \stdClass();
		$user->ID = 1;
		// Intentionally not setting user_pass

		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->never() )
			->method( 'save_recent_password_hash' );

		$password_manager_mock->on_password_reset( $user );
	}

	public function test_on_password_reset_with_empty_user_pass() {
		$user            = new \stdClass();
		$user->ID        = 1;
		$user->user_pass = '';

		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->never() )
			->method( 'save_recent_password_hash' );

		$password_manager_mock->on_password_reset( $user );
	}

	public function test_on_password_reset_with_null_user_data() {
		$password_manager_mock = $this->create_password_manager_mocks();
		$password_manager_mock->expects( $this->never() )
			->method( 'save_recent_password_hash' );

		$password_manager_mock->on_password_reset( null );
	}

	public function test_save_recent_password_hash_stores_last_10_hashes() {
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

		update_user_meta( $user_id, Config::RECENT_PASSWORD_HASHES_USER_META_KEY, $password_hashes );

		$validation_service_mock = $this->createMock( Validation_Service::class );
		$password_manager_mock   = new Password_Manager( $validation_service_mock );
		$password_manager_mock->save_recent_password_hash( $user_id, 'new_hash' );

		$stored_passwords = get_user_meta( $user_id, Config::RECENT_PASSWORD_HASHES_USER_META_KEY, true );
		$this->assertCount( 10, $stored_passwords );
		$this->assertEquals( 'new_hash', $stored_passwords[0] );
	}
}
