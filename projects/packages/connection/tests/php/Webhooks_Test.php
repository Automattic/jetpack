<?php
/**
 * Unit tests for the Connection Webhooks class.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\Webhooks
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Brain\Monkey;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WP_Error;

/**
 * Unit tests for the Connection Webhooks class.
 *
 * @see \Automattic\Jetpack\Connection\Webhooks
 * @covers \Automattic\Jetpack\Connection\Webhooks
 */
#[CoversClass( Webhooks::class )]
class Webhooks_Test extends TestCase {

	/**
	 * The redirects captured by the `wp_safe_redirect()` mock function.
	 * Stored in an array in case there are multiple redirects within one query, which is an error and needs to be caught.
	 *
	 * @var array
	 */
	private $redirect_stack = array();

	/**
	 * The Manager instance that maps the Connection capabilities.
	 *
	 * @var Manager
	 */
	private $caps_manager;

	/**
	 * Setting up the testing environment.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\Functions\when( 'check_admin_referer' )->justReturn( true );
		$this->caps_manager = new Manager();
		add_filter( 'map_meta_cap', array( $this->caps_manager, 'jetpack_connection_custom_caps' ), 1, 4 );
		Monkey\Functions\when( 'wp_safe_redirect' )->alias(
			function ( $redirect ) {
				$this->redirect_stack[] = $redirect;
				return true;
			}
		);
	}

	/**
	 * Reverting the testing environment to its original state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		Monkey\tearDown();
		$this->redirect_stack = array();
		unset( $_GET['handler'], $_GET['action'] );
		remove_filter( 'map_meta_cap', array( $this->caps_manager, 'jetpack_connection_custom_caps' ), 1 );
		wp_set_current_user( 0 );
	}

	/**
	 * Unit test for the `Webhooks::handle_authorize()` method.
	 * Capturing the authorization error.
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
	 */
	public function test_handle_authorize_success() {
		$manager = $this->createStub( Manager::class );
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
		unset( $_GET['redirect'] );

		static::assertTrue( $success_handler_called );
		static::assertEquals( array( '/wp-admin/?something' ), $this->redirect_stack );
	}

	/**
	 * Unit test for the `Webhooks::controller()` method.
	 */
	public function test_controller() {
		$webhooks = $this->getMockBuilder( Webhooks::class )
			->setConstructorArgs( array( new Manager() ) )
			->onlyMethods( array( 'do_exit', 'handle_authorize', 'handle_authorize_redirect' ) )
			->getMock();

		$webhooks->controller();

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
	}

	/**
	 * Unit test for the `Webhooks::handle_connect_url_redirect()` method.
	 * Testing the repeated attempt to authorize user.
	 */
	public function test_handle_connect_url_redirect() {
		$webhooks = $this->getMockBuilder( Webhooks::class )
			->setConstructorArgs( array( new Manager() ) )
			->onlyMethods( array( 'do_exit' ) )
			->getMock();
		$webhooks->expects( $this->once() )->method( 'do_exit' );

		Constants::set_constant( 'JETPACK__API_BASE', 'https://example.com/api/base.' );
		Constants::set_constant( 'JETPACK__API_VERSION', '1' );

		set_transient( 'jetpack_assumed_site_creation_date', '2022-06-02 11:22:33' );
		wp_set_current_user( $this->get_user_id( 'editor' ) );

		$webhooks->handle_connect_url_redirect();

		delete_transient( 'jetpack_assumed_site_creation_date' );
		Constants::clear_single_constant( 'JETPACK__API_BASE' );
		Constants::clear_single_constant( 'JETPACK__API_VERSION' );

		static::assertCount( 1, $this->redirect_stack );
		static::assertStringStartsWith( 'https://example.com/api/base.authorize/1/?response_type=code&', $this->redirect_stack[0] );
	}

	/**
	 * Unit test for the `Webhooks::handle_connect_url_redirect()` method.
	 * Testing who can register an unregistered site before being sent to authorize.
	 *
	 * @param string|null $role            The current user's role, or null when logged out.
	 * @param bool        $expect_register Whether the site should be registered.
	 * @param bool        $expect_redirect Whether the user should be redirected.
	 *
	 * @dataProvider provide_connect_url_redirect_users
	 */
	#[DataProvider( 'provide_connect_url_redirect_users' )]
	public function test_handle_connect_url_redirect_registers_only_for_users_who_can_connect( $role, $expect_register, $expect_redirect ) {
		$manager = $this->createMock( Manager::class );
		$manager->method( 'is_user_connected' )->willReturn( false );
		$manager->method( 'is_connected' )->willReturn( false );
		$manager->method( 'get_authorization_url' )->willReturn( 'https://example.com/authorize/' );
		$manager->expects( $expect_register ? $this->once() : $this->never() )->method( 'register' );

		$webhooks = $this->getMockBuilder( Webhooks::class )
			->setConstructorArgs( array( $manager ) )
			->onlyMethods( array( 'do_exit' ) )
			->getMock();
		$webhooks->expects( $this->exactly( $expect_redirect ? 1 : 0 ) )->method( 'do_exit' );

		wp_set_current_user( $role ? $this->get_user_id( $role ) : 0 );

		$webhooks->handle_connect_url_redirect();

		static::assertCount( $expect_redirect ? 1 : 0, $this->redirect_stack );
	}

	/**
	 * Data provider for `test_handle_connect_url_redirect_registers_only_for_users_who_can_connect()`.
	 *
	 * @return array
	 */
	public static function provide_connect_url_redirect_users() {
		return array(
			'logged out'    => array( null, false, false ),
			'editor'        => array( 'editor', false, true ),
			'administrator' => array( 'administrator', true, true ),
		);
	}

	/**
	 * Get the ID of a test user with the given role, creating it on first use.
	 *
	 * @param string $role The user role.
	 * @return int
	 */
	private function get_user_id( $role ) {
		$user = get_user_by( 'login', "webhooks_{$role}" );
		if ( $user ) {
			return $user->ID;
		}

		return wp_insert_user(
			array(
				'user_login' => "webhooks_{$role}",
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
	}
}
