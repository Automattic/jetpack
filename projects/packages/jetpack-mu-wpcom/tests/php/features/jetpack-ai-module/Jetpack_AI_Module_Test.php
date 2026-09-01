<?php
/**
 * Tests for the Atomic AI module fallback.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status\Visitor;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use function Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Module\keep_module_active;

/**
 * Loading the feature file on Atomic must define Visitor (the preload), and the
 * active-modules callback must only ever add `ai` when the installed Jetpack
 * actually ships that module.
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
	 * Clean up constants.
	 */
	public function tear_down() {
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Define a stand-in for the Jetpack plugin class whose is_module() answers
	 * from a fixed list. Only for tests that run in their own process, so the
	 * stub cannot leak into the rest of the suite.
	 *
	 * @param string[] $available Module slugs the fake Jetpack ships.
	 */
	private static function define_fake_jetpack( array $available ) {
		self::assertFalse( class_exists( 'Jetpack', false ), 'Test assumes the real Jetpack class is absent.' );
		$GLOBALS['jetpack_ai_module_test_available'] = $available;
		$stub                                        = new class() {
			/**
			 * Stand-in for Jetpack::is_module().
			 *
			 * @param string $slug Module slug.
			 * @return bool
			 */
			public static function is_module( $slug ) {
				return in_array( $slug, $GLOBALS['jetpack_ai_module_test_available'], true );
			}
		};
		class_alias( get_class( $stub ), 'Jetpack' );
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
	 * Before the Jetpack plugin loads there is no Jetpack class to ask, so the
	 * list must come back unchanged.
	 */
	public function test_keep_module_active_leaves_list_alone_before_jetpack_loads() {
		$this->assertFalse( class_exists( 'Jetpack', false ), 'Test assumes the Jetpack plugin is not loaded.' );

		$this->assertSame( array( 'stats' ), keep_module_active( array( 'stats' ) ) );
	}

	/**
	 * `ai` is added once when the installed Jetpack ships the module, and never
	 * duplicated.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_keep_module_active_adds_ai_once_when_module_shipped() {
		self::define_fake_jetpack( array( 'stats', 'ai' ) );

		$this->assertSame( array( 'stats', 'ai' ), keep_module_active( array( 'stats' ) ) );
		$this->assertSame( array( 'ai', 'stats' ), keep_module_active( array( 'ai', 'stats' ) ) );
	}

	/**
	 * On a Jetpack that predates the module there is nothing to report active,
	 * so the list is returned unchanged rather than gaining a module that does
	 * not exist.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_keep_module_active_leaves_list_alone_on_older_jetpack() {
		self::define_fake_jetpack( array( 'stats' ) );

		$this->assertSame( array( 'stats' ), keep_module_active( array( 'stats' ) ) );
	}
}
