<?php
/**
 * Tests the TOS package.
 *
 * @package automattic/jetpack-licensing
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_IXR_ClientMulticall;
use stdClass;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Class Test_Licensing
 *
 * @package Automattic\Jetpack
 */
class Test_Licensing extends BaseTestCase {
	/**
	 * Test last_error().
	 */
	public function test_last_error() {
		$licensing = new Licensing();

		delete_option( 'jetpack_options' );
		$this->assertSame( '', $licensing->last_error() );

		update_option( 'jetpack_options', array() );
		$this->assertSame( '', $licensing->last_error() );

		update_option( 'jetpack_options', array( 'licensing_error' => '' ) );
		$this->assertSame( '', $licensing->last_error() );

		update_option( 'jetpack_options', array( 'licensing_error' => 'foo' ) );
		$this->assertSame( 'foo', $licensing->last_error() );

		delete_option( 'jetpack_options' );
	}

	/**
	 * Test log_error().
	 */
	public function test_log_error() {
		$licensing = new Licensing();

		delete_option( 'jetpack_options' );
		$this->assertSame( '', $licensing->last_error() );

		$licensing->log_error( '' );
		$this->assertSame( '', $licensing->last_error() );

		$licensing->log_error( 'foo' );
		$this->assertSame( 'foo', $licensing->last_error() );

		$licensing->log_error( str_repeat( 'a', 2048 ) );
		$this->assertSame( str_repeat( 'a', 1024 ), $licensing->last_error() );

		delete_option( 'jetpack_options' );
	}

	/**
	 * Test stored_licenses().
	 */
	public function test_stored_licenses() {
		$licensing = new Licensing();

		delete_option( Licensing::LICENSES_OPTION_NAME );
		$this->assertSame( array(), $licensing->stored_licenses() );

		update_option( Licensing::LICENSES_OPTION_NAME, new stdClass() );
		$this->assertSame( array(), $licensing->stored_licenses() );

		update_option( Licensing::LICENSES_OPTION_NAME, array() );
		$this->assertSame( array(), $licensing->stored_licenses() );

		update_option( Licensing::LICENSES_OPTION_NAME, array( null ) );
		$this->assertSame( array(), $licensing->stored_licenses() );

		update_option( Licensing::LICENSES_OPTION_NAME, array( new stdClass() ) );
		$this->assertSame( array(), $licensing->stored_licenses() );

		update_option( Licensing::LICENSES_OPTION_NAME, array( 1 ) );
		$this->assertSame( array( '1' ), $licensing->stored_licenses() );

		update_option( Licensing::LICENSES_OPTION_NAME, array( 'foo', 'bar' ) );
		$this->assertSame( array( 'foo', 'bar' ), $licensing->stored_licenses() );

		delete_option( Licensing::LICENSES_OPTION_NAME );
	}

	/**
	 * Test append_license().
	 */
	public function test_append_license() {
		$licensing = new Licensing();

		delete_option( Licensing::LICENSES_OPTION_NAME );

		$did_update = $licensing->append_license( 'foo' );
		$this->assertTrue( $did_update );
		$this->assertSame( array( 'foo' ), $licensing->stored_licenses() );

		update_option( Licensing::LICENSES_OPTION_NAME, array( 'foo', 'bar' ) );
		$did_update = $licensing->append_license( 'baz' );
		$this->assertTrue( $did_update );
		$this->assertSame( array( 'foo', 'bar', 'baz' ), $licensing->stored_licenses() );

		delete_option( Licensing::LICENSES_OPTION_NAME );
	}

	/**
	 * Test attach_licenses() without an active Jetpack connection.
	 */
	public function test_attach_licenses__without_connection() {
		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'has_connected_owner' )->willReturn( false );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'connection' )
		);

		$licensing->method( 'connection' )->willReturn( $connection );

		$result = $licensing->attach_licenses( array() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'not_connected', $result->get_error_code() );
	}

	/**
	 * Test attach_licenses() with an empty input.
	 */
	public function test_attach_licenses__empty_input() {
		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'has_connected_owner' )->willReturn( true );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'connection' )
		);

		$licensing->method( 'connection' )->willReturn( $connection );

		$this->assertSame( array(), $licensing->attach_licenses( array() ) );
	}

	/**
	 * Test attach_licenses() with request failure.
	 */
	public function test_attach_licenses__request_failure() {
		$licenses = array( 'foo', 'bar' );

		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'has_connected_owner' )->willReturn( true );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'connection', 'attach_licenses_request' )
		);

		$licensing->expects( $this->once() )
			->method( 'connection' )
			->willReturn( $connection );

		$ixr_client = $this->createMock( Jetpack_IXR_ClientMulticall::class );
		$ixr_client->method( 'isError' )->willReturn( true );
		$ixr_client->method( 'getErrorCode' )->willReturn( 1 );
		$ixr_client->method( 'getErrorMessage' )->willReturn( 'Expected error message' );

		$licensing->expects( $this->once() )
			->method( 'attach_licenses_request' )
			->with( $licenses )
			->willReturn( $ixr_client );

		$result = $licensing->attach_licenses( $licenses );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( array( 'request_failed', 1 ), $result->get_error_codes() );
		$this->assertSame( 'Expected error message', $result->get_error_messages()[1] );
	}

	/**
	 * Test attach_licenses() with multiple licenses.
	 */
	public function test_attach_licenses__multiple_licenses() {
		$licenses = array( 'foo', 'bar' );

		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'has_connected_owner' )->willReturn( true );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'connection', 'attach_licenses_request' )
		);

		$licensing->expects( $this->once() )
			->method( 'connection' )
			->willReturn( $connection );

		$ixr_client = $this->createMock( Jetpack_IXR_ClientMulticall::class );
		$ixr_client->method( 'isError' )
			->willReturn( false );
		$ixr_client->method( 'getResponse' )
			->willReturn(
				array(
					array(
						'faultCode'   => 1,
						'faultString' => 'Expected error message',
					),
					true,
				)
			);

		$licensing->expects( $this->once() )
			->method( 'attach_licenses_request' )
			->with( $licenses )
			->willReturn( $ixr_client );

		$result = $licensing->attach_licenses( $licenses );

		$this->assertCount( 2, $result );
		$this->assertInstanceOf( WP_Error::class, $result[0] );
		$this->assertSame( 1, $result[0]->get_error_code() );
		$this->assertSame( 'Expected error message', $result[0]->get_error_message() );
		$this->assertTrue( $result[1] );
	}

	/**
	 * Test attach_licenses() with correct response.
	 */
	public function test_attach_licenses__returns_product_ids_on_success() {
		$licenses = array( 'foo' );

		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'has_connected_owner' )->willReturn( true );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'connection', 'attach_licenses_request' )
		);

		$licensing->expects( $this->once() )
			->method( 'connection' )
			->willReturn( $connection );

		$ixr_client = $this->createMock( Jetpack_IXR_ClientMulticall::class );
		$ixr_client->method( 'isError' )->willReturn( false );
		$ixr_client->method( 'query' )->willReturn( null );
		$ixr_client->method( 'getResponse' )->willReturn( array( array( 'activatedProductId' => 1 ) ) );

		$licensing->expects( $this->once() )
			->method( 'attach_licenses_request' )
			->with( $licenses )
			->willReturn( $ixr_client );

		$result = $licensing->attach_licenses( $licenses );

		$this->assertCount( 1, $result );
		$this->assertSame( 1, $result[0]['activatedProductId'] );
	}

	/**
	 * Test attach_stored_licenses().
	 */
	public function test_attach_stored_licenses() {
		$result0  = new WP_Error();
		$result1  = true;
		$licenses = array( 'foo', 'bar' );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'stored_licenses', 'attach_licenses' )
		);

		$licensing->expects( $this->once() )
			->method( 'stored_licenses' )
			->willReturn( $licenses );

		$licensing->expects( $this->once() )
			->method( 'attach_licenses' )
			->with( $licenses )
			->willReturn( array( $result0, $result1 ) );

		$this->assertSame( array( $result0, $result1 ), $licensing->attach_stored_licenses() );
	}

	/**
	 * Test attach_stored_licenses() logs request failure.
	 */
	public function test_attach_stored_licenses__returns_error() {
		$licenses = array( 'foo', 'bar' );

		$error = new WP_Error( 'foo' );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'stored_licenses', 'attach_licenses', 'log_error' )
		);

		$licensing->method( 'stored_licenses' )
			->willReturn( $licenses );

		$licensing->method( 'attach_licenses' )
			->with( $licenses )
			->willReturn( $error );

		$licensing->expects( $this->never() )->method( 'log_error' );

		$result = $licensing->attach_stored_licenses();

		$this->assertSame( $error, $result );
	}

	/**
	 * Test attach_stored_licenses() logs request failure.
	 */
	public function test_attach_stored_licenses__logs_request_failure() {
		$licenses = array( 'foo', 'bar' );

		$error = new WP_Error( 'request_failed' );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'stored_licenses', 'attach_licenses', 'log_error' )
		);

		$licensing->method( 'stored_licenses' )
			->willReturn( $licenses );

		$licensing->method( 'attach_licenses' )
			->with( $licenses )
			->willReturn( $error );

		$licensing->expects( $this->once() )
			->method( 'log_error' )
			->with( 'Failed to attach your Jetpack license(s). Please try reconnecting Jetpack.' );

		$result = $licensing->attach_stored_licenses();

		$this->assertSame( $error, $result );
	}

	/**
	 * Test attach_stored_licenses() logs license attaching failures.
	 */
	public function test_attach_stored_licenses__logs_license_attaching_failures() {
		$result0  = new WP_Error();
		$result1  = true;
		$result2  = new WP_Error();
		$licenses = array( 'foo', 'bar', 'baz' );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'stored_licenses', 'attach_licenses', 'log_error' )
		);

		$licensing->method( 'stored_licenses' )
			->willReturn( $licenses );

		$licensing->method( 'attach_licenses' )
			->with( $licenses )
			->willReturn( array( $result0, $result1, $result2 ) );

		$licensing->expects( $this->once() )
			->method( 'log_error' )
			->with( 'The following Jetpack licenses are invalid, already in use, or revoked: foo, baz' );

		$licensing->attach_stored_licenses();
	}

	/**
	 * Test attach_stored_licenses_on_connection() for the master user.
	 */
	public function test_attach_stored_licenses_on_connection__master_user() {
		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'is_connection_owner' )->willReturn( true );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'connection', 'attach_stored_licenses' )
		);

		$licensing->method( 'connection' )->willReturn( $connection );

		$licensing->expects( $this->once() )
			->method( 'attach_stored_licenses' );

		$licensing->attach_stored_licenses_on_connection();
	}

	/**
	 * Test attach_stored_licenses_on_connection() for a secondary user.
	 */
	public function test_attach_stored_licenses_on_connection__secondary_user() {
		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'is_connection_owner' )->willReturn( false );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'connection', 'attach_stored_licenses' )
		);

		$licensing->method( 'connection' )->willReturn( $connection );

		$licensing->expects( $this->never() )
			->method( 'attach_stored_licenses' );

		$licensing->attach_stored_licenses_on_connection();
	}

}
