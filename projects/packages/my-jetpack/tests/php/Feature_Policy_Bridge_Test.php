<?php
/**
 * Tests that jetpack_feature_policy reaches My Jetpack through the filters it bridges.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Feature_Policy;
use Automattic\Jetpack\Modules;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * Feature policy bridge tests.
 *
 * Separate processes keep `Modules::get_available()`'s function-static memo out of other suites.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Feature_Policy_Bridge_Test extends TestCase {

	/**
	 * The policy the host filter returns.
	 *
	 * @var array
	 */
	private $policy = array();

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter( Feature_Policy::FILTER, array( $this, 'apply_policy' ) );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'available_modules' ) );
	}

	/**
	 * Returning the environment to its previous state.
	 */
	public function tearDown(): void {
		remove_filter( Feature_Policy::FILTER, array( $this, 'apply_policy' ) );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'available_modules' ) );
		Feature_Policy::reset();
		\Jetpack_Options::delete_option( 'active_modules' );
		$this->policy = array();

		parent::tearDown();
	}

	/**
	 * Stands in for a host's mu-plugin.
	 *
	 * @param array $policy The policy map.
	 * @return array
	 */
	public function apply_policy( $policy ) {
		return array_merge( $policy, $this->policy );
	}

	/**
	 * Registers the modules these tests use.
	 *
	 * @param array $modules Available module slugs.
	 * @return array
	 */
	public function available_modules( $modules ) {
		return array_merge( $modules, array( 'stats', 'contact-form' ) );
	}

	/**
	 * A policy's hidden slugs reach the Features page.
	 */
	public function test_hidden_policy_hides_from_my_jetpack() {
		$this->policy = array(
			'search' => array( 'visibility' => 'hidden' ),
			'stats'  => array( 'activation' => 'forced-on' ),
		);

		$this->assertSame( array( 'search' ), Feature_Visibility::get_hidden() );
	}

	/**
	 * Forced activation holds against the stored option.
	 */
	public function test_forced_policy_overrides_active_modules() {
		\Jetpack_Options::update_option( 'active_modules', array( 'contact-form' ) );
		$this->policy = array(
			'stats'        => array( 'activation' => 'forced-on' ),
			'contact-form' => array( 'activation' => 'forced-off' ),
		);

		$this->assertSame( array( 'stats' ), array_values( ( new Modules() )->get_active() ) );
	}
}
