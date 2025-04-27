<?php

namespace Automattic\Jetpack\Sync;

use WorDBless\BaseTestCase;

/**
 * Unit tests for the Automattic\Jetpack\Sync\Modules class.
 *
 * @package automattic/jetpack-sync
 */
class Modules_Test extends BaseTestCase {

	/**
	 * Runs before every test in this class.
	 */
	public function set_up() {
		// Reset private static properties after each test.
		$reflection_class = new \ReflectionClass( '\Automattic\Jetpack\Sync\Modules' );
		try {
			$reflection_class->setStaticPropertyValue( 'initialized_modules', null );
		} catch ( \ReflectionException $e ) { // PHP 7 compat
			$configured = $reflection_class->getProperty( 'initialized_modules' );
			$configured->setAccessible( true );
			$configured->setValue( null );
		}
	}

	/**
	 * Runs after every test in this class.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_sync_modules', array( $this, 'add_posts_module' ) );
	}

	/**
	 * Tests get_modules with duplicate modules.
	 */
	public function test_get_modules_will_remove_duplicates() {
		add_filter( 'jetpack_sync_modules', array( $this, 'add_posts_module' ) );

		$modules        = Modules::get_modules();
		$module_classes = array();
		foreach ( $modules as $module ) {
			$module_classes[] = get_class( $module );
		}

		$this->assertSame( Modules::DEFAULT_SYNC_MODULES, $module_classes );
	}

	/**
	 * Adds Sync Posts module to Sync's module list.
	 *
	 * @param array $sync_modules The list of sync modules declared prior to this filter.
	 *
	 * @return array A list of sync modules that now includes Posts modules.
	 */
	public function add_posts_module( array $sync_modules ) {
		$sync_modules[] = 'Automattic\\Jetpack\\Sync\\Modules\\Posts';

		return $sync_modules;
	}
}
