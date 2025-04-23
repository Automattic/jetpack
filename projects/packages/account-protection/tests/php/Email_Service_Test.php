<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Account_Protection;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the Email_Service class.
 */
class Email_Service_Test extends BaseTestCase {

	public function test_generate_auth_code_returns_valid_code(): void {
		$sut = new Email_Service();
		$this->assertMatchesRegularExpression( '/^[0-9]{6}$/', $sut->generate_auth_code() );
	}

	/**
	 * @dataProvider email_masking_data_provider
	 */
	#[DataProvider( 'email_masking_data_provider' )]
	public function test_mask_email_address_masks_correctly( $plain_email, $expected_masked_email ): void {
		$sut = new Email_Service();
		$this->assertEquals( $expected_masked_email, $sut->mask_email_address( $plain_email ) );
	}

	public static function email_masking_data_provider(): array {
		return array(
			'john.doe@example.com'    => array( 'john.doe@example.com', 'j*******@e******.com' ),
			'mary.smith@gmail.com'    => array( 'mary.smith@gmail.com', 'm*********@g****.com' ),
			'support@company.co.uk'   => array( 'support@company.co.uk', 's******@c******.co.uk' ),
			'test.user123@domain.org' => array( 'test.user123@domain.org', 't***********@d*****.org' ),
		);
	}

	public function test_resend_auth_mail_does_not_resend_if_too_many_attempts(): void {
		$sut = new Email_Service();

		$user     = new \WP_User();
		$user->ID = 1;

		$result = $sut->resend_auth_email(
			$user->ID,
			array(
				'requests' => 5,
			),
			''
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'email_request_limit_exceeded', $result->get_error_code() );
		$this->assertEquals( 'Email request limit exceeded. Please try again later.', $result->get_error_message() );
	}

	public function test_resend_auth_mail_sends_mail_and_remembers_2fa_token_successfully(): void {
		$user     = new \WP_User();
		$user->ID = 1;

		$sut = $this->createPartialMock( Email_Service::class, array( 'api_send_auth_email' ) );
		$sut->expects( $this->once() )->method( 'api_send_auth_email' )
			->with( $user->ID, $this->matchesRegularExpression( '/^[0-9]{6}$/' ) )
			->willReturn( true );

		$transient_data = array(
			'requests' => 0,
		);

		$my_token = 'my_token';

		$result = $sut->resend_auth_email( $user->ID, $transient_data, $my_token );

		error_log( print_r( $result, true ) );

		// Verify the mail was sent
		$this->assertTrue( $result, 'Resending auth mail should return true as success indicator.' );

		// Verify the transient has the expected data
		$new_transient = get_transient( Config::PREFIX . "_{$my_token}" );
		$this->assertSame( 1, $new_transient['requests'], 'Resend attempts should be 1.' );
		$this->assertMatchesRegularExpression( '/^[0-9]{6}$/', $new_transient['auth_code'], 'Auth code should be 6 digits.' );
	}

	public function test_api_send_auth_email_returns_error_if_blog_id_not_available(): void {
		Jetpack_Options::delete_option( 'id' );
		$sut      = new Email_Service();
		$user     = new \WP_User();
		$user->ID = 1;

		$result = $sut->api_send_auth_email( $user->ID, '123456' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'jetpack_connection_error', $result->get_error_code() );
		$this->assertEquals( 'Jetpack is not connected. Please connect and try again.', $result->get_error_message() );
	}

	public function test_api_send_auth_email_returns_error_if_not_connected(): void {
		Jetpack_Options::update_option( 'id', 123 );

		$connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->disableOriginalConstructor()
			->getMock();

		$connection->expects( $this->once() )
			->method( 'is_connected' )
			->willReturn( false );

		$user     = new \WP_User();
		$user->ID = 1;

		$sut    = new Email_Service( $connection );
		$result = $sut->api_send_auth_email( $user->ID, '123456' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'jetpack_connection_error', $result->get_error_code() );
		$this->assertEquals( 'Jetpack is not connected. Please connect and try again.', $result->get_error_message() );
	}

	private function get_connected_connection_manager() {
		$connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->disableOriginalConstructor()
			->getMock();

		$connection->expects( $this->once() )
			->method( 'is_connected' )
			->willReturn( true );

		return $connection;
	}

	public function test_api_send_auth_email_sends_email_successfully(): void {
		Jetpack_Options::update_option( 'id', 123 );

		$sut = $this->getMockBuilder( Email_Service::class )
			->onlyMethods( array( 'send_email_request' ) )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->getMock();

		$sut->expects( $this->once() )
			->method( 'send_email_request' )
			->with(
				123,
				$this->callback(
					function ( $body ) {
						return (int) $body['user_id'] === 1
						&& $body['code'] === '123456';
					}
				)
			)->willReturn(
				array(
					'response' => array( 'code' => 200 ),
					'body'     => json_encode( array( 'email_send_success' => true ) ),
				)
			);

		$user     = new \WP_User();
		$user->ID = 1;

		$this->assertTrue( $sut->api_send_auth_email( $user->ID, '123456' ), 'Email should have been sent.' );
	}

	public function test_api_send_auth_email_returns_error_if_response_is_error(): void {
		Jetpack_Options::update_option( 'id', 123 );

		$sut = $this->getMockBuilder( Email_Service::class )
			->onlyMethods( array( 'send_email_request' ) )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->getMock();

		$sut->expects( $this->once() )
			->method( 'send_email_request' )
			->willReturn( new \WP_Error( 'some_error' ) );

		$user     = new \WP_User();
		$user->ID = 1;

		$result = $sut->api_send_auth_email( $user->ID, '123456' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'email_send_error', $result->get_error_code() );
		$this->assertEquals( 'Failed to send authentication code. Please try again.', $result->get_error_message() );
	}

	public function test_api_send_auth_email_returns_error_if_response_code_is_not_200(): void {
		Jetpack_Options::update_option( 'id', 123 );

		$sut = $this->getMockBuilder( Email_Service::class )
			->onlyMethods( array( 'send_email_request' ) )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->getMock();

		$sut->expects( $this->once() )
			->method( 'send_email_request' )
			->willReturn(
				array(
					'response' => array( 'code' => 404 ),
					'body'     => json_encode(
						array(
							'code'               => 'email_send_error',
							'message'            => 'Failed to send authentication code.',
							'email_send_success' => true,
						)
					),
				)
			);

		$user     = new \WP_User();
		$user->ID = 1;

		$result = $sut->api_send_auth_email( $user->ID, '123456' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'email_send_error', $result->get_error_code() );
		$this->assertEquals( 'Failed to send authentication code.', $result->get_error_message() );
	}

	public function test_api_send_auth_email_returns_error_if_response_body_is_empty(): void {
		Jetpack_Options::update_option( 'id', 123 );

		$sut = $this->getMockBuilder( Email_Service::class )
			->onlyMethods( array( 'send_email_request' ) )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->getMock();

		$sut->expects( $this->once() )
			->method( 'send_email_request' )
			->willReturn(
				array(
					'response' => array( 'code' => 200 ),
					'body'     => '',
				)
			);

		$user     = new \WP_User();
		$user->ID = 1;

		$result = $sut->api_send_auth_email( $user->ID, '123456' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'email_send_error', $result->get_error_code() );
		$this->assertEquals( 'Failed to send authentication code. Please try again.', $result->get_error_message() );
	}

	public function test_api_send_auth_email_returns_error_if_response_from_api_is_false(): void {
		Jetpack_Options::update_option( 'id', 123 );

		$sut = $this->getMockBuilder( Email_Service::class )
			->onlyMethods( array( 'send_email_request' ) )
			->setConstructorArgs( array( $this->get_connected_connection_manager() ) )
			->getMock();

		$sut->expects( $this->once() )
			->method( 'send_email_request' )
			->willReturn(
				array(
					'response' => array( 'code' => 200 ),
					'body'     => json_encode( array( 'email_sent' => false ) ),
				)
			);

		$user     = new \WP_User();
		$user->ID = 1;

		$result = $sut->api_send_auth_email( $user->ID, '123456' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'email_send_error', $result->get_error_code() );
		$this->assertEquals( 'Failed to send authentication code. Please try again.', $result->get_error_message() );
	}
}
