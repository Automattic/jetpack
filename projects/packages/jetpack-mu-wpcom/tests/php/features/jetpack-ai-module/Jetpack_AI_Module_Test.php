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
 * active-modules callback must only ever add `ai` when the installed Jetpack
 * actually ships that module.
 */
class Jetpack_AI_Module_Test extends \WorDBless\BaseTestCase {

	/**
	 * Fake Jetpack plugin directory for the current test, if any.
	 *
	 * @var string|null
	 */
	private $plugin_dir = null;

	/**
	 * The feature only runs on Atomic.
	 */
	public function set_up() {
		parent::set_up();
		Constants::set_constant( 'IS_ATOMIC', true );
		require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/jetpack-ai-module/jetpack-ai-module.php';
	}

	/**
	 * Clean up constants and the fake plugin directory.
	 */
	public function tear_down() {
		Constants::clear_constants();
		if ( $this->plugin_dir ) {
			if ( is_file( $this->plugin_dir . 'modules/ai.php' ) ) {
				unlink( $this->plugin_dir . 'modules/ai.php' );
			}
			rmdir( $this->plugin_dir . 'modules' );
			rmdir( $this->plugin_dir );
			$this->plugin_dir = null;
		}
		parent::tear_down();
	}

	/**
	 * Point JETPACK__PLUGIN_DIR at a fake plugin directory, with or without a
	 * modules/ai.php file in it.
	 *
	 * @param bool $with_ai_module Whether the fake plugin ships the `ai` module.
	 */
	private function set_fake_jetpack_plugin_dir( $with_ai_module ) {
		$this->plugin_dir = sys_get_temp_dir() . '/jetpack-ai-module-test-' . uniqid() . '/';
		mkdir( $this->plugin_dir . 'modules', 0777, true );
		if ( $with_ai_module ) {
			file_put_contents( $this->plugin_dir . 'modules/ai.php', "<?php\n" );
		}
		Constants::set_constant( 'JETPACK__PLUGIN_DIR', $this->plugin_dir );
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
		$this->set_fake_jetpack_plugin_dir( true );

		$this->assertSame( 'nope', keep_module_active( 'nope' ) );
	}

	/**
	 * `ai` is added once when the installed Jetpack ships the module, and never
	 * duplicated.
	 */
	public function test_keep_module_active_adds_ai_once_when_module_shipped() {
		$this->set_fake_jetpack_plugin_dir( true );

		$this->assertSame( array( 'stats', 'ai' ), keep_module_active( array( 'stats' ) ) );
		$this->assertSame( array( 'ai', 'stats' ), keep_module_active( array( 'ai', 'stats' ) ) );
	}

	/**
	 * On a Jetpack that predates the module there is nothing to report active,
	 * so the list is returned unchanged rather than gaining a module that does
	 * not exist.
	 */
	public function test_keep_module_active_leaves_list_alone_on_older_jetpack() {
		$this->set_fake_jetpack_plugin_dir( false );

		$this->assertSame( array( 'stats' ), keep_module_active( array( 'stats' ) ) );
	}

	/**
	 * Before the Jetpack plugin loads, JETPACK__PLUGIN_DIR is not defined. The
	 * list must come back unchanged.
	 */
	public function test_keep_module_active_leaves_list_alone_before_jetpack_loads() {
		$this->assertFalse( Constants::is_defined( 'JETPACK__PLUGIN_DIR' ), 'Test assumes the Jetpack plugin is not loaded.' );

		$this->assertSame( array( 'stats' ), keep_module_active( array( 'stats' ) ) );
	}
}
