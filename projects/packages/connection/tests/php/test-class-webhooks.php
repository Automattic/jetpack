<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Unit tests for the Connection Webhooks class.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\Webhooks
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Brain\Monkey;
use PHPUnit\Framework\TestCase;
use WP_Error;

// phpcs:disable WordPress.Security.NonceVerification.Recommended

/**
 * Unit tests for the Connection Webhooks class.
 *
 * @see \Automattic\Jetpack\Connection\Webhooks
 */
class Test_Webhooks extends TestCase {

	/**
	 * The redirects captured by the `wp_safe_redirect()` mock function.
	 * Stored in an array in case there are multiple redirects within one query, which is an error and needs to be caught.
	 *
	 * @var array
	 */
	private $redirect_stack = array();

	/**
	 * Setting up the testing environment.
	 *
	 * @throws \phpmock\MockEnabledException The mock exception.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\Functions\when( 'check_admin_referer' )->justReturn( true );
		Monkey\Functions\when( 'wp_safe_redirect' )->alias(
			function ( $redirect ) {
				$this->redirect_stack[] = $redirect;
				return true;
			}
		);
	}

	/**
	 * Reverting the testing environment to its original state.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
		$this->redirect_stack = array();
		unset( $_GET['handler'], $_GET['action'] );
	}

	/**
	 * Unit test for the `Webhooks::handle_authorize()` method.
	 * Capturing the authorization error.
	 *
	 * @covers \Automattic\Jetpack\Connection\Webhooks::handle_authorize
	 */
	public function test_handle_authorize_fail() {
		$webhooks = new Webhooks( new Manager() );

		$error_result  = null;
		$error_handler = function ( $error ) use ( &$error_result ) {
			$error_result = $error;
		};
		add_action( 'jetpack_client_authorize_error', $error_handler );

		$processing_started = false;
		$processing_handler = function () use ( &$processing_started ) {
			$processing_started = true;
		};
		add_action( 'jetpack_client_authorize_processing', $processing_handler );

		$webhooks->handle_authorize();

		remove_action( 'jetpack_client_authorize_error', $error_handler );
		remove_action( 'jetpack_client_authorize_processing', $processing_handler );

		static::assertInstanceOf( WP_Error::class, $error_result );
		static::assertEquals( array( 'http://example.org/wp-admin/' ), $this->redirect_stack );

		static::assertTrue( $processing_started, 'The `jetpack_client_authorize_processing` hook was not executed.' );
	}

	/**
	 * Unit test for the `Webhooks::handle_authorize()` method.
	 * Testing the successful authorization.
	 *
	 * @covers \Automattic\Jetpack\Connection\Webhooks::handle_authorize
	 */
	public function test_handle_authorize_success() {
		$manager = $this->createMock( Manager::class );
		$manager->method( 'authorize' )
				->willReturn( 'authorized' );

		$webhooks = new Webhooks( $manager );

		$success_handler_called = false;
		$success_handler        = function () use ( &$success_handler_called ) {
			$success_handler_called = true;
		};
		add_action( 'jetpack_client_authorized', $success_handler );

		$_GET['redirect'] = '/wp-admin/?something';
		$webhooks->handle_authorize();

		remove_action( 'jetpack_client_authorized', $success_handler );
		unset( $_GET['redirect'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		static::assertTrue( $success_handler_called );
		static::assertEquals( array( '/wp-admin/?something' ), $this->redirect_stack );
	}

	/**
	 * Unit test for the `Webhooks::controller()` method.
	 *
	 * @covers \Automattic\Jetpack\Connection\Webhooks::controller
	 */
	public function test_controller() {
		$webhooks = $this->getMockBuilder( Webhooks::class )
			->setConstructorArgs( array( new Manager() ) )
			->setMethods( array( 'do_exit', 'handle_authorize', 'handle_authorize_redirect' ) )
			->getMock();

		$controller_skipped = $webhooks->controller();

		$webhooks->expects( $this->once() )
			->method( 'handle_authorize' );

		$webhooks->expects( $this->once() )
			->method( 'handle_authorize_redirect' );

		$_GET['handler'] = 'jetpack-connection-webhooks';
		$_GET['action']  = 'invalid-action';

		// No callback should be called because action is empty.
		$webhooks->controller();

		$_GET['action'] = 'authorize';

		// `handle_authorize` gets called.
		$webhooks->controller();

		$_GET['action'] = 'authorize_redirect';

		// `handle_authorize_redirect` gets called.
		$webhooks->controller();

		static::assertNull( $controller_skipped );
	}

	/**
	 * Unit test for the `Webhooks::handle_connect_url_redirect()` method.
	 * Testing the repeated attempt to authorize user.
	 *
	 * @covers \Automattic\Jetpack\Connection\Webhooks::handle_authorize
	 */
	public function test_handle_connect_url_redirect() {
		$webhooks = $this->getMockBuilder( Webhooks::class )
			->setConstructorArgs( array( new Manager() ) )
			->setMethods( array( 'do_exit' ) )
			->getMock();

		Constants::set_constant( 'JETPACK__API_BASE', 'https://example.com/api/base.' );
		Constants::set_constant( 'JETPACK__API_VERSION', '1' );

		set_transient( 'jetpack_assumed_site_creation_date', '2022-06-02 11:22:33' );

		$webhooks->handle_connect_url_redirect();

		delete_transient( 'jetpack_assumed_site_creation_date' );
		Constants::clear_single_constant( 'JETPACK__API_BASE' );
		Constants::clear_single_constant( 'JETPACK__API_VERSION' );

		static::assertCount( 1, $this->redirect_stack );
		static::assertStringStartsWith( 'https://example.com/api/base.authorize/1/?response_type=code&', $this->redirect_stack[0] );
	}
}
