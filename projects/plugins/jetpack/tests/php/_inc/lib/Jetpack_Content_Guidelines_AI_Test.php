<?php
/**
 * Content Guidelines AI tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once JETPACK__PLUGIN_DIR . '_inc/content-guidelines-ai.php';

/**
 * Content Guidelines AI tests.
 */
class Jetpack_Content_Guidelines_AI_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that the tracking signal matches the Status package's own answer whenever
	 * that package is new enough to have one. The fallback below must never change
	 * the result for sites running a current jetpack-status.
	 */
	public function test_tracking_automattician_defers_to_visitor_when_the_method_exists() {
		$visitor = new \Automattic\Jetpack\Status\Visitor();

		$this->assertTrue(
			method_exists( $visitor, 'is_tracking_automattician' ),
			'The bundled Status package should have the method; the fallback tests below cover the other case.'
		);
		$this->assertSame(
			$visitor->is_tracking_automattician(),
			jetpack_content_guidelines_ai_is_tracking_automattician()
		);
	}

	/**
	 * Test that when the Visitor reports the signal, so does this function. Pairs with
	 * the test above, which pins the false direction, to show the guard delegates in both.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_tracking_automattician_matches_the_visitor_when_it_reports_true() {
		if ( function_exists( 'is_automattician' ) ) {
			$this->markTestSkipped( 'is_automattician already defined; cannot stub.' );
		}

		eval( 'function is_automattician() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged, MediaWiki.Usage.ForbiddenFunctions.eval -- process-isolated stub.

		$visitor = new \Automattic\Jetpack\Status\Visitor();

		$this->assertTrue( $visitor->is_tracking_automattician(), 'Precondition: the real Visitor reports the signal.' );
		$this->assertSame( $visitor->is_tracking_automattician(), jetpack_content_guidelines_ai_is_tracking_automattician() );
	}

	/**
	 * Test that an older Status package, whose Visitor has no is_tracking_automattician(),
	 * reports no Automattician traffic rather than fataling.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_tracking_automattician_false_on_older_visitor_without_signals() {
		$this->load_visitor_without_tracking_automattician();

		$this->assertFalse( jetpack_content_guidelines_ai_is_tracking_automattician() );
	}

	/**
	 * Test that on an older Status package the employee identity still reports the signal.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_tracking_automattician_on_older_visitor_for_employee_identity() {
		$this->load_visitor_without_tracking_automattician();

		if ( function_exists( 'is_automattician' ) ) {
			$this->markTestSkipped( 'is_automattician already defined; cannot stub.' );
		}

		eval( 'function is_automattician() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged, MediaWiki.Usage.ForbiddenFunctions.eval -- process-isolated stub.

		$this->assertTrue( jetpack_content_guidelines_ai_is_tracking_automattician() );
	}

	/**
	 * Test that on an older Status package a WordPress.com proxy still reports the signal.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_tracking_automattician_on_older_visitor_for_wpcom_proxy() {
		$this->load_visitor_without_tracking_automattician();

		if ( function_exists( 'wpcom_is_proxied_request' ) ) {
			$this->markTestSkipped( 'wpcom_is_proxied_request already defined; cannot stub.' );
		}

		eval( 'function wpcom_is_proxied_request() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged, MediaWiki.Usage.ForbiddenFunctions.eval -- process-isolated stub.

		$this->assertTrue( jetpack_content_guidelines_ai_is_tracking_automattician() );
	}

	/**
	 * Test that on an older Status package an Atomic proxied request still reports the
	 * signal. This is the check the Visitor method would otherwise have made for us.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_tracking_automattician_on_older_visitor_for_at_proxied_request() {
		$this->load_visitor_without_tracking_automattician();

		if ( defined( 'AT_PROXIED_REQUEST' ) ) {
			$this->markTestSkipped( 'AT_PROXIED_REQUEST already defined; cannot set it.' );
		}

		define( 'AT_PROXIED_REQUEST', true );

		$this->assertTrue( jetpack_content_guidelines_ai_is_tracking_automattician() );
	}

	/**
	 * Test that nothing is enqueued on admin pages other than Content Guidelines.
	 */
	public function test_nothing_enqueued_on_another_admin_page() {
		jetpack_content_guidelines_ai_enqueue_scripts( 'options-general.php' );

		$this->assertFalse( wp_script_is( 'jetpack-content-guidelines-ai', 'enqueued' ) );
	}

	/**
	 * Test that the Content Guidelines page stays clean on a site that fails the
	 * feature's gates. A self-hosted test site fails the platform gate first, but
	 * the later gates would each bail too, so this pins the outcome, not which gate.
	 */
	public function test_nothing_enqueued_when_the_page_gates_fail() {
		jetpack_content_guidelines_ai_enqueue_scripts( 'settings_page_guidelines-wp-admin' );

		$this->assertFalse( wp_script_is( 'jetpack-content-guidelines-ai', 'enqueued' ) );
	}

	/**
	 * Claim the Visitor class name with a copy that predates is_tracking_automattician(),
	 * modelling another plugin's autoloader supplying an older jetpack-status.
	 *
	 * Callers must be process-isolated: the real class can never load afterwards.
	 */
	private function load_visitor_without_tracking_automattician() {
		if ( class_exists( \Automattic\Jetpack\Status\Visitor::class, false ) ) {
			$this->markTestSkipped( 'The real Visitor is already loaded; an older one cannot be substituted.' );
		}

		require_once __DIR__ . '/../../lib/fixtures/Automattic/Jetpack/Status/class-visitor.php';

		$this->assertFalse(
			method_exists( new \Automattic\Jetpack\Status\Visitor(), 'is_tracking_automattician' ),
			'The older Visitor did not take effect, so the fallback would not be exercised.'
		);
	}
}
