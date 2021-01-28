<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Unit tests for the Connection Webhooks class.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\Webhooks
 */

namespace Automattic\Jetpack\Connection;

use phpmock\Mock;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;
use WP_Error;

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
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
				->setName( 'check_admin_referer' )
				->setFunction(
					function () {
						return true;
					}
				);
		$this->check_admin_referer = $builder->build();
		$this->check_admin_referer->enable();

		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
				->setName( 'wp_safe_redirect' )
				->setFunction(
					function ( $redirect ) {
						$this->redirect_stack[] = $redirect;
						return true;
					}
				);
		$this->wp_safe_redirect = $builder->build();
		$this->wp_safe_redirect->enable();
	}

	/**
	 * Reverting the testing environment to its original state.
	 *
	 * @after
	 */
	public function tear_down() {
		Mock::disableAll();
		$this->redirect_stack = array();
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

		$webhooks->handle_authorize();

		remove_action( 'jetpack_client_authorize_error', $error_handler );

		static::assertInstanceOf( WP_Error::class, $error_result );
		static::assertEquals( array( '/wp-admin/' ), $this->redirect_stack );
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

}
