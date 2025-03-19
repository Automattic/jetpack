<?php

namespace Automattic\Jetpack\Account_Protection;

use WorDBless\BaseTestCase;

/**
 * Tests for the Password_Strength_Meter class.
 */
class Password_Strength_Meter_Test extends BaseTestCase {

	private $validation_service;
	private $password_strength_meter;

	protected function setUp(): void {
		parent::setUp();
		$this->validation_service = $this->createMock( Validation_Service::class );

		$this->password_strength_meter = $this->getMockBuilder( Password_Strength_Meter::class )
			->setConstructorArgs( array( $this->validation_service ) )
			->onlyMethods( array( 'verify_nonce', 'send_json_error', 'send_json_success' ) )
			->getMock();
	}

	public function test_constructor_initializes_validation_service() {
		$instance = new Password_Strength_Meter();
		$this->assertInstanceOf( Password_Strength_Meter::class, $instance );
	}

	public function test_validate_password_ajax_missing_password() {
		$_POST = array( 'nonce' => 'valid_nonce' );

		$this->password_strength_meter->expects( $this->once() )
			->method( 'send_json_error' )
			->with( 'No password provided.' );

		$this->password_strength_meter->validate_password_ajax();
	}

	public function test_validate_password_ajax_invalid_nonce() {
		$_POST = array(
			'password' => 'securepassword',
			'nonce'    => 'invalid_nonce',
		);

		$this->password_strength_meter->expects( $this->once() )
			->method( 'verify_nonce' )
			->with( 'invalid_nonce', 'validate_password_nonce' )
			->willReturn( false );

		$this->password_strength_meter->expects( $this->once() )
			->method( 'send_json_error' )
			->with( 'Invalid nonce.' );

		$this->password_strength_meter->validate_password_ajax();
	}

	public function test_validate_password_ajax_valid_request() {
		$_POST = array(
			'password'      => 'securepassword',
			'nonce'         => 'valid_nonce',
			'user_specific' => 'true',
		);

		$this->password_strength_meter->expects( $this->once() )
			->method( 'verify_nonce' )
			->with( 'valid_nonce', 'validate_password_nonce' )
			->willReturn( true );

		$this->validation_service->expects( $this->once() )
			->method( 'get_validation_state' )
			->with( 'securepassword', true )
			->willReturn( array( 'status' => 'valid' ) );

		$this->password_strength_meter->expects( $this->once() )
			->method( 'send_json_success' )
			->with( array( 'state' => array( 'status' => 'valid' ) ) );

		$this->password_strength_meter->validate_password_ajax();
	}
}
