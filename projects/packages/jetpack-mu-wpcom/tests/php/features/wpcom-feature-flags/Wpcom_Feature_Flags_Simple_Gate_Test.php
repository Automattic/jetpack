<?php
/**
 * Simple-platform tests for the feature flag screen's Automattician gate.
 *
 * Separate from Wpcom_Feature_Flags_Test because these need the wpcom platform's
 * is_automattician() to exist. Defining it is process-global and irreversible, so
 * these run isolated: otherwise they would leak into every other test that
 * asserts a gate fails closed when the function is absent — including
 * Wpcom_Feature_Flags_Test::test_gate_on_simple_requires_platform_automattician_check
 * and the VideoPress chapters-editor gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-feature-flags/class-wpcom-feature-flags.php';

/**
 * Covers the Simple half of Wpcom_Feature_Flags::is_a11n().
 *
 * The sibling suite only proves the Simple branch fails closed when the platform
 * primitive is missing. Simple is the platform the feature targets first, so the
 * branch that actually runs there needs to be exercised with both answers.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Wpcom_Feature_Flags_Simple_Gate_Test extends TestCase {

	/**
	 * Set up Brain Monkey.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Constants::set_constant( 'IS_WPCOM', true );
	}

	/**
	 * Tear down Brain Monkey.
	 */
	protected function tearDown(): void {
		Constants::clear_constants();
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * On Simple, an Automattician gets in. This is the half the sibling suite
	 * cannot cover, and the platform the feature targets first.
	 */
	public function test_gate_opens_on_simple_for_an_automattician() {
		Functions\stubs( array( 'is_automattician' => true ) );

		$this->assertTrue( Wpcom_Feature_Flags::is_a11n() );
	}

	/**
	 * A Simple user who is not an Automattician stays out. Pins that the gate
	 * honours the platform's answer rather than treating the function merely
	 * existing as a pass.
	 */
	public function test_gate_stays_closed_on_simple_for_everyone_else() {
		Functions\stubs( array( 'is_automattician' => false ) );

		$this->assertFalse( Wpcom_Feature_Flags::is_a11n() );
	}

	/**
	 * The Atomic proxy constant must not open the gate on Simple. Simple has its
	 * own answer and it is authoritative; falling through to the proxy check
	 * would let any proxied request in.
	 */
	public function test_proxy_constant_does_not_open_the_gate_on_simple() {
		Functions\stubs( array( 'is_automattician' => false ) );
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );

		$this->assertFalse( Wpcom_Feature_Flags::is_a11n() );
	}
}
