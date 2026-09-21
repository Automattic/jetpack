<?php
/**
 * What switching a module saves when a host forces modules on or off.
 *
 * Exercises the status package's Modules class against a real options table, which that
 * package's own Brain Monkey suite doesn't have.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Modules;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Covers Modules::activate() and Modules::deactivate() with forced modules.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Forced_Module_Switch_Test extends BaseTestCase {

	/**
	 * Modules that fired an activation hook.
	 *
	 * @var string[]
	 */
	public static $activated = array();

	/**
	 * Seed the saved option and what the host forces.
	 *
	 * @param string[] $saved      The saved active modules.
	 * @param string[] $forced_on  Modules the host forces on.
	 * @param string[] $forced_off Modules the host forces off.
	 * @return void
	 */
	private function host( array $saved, array $forced_on = array(), array $forced_off = array() ) {
		$all = array( 'stats', 'activity-log', 'monitor', 'contact-form' );
		// Through the filter, not the option: the filter runs after Modules::get_available()'s memo.
		add_filter( 'jetpack_get_available_modules', fn( $m ) => array_merge( $m, array_fill_keys( $all, '1.0' ) ) );
		add_filter( 'jetpack_get_available_standalone_modules', fn( $m ) => array_merge( $m, $all ) );
		Jetpack_Options::update_option( 'active_modules', $saved );
		add_filter( 'jetpack_active_modules', fn( $a ) => array_values( array_diff( array_unique( array_merge( $a, $forced_on ) ), $forced_off ) ) );
		add_action( 'jetpack_activate_module', array( __CLASS__, 'record_activation' ) );
	}

	/**
	 * Record an activation hook.
	 *
	 * @param string $module The module slug.
	 * @return void
	 */
	public static function record_activation( $module ) {
		self::$activated[] = $module;
	}

	/**
	 * The saved active modules.
	 *
	 * @return string[]
	 */
	private function saved() {
		return array_values( Jetpack_Options::get_option( 'active_modules', array() ) );
	}

	public function test_deactivating_a_module_leaves_the_forced_ones_out_of_the_saved_list() {
		$this->host( array( 'stats' ), array( 'activity-log', 'monitor' ) );

		( new Modules() )->deactivate( 'stats' );

		$this->assertSame( array(), $this->saved() );
		$this->assertSame( array(), self::$activated );
	}

	public function test_activating_a_module_leaves_the_forced_ones_out_of_the_saved_list() {
		$this->host( array(), array( 'monitor' ) );

		( new Modules() )->activate( 'stats', false, false );

		$this->assertSame( array( 'stats' ), $this->saved() );
		$this->assertSame( array( 'stats' ), self::$activated );
	}

	public function test_deactivating_a_forced_module_saves_the_choice_and_it_stays_on() {
		$this->host( array( 'stats', 'activity-log' ), array( 'activity-log' ) );
		$modules = new Modules();

		$this->assertTrue( $modules->deactivate( 'activity-log' ) );
		$this->assertSame( array( 'stats' ), $this->saved() );
		$this->assertTrue( $modules->is_active( 'activity-log' ) );
	}

	public function test_deactivating_a_module_that_was_never_saved_still_reports_the_saved_choice() {
		$this->host( array( 'stats' ), array( 'activity-log' ) );

		$this->assertTrue( ( new Modules() )->deactivate( 'activity-log' ) );
		$this->assertSame( array( 'stats' ), $this->saved() );
	}
}
