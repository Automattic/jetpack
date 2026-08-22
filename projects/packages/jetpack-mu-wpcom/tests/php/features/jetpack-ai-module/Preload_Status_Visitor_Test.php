<?php
/**
 * Tests for the mu-plugin-time preload of Status\Visitor.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status\Visitor;

/**
 * The preload exists so the copy of Visitor this package depends on is the one
 * that gets defined. Check that loading the feature file defines the class and
 * that the copy it defines has the method the AI surfaces call.
 */
class Preload_Status_Visitor_Test extends \WorDBless\BaseTestCase {

	/**
	 * Loading the feature file defines Visitor without waiting for a later autoload.
	 */
	public function test_preload_defines_visitor_with_tracking_method() {
		require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/jetpack-ai-module/preload-status-visitor.php';

		$this->assertTrue( class_exists( Visitor::class, false ) );
		$this->assertTrue( method_exists( Visitor::class, 'is_tracking_automattician' ) );
	}
}
