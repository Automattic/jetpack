<?php
/**
 * Autoloader plugin ordering test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * Manifests are read in list order and `Manifest_Reader::register_record()` only replaces an
 * entry on a strict version increase, so the first directory read wins every version tie.
 *
 * @runTestsInSeparateProcesses Ensure that each test loads class files new.
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class RollingBuildOrderTest extends TestCase {

	/**
	 * Stands in for the directory a host rollout just retired, still named by the cache.
	 */
	const RETIRED_BUILD = '/wordpress/plugins/wpcomsh/10.0.0-alpha+rolling.1788284476.gbdcfa78';

	/**
	 * Stands in for the directory the rollout just made live.
	 */
	const LIVE_BUILD = '/wordpress/plugins/wpcomsh/10.0.0-alpha+rolling.1788352175.g5d0a8fd';

	/**
	 * Tests the plugin order when the autoloader was handed control by another plugin's
	 * autoloader, which is when the current plugin is left out of the active list.
	 */
	public function test_live_build_is_read_before_cached_retired_build_when_included_by_another_autoloader() {
		$activated = $this->init_autoloader_with( true, array() );

		$this->assertSame(
			array( self::LIVE_BUILD, self::RETIRED_BUILD ),
			$activated,
			'The retired build was read before the live build, so it wins every version tie.'
		);
	}

	/**
	 * Tests the plugin order in the ordinary case, where the current plugin is recorded as active.
	 */
	public function test_live_build_is_read_before_cached_retired_build_when_recorded_as_active() {
		$activated = $this->init_autoloader_with( false, array( self::LIVE_BUILD ) );

		$this->assertSame(
			array( self::LIVE_BUILD, self::RETIRED_BUILD ),
			$activated,
			'The retired build was read before the live build, so it wins every version tie.'
		);
	}

	/**
	 * Runs `Autoloader::init()` against mocks and returns the plugin list it activated with.
	 *
	 * @param bool     $is_initializing Whether another autoloader handed control to this one.
	 * @param string[] $active_plugins  The plugins the handler discovers as active.
	 * @return string[] The plugin list passed to `activate_autoloader()`.
	 */
	private function init_autoloader_with( $is_initializing, $active_plugins ) {
		$test_container = new Test_Container();

		$plugin_locator = $this->createStub( Plugin_Locator::class );
		$plugin_locator->method( 'find_current_plugin' )->willReturn( self::LIVE_BUILD );
		$test_container->replace( Plugin_Locator::class, $plugin_locator );

		$plugins_handler = $this->createStub( Plugins_Handler::class );
		$plugins_handler->method( 'get_active_plugins' )->willReturn( $active_plugins );
		$plugins_handler->method( 'get_cached_plugins' )->willReturn( array( self::RETIRED_BUILD ) );
		$test_container->replace( Plugins_Handler::class, $plugins_handler );

		$guard = $this->createStub( Latest_Autoloader_Guard::class );
		$guard->method( 'should_stop_init' )->willReturn( false );
		$test_container->replace( Latest_Autoloader_Guard::class, $guard );

		$autoloader_handler = $this->createMock( Autoloader_Handler::class );
		$autoloader_handler->method( 'is_initializing' )->willReturn( $is_initializing );
		$test_container->replace( Autoloader_Handler::class, $autoloader_handler );

		$activated = null;
		$autoloader_handler->expects( $this->once() )
			->method( 'activate_autoloader' )
			->willReturnCallback(
				function ( $plugins ) use ( &$activated ) {
					$activated = $plugins;
				}
			);

		Autoloader::init( $test_container );

		if ( ! is_array( $activated ) ) {
			$this->fail( 'The autoloader never called activate_autoloader().' );
		}

		return $activated;
	}
}
