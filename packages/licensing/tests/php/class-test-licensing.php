<?php // phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited
/**
 * Tests the TOS package.
 *
 * @package automattic/jetpack-licensing
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Licensing;
use Jetpack_IXR_ClientMulticall;
use Jetpack_Options;
use phpmock\Mock;
use phpmock\MockBuilder;
use stdClass;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_User;

/**
 * Class Test_Licensing
 *
 * @package Automattic\Jetpack
 */
class Test_Licensing extends BaseTestCase {
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
	 * Test attach_licenses() without an active Jetpack connection.
	 */
	public function test_attach_licenses__without_connection() {
		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'is_active' )->willReturn( false );

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

		$connection->method( 'is_active' )->willReturn( true );

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
		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'is_active' )->willReturn( true );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'connection', 'request' )
		);

		$licensing->expects( $this->once() )
			->method( 'connection' )
			->willReturn( $connection );

		$ixr_client = $this->createMock( Jetpack_IXR_ClientMulticall::class );
		$ixr_client->method( 'isError' )->willReturn( true );
		$ixr_client->method( 'getErrorCode' )->willReturn( 1 );
		$ixr_client->method( 'getErrorMessage' )->willReturn( 'Expected error message' );

		$licensing->expects( $this->once() )
			->method( 'request' )
			->with( array( 'user_id' => JETPACK_MASTER_USER ) )
			->willReturn( $ixr_client );

		$result = $licensing->attach_licenses( array( 'foo', 'bar' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( array( 'request_failed', 1 ), $result->get_error_codes() );
		$this->assertSame( 'Expected error message', $result->get_error_messages()[1] );
	}

	/**
	 * Test attach_licenses() with multiple licenses.
	 */
	public function test_attach_licenses__multiple_licenses() {
		$connection = $this->createMock( Connection_Manager::class );

		$connection->method( 'is_active' )->willReturn( true );

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'connection', 'request' )
		);

		$licensing->expects( $this->once() )
			->method( 'connection' )
			->willReturn( $connection );

		$ixr_client = $this->createMock( Jetpack_IXR_ClientMulticall::class );
		$ixr_client->expects( $this->exactly( 2 ) )
			->method( 'addCall' )
			->withConsecutive(
				array( 'jetpack.attachLicense', 'foo' ),
				array( 'jetpack.attachLicense', 'bar' )
			);
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
			->method( 'request' )
			->with( array( 'user_id' => JETPACK_MASTER_USER ) )
			->willReturn( $ixr_client );

		$result = $licensing->attach_licenses( array( 'foo', 'bar' ) );

		$this->assertSame( 2, count( $result ) );
		$this->assertInstanceOf( WP_Error::class, $result[0] );
		$this->assertSame( 1, $result[0]->get_error_code() );
		$this->assertSame( 'Expected error message', $result[0]->get_error_message() );
		$this->assertTrue( $result[1] );
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
	 * Test attach_stored_licenses() fires the request failure action.
	 */
	public function test_attach_stored_licenses__fires_request_failure_action() {
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
			->willReturn( new WP_Error( 'request_failed' ) );

		$times = did_action( 'jetpack_licensing_stored_licenses_request_failed' );
		$licensing->attach_stored_licenses();
		$this->assertSame( $times + 1, did_action( 'jetpack_licensing_stored_licenses_request_failed' ) );
	}

	/**
	 * Test attach_stored_licenses() fires the license attaching failure action.
	 */
	public function test_attach_stored_licenses__fires_license_attaching_failures_action() {
		$result0  = new WP_Error();
		$result1  = true;
		$result2  = new WP_Error();
		$licenses = array( 'foo', 'bar', 'baz' );

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
			->willReturn( array( $result0, $result1, $result2 ) );

		$spy_ran = 0;
		$spy     = function ( $errors ) use ( &$spy_ran ) {
			$spy_ran++;

			$this->assertInstanceOf( WP_Error::class, $errors[0]['error'] );
			$this->assertSame( 'foo', $errors[0]['license'] );
			$this->assertInstanceOf( WP_Error::class, $errors[1]['error'] );
			$this->assertSame( 'baz', $errors[1]['license'] );
		};

		add_action( 'jetpack_licensing_stored_licenses_attaching_failed', $spy );
		$licensing->attach_stored_licenses();
		remove_action( 'jetpack_licensing_stored_licenses_attaching_failed', $spy );

		$this->assertSame( 1, $spy_ran );
	}

	/**
	 * Test attach_stored_licenses_on_connection() for the master user.
	 */
	public function test_attach_stored_licenses_on_connection__master_user() {
		global $current_user;

		$old_user = $current_user;

		Jetpack_Options::update_option( 'master_user', 1 );
		$current_user     = $this->createMock( WP_User::class );
		$current_user->ID = 1;

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'attach_stored_licenses' )
		);

		$licensing->expects( $this->once() )
			->method( 'attach_stored_licenses' );

		$licensing->attach_stored_licenses_on_connection();

		$current_user = $old_user;
		Jetpack_Options::update_option( 'master_user', false );
	}

	/**
	 * Test attach_stored_licenses_on_connection() for a secondary user.
	 */
	public function test_attach_stored_licenses_on_connection__secondary_user() {
		global $current_user;

		$old_user = $current_user;

		Jetpack_Options::update_option( 'master_user', 1 );
		$current_user     = $this->createMock( WP_User::class );
		$current_user->ID = 2;

		$licensing = $this->createPartialMock(
			Licensing::class,
			array( 'attach_stored_licenses' )
		);

		$licensing->expects( $this->never() )
			->method( 'attach_stored_licenses' );

		$licensing->attach_stored_licenses_on_connection();

		$current_user = $old_user;
		Jetpack_Options::update_option( 'master_user', false );
	}
}
