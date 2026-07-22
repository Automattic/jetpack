<?php

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/stubs/class-first-duplicate-name-module.php';
require_once __DIR__ . '/stubs/class-second-duplicate-name-module.php';

/**
 * Unit tests for the Automattic\Jetpack\Sync\Modules class.
 *
 * @package automattic/jetpack-sync
 */
class Modules_Test extends BaseTestCase {

	/**
	 * Extra module classes appended by the test filter.
	 *
	 * @var string[]
	 */
	private $additional_modules = array();

	/**
	 * Runs before every test in this class.
	 */
	public function set_up() {
		// Reset private static properties after each test.
		$reflection_class = new \ReflectionClass( '\Automattic\Jetpack\Sync\Modules' );
		try {
			$reflection_class->setStaticPropertyValue( 'initialized_modules', null );
		} catch ( \ReflectionException $e ) { // PHP <7.4.9 compat
			$configured = $reflection_class->getProperty( 'initialized_modules' );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$configured->setAccessible( true );
			}
			$configured->setValue( null );
		}
	}

	/**
	 * Runs after every test in this class.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_sync_modules', array( $this, 'add_posts_module' ) );
		remove_filter( 'jetpack_sync_modules', array( $this, 'add_additional_modules' ), PHP_INT_MAX );
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

	/**
	 * Different classes exposing the same module name are deduplicated regardless
	 * of contribution order, with the later contributor taking precedence.
	 *
	 * @param string[] $module_order Module classes in filtered registration order.
	 * @param string   $expected_class Expected surviving module class.
	 *
	 * @dataProvider duplicate_name_module_order_provider
	 */
	#[DataProvider( 'duplicate_name_module_order_provider' )]
	public function test_get_modules_deduplicates_by_module_name( $module_order, $expected_class ) {
		$this->additional_modules = $module_order;
		add_filter( 'jetpack_sync_modules', array( $this, 'add_additional_modules' ), PHP_INT_MAX );

		$matching_modules = array_values(
			array_filter(
				Modules::get_modules(),
				function ( $module ) {
					return 'duplicate_name' === $module->name();
				}
			)
		);

		$this->assertCount( 1, $matching_modules );
		$this->assertInstanceOf( $expected_class, $matching_modules[0] );
	}

	/**
	 * Module-class orders for duplicate-name collision handling.
	 *
	 * @return array<string,array{0:string[],1:string}>
	 */
	public static function duplicate_name_module_order_provider() {
		return array(
			'first then second' => array(
				array( First_Duplicate_Name_Module::class, Second_Duplicate_Name_Module::class ),
				Second_Duplicate_Name_Module::class,
			),
			'second then first' => array(
				array( Second_Duplicate_Name_Module::class, First_Duplicate_Name_Module::class ),
				First_Duplicate_Name_Module::class,
			),
		);
	}

	/**
	 * Append test modules at the same priority used by Analytics integrations.
	 *
	 * @param string[] $sync_modules Existing Sync module classes.
	 * @return string[] Filtered Sync module classes.
	 */
	public function add_additional_modules( array $sync_modules ) {
		return array_merge( $sync_modules, $this->additional_modules );
	}
}
