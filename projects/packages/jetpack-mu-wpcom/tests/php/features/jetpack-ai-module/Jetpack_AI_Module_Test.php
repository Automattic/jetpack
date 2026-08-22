<?php
/**
 * Tests for the Atomic AI module fallback.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status\Visitor;
use function Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Module\keep_module_active;

/**
 * Loading the feature file on Atomic must define Visitor (the preload), and the
 * active-modules callback must only ever add `ai` when that module exists.
 */
class Jetpack_AI_Module_Test extends \WorDBless\BaseTestCase {

	/**
	 * The feature only runs on Atomic.
	 */
	public function set_up() {
		parent::set_up();
		Constants::set_constant( 'IS_ATOMIC', true );
		require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/jetpack-ai-module/jetpack-ai-module.php';
	}

	/**
	 * Clean up constants and any availability filters a test added.
	 */
	public function tear_down() {
		Constants::clear_constants();
		remove_all_filters( 'jetpack_get_available_modules' );
		remove_all_filters( 'jetpack_get_available_standalone_modules' );
		parent::tear_down();
	}

	/**
	 * Force the available module list, on both code paths
	 * Modules::get_available() can take (with and without the Jetpack plugin).
	 *
	 * @param string[] $slugs The module slugs to report as available.
	 */
	private function set_available_modules( array $slugs ) {
		add_filter(
			'jetpack_get_available_modules',
			function () use ( $slugs ) {
				return array_fill_keys( $slugs, '1.0' );
			}
		);
		add_filter(
			'jetpack_get_available_standalone_modules',
			function () use ( $slugs ) {
				return $slugs;
			}
		);
	}

	/**
	 * The preload defines Visitor without waiting for a later autoload, and the
	 * copy it defines has the method the AI surfaces call.
	 */
	public function test_preload_defines_visitor_with_tracking_method() {
		$this->assertTrue( class_exists( Visitor::class, false ) );
		$this->assertTrue( method_exists( Visitor::class, 'is_tracking_automattician' ) );
	}

	/**
	 * Non-array input passes through untouched.
	 */
	public function test_keep_module_active_ignores_non_arrays() {
		$this->assertSame( 'nope', keep_module_active( 'nope' ) );
	}

	/**
	 * `ai` is added once when the module exists, and never duplicated.
	 */
	public function test_keep_module_active_adds_ai_once_when_available() {
		$this->set_available_modules( array( 'stats', 'ai' ) );

		$this->assertSame( array( 'stats', 'ai' ), keep_module_active( array( 'stats' ) ) );
		$this->assertSame( array( 'ai', 'stats' ), keep_module_active( array( 'ai', 'stats' ) ) );
	}

	/**
	 * On a Jetpack that predates the module there is nothing to report active,
	 * so the list is returned unchanged rather than gaining a module that does
	 * not exist.
	 */
	public function test_keep_module_active_leaves_list_alone_on_older_jetpack() {
		$this->set_available_modules( array( 'stats' ) );

		$this->assertSame( array( 'stats' ), keep_module_active( array( 'stats' ) ) );
	}

	/**
	 * Before the Jetpack plugin loads, no modules are available at all. The list
	 * must still come back unchanged: Modules::is_module() would say yes to any
	 * slug against an empty list, which is why the callback checks the list
	 * directly.
	 */
	public function test_keep_module_active_leaves_list_alone_before_jetpack_loads() {
		$this->set_available_modules( array() );

		$this->assertSame( array( 'stats' ), keep_module_active( array( 'stats' ) ) );
	}
}
