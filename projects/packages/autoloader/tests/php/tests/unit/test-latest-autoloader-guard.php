<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader guard test suite.
 *
 * @package automattic/jetpack-autoloader
 */
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part responsible for ensuring only the latest autoloader is ever executed.
 */
class Test_Latest_Autoloader_Guard extends TestCase {

	/**
	 * The mock Plugins_Handler instance.
	 *
	 * @var Plugins_Handler|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $plugins_handler;

	/**
	 * The mock Autoloader_Handler instance.
	 *
	 * @var Autoloader_Handler|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $autoloader_handler;

	/**
	 * The mock Autoloader_Locator instance.
	 *
	 * @var Autoloader_Locator|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $autoloader_locator;

	/**
	 * The class we're testing.
	 *
	 * @var Latest_Autoloader_Guard
	 */
	private $guard;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->plugins_handler    = $this->getMockBuilder( Plugins_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$this->autoloader_handler = $this->getMockBuilder( Autoloader_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$this->autoloader_locator = $this->getMockBuilder( Autoloader_Locator::class )
			->disableOriginalConstructor()
			->getMock();

		$this->guard = new Latest_Autoloader_Guard(
			$this->plugins_handler,
			$this->autoloader_handler,
			$this->autoloader_locator
		);
	}

	/**
	 * Tests that the guard stops initialization when the autoloader has already initialized.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_should_stop_init_when_autoloader_already_initialized() {
		global $jetpack_autoloader_latest_version;
		$jetpack_autoloader_latest_version = '2.0.0.0';

		$this->assertTrue(
			$this->guard->should_stop_init(
				TEST_DATA_PATH . '/plugins/plugin_current',
				array(),
				false
			)
		);
	}

	/**
	 * Tests that the guard allows initialization when the autoloader has been initialized but we've been deliberately included by it.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_should_allow_init_when_including_latest() {
		// Mark it as already initialized so we can make sure it overrides it.
		global $jetpack_autoloader_latest_version;
		$jetpack_autoloader_latest_version = '2.0.0.0';

		$this->assertFalse(
			$this->guard->should_stop_init(
				TEST_DATA_PATH . '/plugins/plugin_current',
				array(),
				true
			)
		);
	}

	/**
	 * Tests that the guard stops initialization when not the latest autoloader.
	 */
	public function test_should_stop_init_when_not_latest_autoloader() {
		$this->plugins_handler->method( 'have_plugins_changed' )
			->with( array() )
			->willReturn( true );
		$this->autoloader_locator->method( 'find_latest_autoloader' )
			->willReturn( TEST_DATA_PATH . '/plugins/dummy_current' );
		$this->autoloader_locator->method( 'get_autoloader_path' )
			->willReturn( TEST_DATA_PATH . '/plugins/dummy_current/dummy_current.php' );

		$this->assertTrue(
			$this->guard->should_stop_init(
				TEST_DATA_PATH . '/plugins/dummy_newer',
				array(),
				false
			)
		);
	}

	/**
	 * Tests that the guard allows initialization when the latest.
	 */
	public function test_should_allow_init_when_latest() {
		$this->plugins_handler->method( 'have_plugins_changed' )
			->with( array() )
			->willReturn( true );
		$this->autoloader_locator->method( 'find_latest_autoloader' )
			->willReturn( null );

		$this->assertFalse(
			$this->guard->should_stop_init(
				TEST_DATA_PATH . '/plugins/plugin_current',
				array(),
				false
			)
		);
	}

	/**
	 * Tests that the guard resets when plugins have changed.
	 */
	public function test_should_stop_init_should_reset_when_plugins_change() {
		$this->plugins_handler->method( 'have_plugins_changed' )
			->with( array() )
			->willReturn( true );
		$this->autoloader_handler->expects( $this->once() )->method( 'reset_autoloader' );
		$this->autoloader_locator->method( 'find_latest_autoloader' )
			->willReturn( null );

		$this->assertFalse(
			$this->guard->should_stop_init(
				TEST_DATA_PATH . '/plugins/plugin_current',
				array(),
				false
			)
		);
	}
}
