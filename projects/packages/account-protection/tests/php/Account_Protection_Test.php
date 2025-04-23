<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

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
		$property->setAccessible( true );
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
}
