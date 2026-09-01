<?php

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Modules;
use WorDBless\BaseTestCase;

/**
 * Tests for the Account_Protection module class.
 */
class Account_Protection_Test extends BaseTestCase {

	public function test_is_enabled_proxies_to_modules_dependency(): void {
		$modules_mock = $this->createMock( Modules::class );
		$modules_mock->expects( $this->once() )
			->method( 'is_active' )
			->with( Account_Protection::ACCOUNT_PROTECTION_MODULE_NAME )
			->willReturn( true );

		$sut = new Account_Protection( $modules_mock );
		$this->assertTrue( $sut->is_enabled(), 'Module should be enabled.' );
	}

	public function test_init_registers_hooks_and_runtime_hooks_if_module_enabled(): void {
		$sut = $this->createPartialMock( Account_Protection::class, array( 'is_enabled', 'register_hooks', 'register_runtime_hooks' ) );
		$sut->expects( $this->once() )
			->method( 'is_enabled' )
			->willReturn( true );

		$sut->expects( $this->once() )
			->method( 'register_hooks' );

		$sut->expects( $this->once() )
			->method( 'register_runtime_hooks' );

		$sut->initialize();
	}

	public function test_init_registers_hooks_but_not_runtime_hooks_if_module_disabled(): void {
		$reflection = new \ReflectionClass( Account_Protection::class );
		$property   = $reflection->getProperty( 'hooks_registered' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );

		$sut = $this->createPartialMock( Account_Protection::class, array( 'is_enabled', 'register_hooks', 'register_runtime_hooks' ) );
		$sut->expects( $this->once() )
			->method( 'is_enabled' )
			->willReturn( false );

		$sut->expects( $this->once() )
			->method( 'register_hooks' );

		$sut->expects( $this->never() )
			->method( 'register_runtime_hooks' );

		$sut->initialize();
	}

	public function test_enable_activates_module_if_not_activated_yet(): void {
		$modules_mock = $this->createMock( Modules::class );
		$modules_mock->expects( $this->once() )
			->method( 'is_active' )
			->willReturn( false );

		$modules_mock->expects( $this->once() )
			->method( 'activate' )
			->with( Account_Protection::ACCOUNT_PROTECTION_MODULE_NAME, false, false )
			->willReturn( true );

		$sut = new Account_Protection( $modules_mock );
		$this->assertTrue( $sut->enable(), 'Module should be enabled successfully.' );
	}

	public function test_enable_does_nothing_if_module_already_activated(): void {
		$modules_mock = $this->createMock( Modules::class );
		$modules_mock->expects( $this->once() )
			->method( 'is_active' )
			->willReturn( true );

		$modules_mock->expects( $this->never() )
			->method( 'activate' );

		$sut = new Account_Protection( $modules_mock );
		$this->assertTrue( $sut->enable(), 'Module should be enabled successfully.' );
	}

	public function test_disable_deactivates_module_if_active(): void {
		$modules_mock = $this->createMock( Modules::class );
		$modules_mock->expects( $this->once() )
			->method( 'is_active' )
			->willReturn( true );

		$modules_mock->expects( $this->once() )
			->method( 'deactivate' )
			->with( Account_Protection::ACCOUNT_PROTECTION_MODULE_NAME )
			->willReturn( true );

		$sut = new Account_Protection( $modules_mock );
		$this->assertTrue( $sut->disable(), 'Module should be disabled successfully.' );
	}

	public function test_disable_does_nothing_if_module_already_inactive(): void {
		$modules_mock = $this->createMock( Modules::class );
		$modules_mock->expects( $this->once() )
			->method( 'is_active' )
			->willReturn( false );

		$modules_mock->expects( $this->never() )
			->method( 'deactivate' );

		$sut = new Account_Protection( $modules_mock );
		$this->assertTrue( $sut->disable(), 'Module should be disabled successfully.' );
	}

	public function test_remove_module_on_unsupported_environments_removes_itself_correctly(): void {
		$sut = $this->createPartialMock( Account_Protection::class, array( 'is_supported_environment' ) );
		$sut->expects( $this->once() )
			->method( 'is_supported_environment' )
			->willReturn( false );

		$all_modules = array(
			'something-else' => 'should_remain',
			Account_Protection::ACCOUNT_PROTECTION_MODULE_NAME => 'should_be_removed',
		);

		$all_modules = $sut->remove_module_on_unsupported_environments( $all_modules );

		$this->assertArrayNotHasKey( Account_Protection::ACCOUNT_PROTECTION_MODULE_NAME, $all_modules, 'The module should have removed itself.' );
	}

	public function test_remove_standalone_module_on_unsupported_environments_removes_itself_correctly(): void {
		$sut = $this->createPartialMock( Account_Protection::class, array( 'is_supported_environment' ) );
		$sut->expects( $this->once() )
			->method( 'is_supported_environment' )
			->willReturn( false );

		$all_modules = array(
			'some_other_module',
			Account_Protection::ACCOUNT_PROTECTION_MODULE_NAME,
		);

		$all_modules = $sut->remove_standalone_module_on_unsupported_environments( $all_modules );

		$this->assertNotContains( Account_Protection::ACCOUNT_PROTECTION_MODULE_NAME, $all_modules, 'The module should have removed itself.' );
	}

	/**
	 * The password collaborators are now built lazily, so `register_password_detection_hooks()`
	 * has to construct a `Password_Detection` itself before wiring the login hooks. Guard that
	 * the lazy build still happens and that `wp_authenticate_user` ends up bound to it. Without
	 * this, a regression in the lazy build would silently stop the login-time leaked-password
	 * check from registering while the rest of the suite stayed green.
	 */
	public function test_register_password_detection_hooks_lazily_builds_and_wires_wp_authenticate_user(): void {
		$sut = new Account_Protection();

		$property = ( new \ReflectionClass( Account_Protection::class ) )->getProperty( 'password_detection' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}

		/*
		 * The whole point of the deferral is that the constructor does not build the collaborator;
		 * it is created lazily when the runtime hooks are registered. Assert that here so this test
		 * fails if the constructor is ever changed to build Password_Detection eagerly.
		 */
		$this->assertNull(
			$property->getValue( $sut ),
			'Password_Detection should not be constructed before register_password_detection_hooks() runs.'
		);

		$sut->register_password_detection_hooks();

		$this->assertNotFalse(
			has_action( 'wp_authenticate_user' ),
			'wp_authenticate_user should have a callback registered after register_password_detection_hooks().'
		);

		$callback = $this->get_hook_callback_object( 'wp_authenticate_user', 'login_form_password_detection' );
		$this->assertInstanceOf(
			Password_Detection::class,
			$callback,
			'wp_authenticate_user should be wired to a lazily-built Password_Detection instance.'
		);

		$this->assertSame(
			$property->getValue( $sut ),
			$callback,
			'wp_authenticate_user should be wired to the same lazily-built Password_Detection instance the object cached.'
		);
	}

	/**
	 * When an instance is injected (as tests do), the lazy build is skipped and the injected
	 * instance is the one wired to the login hook.
	 */
	public function test_register_password_detection_hooks_wires_injected_instance(): void {
		$password_detection = new Password_Detection();

		$sut = new Account_Protection( null, $password_detection );
		$sut->register_password_detection_hooks();

		$this->assertSame(
			10,
			has_action( 'wp_authenticate_user', array( $password_detection, 'login_form_password_detection' ) ),
			'wp_authenticate_user should be wired to the injected Password_Detection at priority 10.'
		);
	}

	/**
	 * Find the object bound to the first callback registered for $hook whose method name is
	 * $method, regardless of priority. Returns null when no such callback exists.
	 *
	 * @param string $hook   Hook name.
	 * @param string $method Method name on the callback object.
	 * @return object|null
	 */
	private function get_hook_callback_object( string $hook, string $method ) {
		global $wp_filter;

		if ( empty( $wp_filter[ $hook ] ) ) {
			return null;
		}

		foreach ( $wp_filter[ $hook ]->callbacks as $callbacks ) {
			foreach ( $callbacks as $callback ) {
				if ( is_array( $callback['function'] )
					&& is_object( $callback['function'][0] )
					&& $callback['function'][1] === $method ) {
					return $callback['function'][0];
				}
			}
		}

		return null;
	}
}
