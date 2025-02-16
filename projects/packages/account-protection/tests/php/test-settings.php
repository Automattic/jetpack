<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Modules;
use WorDBless\BaseTestCase;

/**
 * Tests for the Settings class.
 */
class Settings_Test extends BaseTestCase {
	public function test_base_case() {
			$modules_mock = $this->createMock( Modules::class );
			$modules_mock->expects( $this->once() )
				->method( 'is_active' )
				->with( Account_Protection::ACCOUNT_PROTECTION_MODULE_NAME )
				->willReturn( true );

			$modules_mock->expects( $this->never() )
				->method( 'activate' );

			$settings = ( new Settings( new Account_Protection( $modules_mock ) ) )->get();

			$this->assertTrue( $settings['isSupported'] );
			$this->assertTrue( $settings['isEnabled'] );
	}
}
