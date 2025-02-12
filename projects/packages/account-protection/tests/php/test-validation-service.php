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
		$this->assertFalse( $validation_service->is_weak_password( 'somepassword' ) );
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

		$this->assertFalse( $validation_service->is_weak_password( 'somepassword' ) );
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

		$this->assertFalse( $validation_service->is_weak_password( 'somepassword' ) );
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

		$this->assertFalse( $validation_service->is_weak_password( 'somepassword' ) );
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

		$this->assertTrue( $validation_service->is_weak_password( 'somepassword' ) );
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

		$this->assertTrue( $validation_service->is_weak_password( 'somepassword' ) );
	}

	public function test_returns_false_if_password_is_not_weak() {
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

		$this->assertFalse( $validation_service->is_weak_password( 'somepassword' ) );
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
		$user_id       = 1;
		$password_hash = wp_hash_password( 'somepassword' );

		update_user_meta( $user_id, Config::VALIDATION_SERVICE_RECENT_PASSWORD_HASHES_USER_META_KEY, array( $password_hash ) );

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertTrue( $validation_service->is_recent_password( $user_id, 'somepassword' ) );
	}

	public function test_returns_false_if_password_was_not_recently_used() {
		$user_id       = 1;
		$password_hash = wp_hash_password( 'somepassword' );

		update_user_meta( $user_id, Config::VALIDATION_SERVICE_RECENT_PASSWORD_HASHES_USER_META_KEY, array( $password_hash ) );

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertFalse( $validation_service->is_recent_password( $user_id, 'anotherpassword' ) );
	}

	public function test_returns_true_if_password_matches_user_data() {
		$user             = new \WP_User();
		$user->user_email = 'example@wordpress.com';

		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertTrue( $validation_service->matches_user_data( $user, 'WordPress' ) );
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

	public function test_returns_true_if_password_contains_backslash() {
		$validation_service = new Validation_Service( $this->get_connection_manager() );
		$this->assertTrue( $validation_service->contains_backslash( 'password\\' ) );
	}
}
