<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Shutdown handler test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Shutdown_Handler.
 */
class ShutdownHandlerTest extends TestCase {

	/**
	 * The mock Plugins_Handler instance.
	 *
	 * @var Plugins_Handler|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $plugins_handler;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->plugins_handler = $this->getMockBuilder( Plugins_Handler::class )
			->disableOriginalConstructor()
			->getMock();
	}

	/**
	 * Tests that the shutdown handler caches the active plugins.
	 */
	public function test_shutdown_caches_active_plugins() {
		$this->plugins_handler->expects( $this->once() )
			->method( 'get_active_plugins' )
			->with( false, true )
			->willReturn( array( TEST_PLUGIN_DIR ) );
		$this->plugins_handler->expects( $this->once() )
			->method( 'cache_plugins' )
			->with( array( TEST_PLUGIN_DIR ) );

		// Mark that the plugins have been loaded so that we can perform a safe shutdown.
		do_action( 'plugins_loaded' );

		$handler = new Shutdown_Handler( $this->plugins_handler, array(), false );
		$handler();
	}

	/**
	 * Tests that the shutdown handler does not update the cache if it has not changed.
	 */
	public function test_shutdown_does_not_save_unchanged_cache() {
		$this->plugins_handler->expects( $this->once() )
			->method( 'get_active_plugins' )
			->with( false, true )
			->willReturn( array( TEST_PLUGIN_DIR ) );
		$this->plugins_handler->expects( $this->never() )
			->method( 'cache_plugins' );

		// Mark that the plugins have been loaded so that we can perform a safe shutdown.
		do_action( 'plugins_loaded' );

		$handler = new Shutdown_Handler( $this->plugins_handler, array( TEST_PLUGIN_DIR ), false );
		$handler();
	}

	/**
	 * Tests that shutting down early empties the cache.
	 */
	public function test_shutdown_early_empties_cache() {
		$this->plugins_handler->expects( $this->once() )
			->method( 'cache_plugins' )
			->with( array() );

		// Do NOT run plugins_loaded so that the shutdown can be considered early.

		$handler = new Shutdown_Handler( $this->plugins_handler, array( TEST_PLUGIN_DIR ), false );
		$handler();
	}

	/**
	 * Tests that expected exceptions thrown during shutdown aren't propogated.
	 */
	public function test_shutdown_handles_exceptions() {
		$this->plugins_handler->expects( $this->once() )
			->method( 'get_active_plugins' )
			->with( false, true )
			->willThrowException( new \RuntimeException() );
		$this->plugins_handler->expects( $this->once() )
			->method( 'cache_plugins' )
			->with( array() );

		// Mark that the plugins have been loaded so that we can perform a safe shutdown.
		do_action( 'plugins_loaded' );

		$handler = new Shutdown_Handler( $this->plugins_handler, array( TEST_PLUGIN_DIR ), false );
		$handler();
	}
}
