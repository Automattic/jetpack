<?php
/**
 * Constraint checker test suite.
 *
 * @package automattic/jetpack-autoloader
 */

namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;

/**
 * Test suite for the Constraint_Checker class.
 */
class ConstraintCheckerTest extends TestCase {

	/**
	 * The constraint checker instance.
	 *
	 * @var Constraint_Checker
	 */
	private $checker;

	/**
	 * Setup runs before each test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->checker = new Constraint_Checker();
	}

	/**
	 * Tests that satisfies_all returns true with no constraints.
	 */
	public function test_satisfies_all_with_no_constraints() {
		$this->assertTrue( $this->checker->satisfies_all( '3.0.0.0', array() ) );
	}

	/**
	 * Tests basic caret constraint matching.
	 */
	public function test_caret_constraint() {
		// ^1.0 means >=1.0.0 <2.0.0
		$this->assertTrue( $this->checker->satisfies_all( '1.0.0.0', array( '^1.0' ) ) );
		$this->assertTrue( $this->checker->satisfies_all( '1.0.1.0', array( '^1.0' ) ) );
		$this->assertTrue( $this->checker->satisfies_all( '1.5.0.0', array( '^1.0' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '2.0.0.0', array( '^1.0' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '0.9.0.0', array( '^1.0' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '3.0.0.0', array( '^1.0' ) ) );
	}

	/**
	 * Tests OR constraint: ^1.0 || ^2.0 || ^3.0
	 */
	public function test_or_constraint() {
		$constraint = array( '^1.0 || ^2.0 || ^3.0' );
		$this->assertTrue( $this->checker->satisfies_all( '1.0.1.0', $constraint ) );
		$this->assertTrue( $this->checker->satisfies_all( '2.0.0.0', $constraint ) );
		$this->assertTrue( $this->checker->satisfies_all( '3.0.0.0', $constraint ) );
		$this->assertFalse( $this->checker->satisfies_all( '4.0.0.0', $constraint ) );
		$this->assertFalse( $this->checker->satisfies_all( '0.5.0.0', $constraint ) );
	}

	/**
	 * Tests the exact psr/simple-cache conflict scenario:
	 * Plugin A has constraint "^1.0 || ^2.0 || ^3.0" (from json-mapper)
	 * Plugin B has constraint "^1.0" (from jasny/sso)
	 * v3.0.0 should NOT satisfy both, v1.0.1 should.
	 */
	public function test_psr_simple_cache_conflict_scenario() {
		$all_constraints = array(
			'^1.0 || ^2.0 || ^3.0', // from wp-stateless's json-mapper
			'^1.0',                  // from wp-ultimo's jasny/sso
		);

		// v3.0.0 satisfies the first but NOT the second.
		$this->assertFalse( $this->checker->satisfies_all( '3.0.0.0', $all_constraints ) );

		// v1.0.1 satisfies BOTH.
		$this->assertTrue( $this->checker->satisfies_all( '1.0.1.0', $all_constraints ) );

		// v2.0.0 satisfies the first but NOT the second.
		$this->assertFalse( $this->checker->satisfies_all( '2.0.0.0', $all_constraints ) );
	}

	/**
	 * Tests tilde constraints.
	 */
	public function test_tilde_constraint() {
		// ~1.5 means >=1.5.0 <2.0.0
		$this->assertTrue( $this->checker->satisfies_all( '1.5.0.0', array( '~1.5' ) ) );
		$this->assertTrue( $this->checker->satisfies_all( '1.9.9.0', array( '~1.5' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '2.0.0.0', array( '~1.5' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '1.4.0.0', array( '~1.5' ) ) );

		// ~1.5.3 means >=1.5.3 <1.6.0
		$this->assertTrue( $this->checker->satisfies_all( '1.5.3.0', array( '~1.5.3' ) ) );
		$this->assertTrue( $this->checker->satisfies_all( '1.5.9.0', array( '~1.5.3' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '1.6.0.0', array( '~1.5.3' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '1.5.2.0', array( '~1.5.3' ) ) );
	}

	/**
	 * Tests comparison operators.
	 */
	public function test_comparison_operators() {
		$this->assertTrue( $this->checker->satisfies_all( '2.0.0.0', array( '>=1.0' ) ) );
		$this->assertTrue( $this->checker->satisfies_all( '1.0.0.0', array( '>=1.0' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '0.9.0.0', array( '>=1.0' ) ) );

		$this->assertTrue( $this->checker->satisfies_all( '2.0.0.0', array( '<3.0' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '3.0.0.0', array( '<3.0' ) ) );
	}

	/**
	 * Tests compound AND constraints (>=1.0 <3.0).
	 */
	public function test_compound_and_constraints() {
		$this->assertTrue( $this->checker->satisfies_all( '2.0.0.0', array( '>=1.0 <3.0' ) ) );
		$this->assertTrue( $this->checker->satisfies_all( '1.0.0.0', array( '>=1.0 <3.0' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '3.0.0.0', array( '>=1.0 <3.0' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '0.5.0.0', array( '>=1.0 <3.0' ) ) );
	}

	/**
	 * Tests multiple constraints from different sources must ALL be satisfied.
	 */
	public function test_multiple_constraints_all_must_match() {
		$constraints = array(
			'^2.0 || ^3.0',  // allows 2.x or 3.x
			'^2.0',          // allows only 2.x
		);

		$this->assertTrue( $this->checker->satisfies_all( '2.5.0.0', $constraints ) );
		$this->assertFalse( $this->checker->satisfies_all( '3.0.0.0', $constraints ) );
		$this->assertFalse( $this->checker->satisfies_all( '1.0.0.0', $constraints ) );
	}

	/**
	 * Tests wildcard constraints.
	 */
	public function test_wildcard_constraint() {
		$this->assertTrue( $this->checker->satisfies_all( '1.5.0.0', array( '1.*' ) ) );
		$this->assertTrue( $this->checker->satisfies_all( '1.0.0.0', array( '1.*' ) ) );
		$this->assertFalse( $this->checker->satisfies_all( '2.0.0.0', array( '1.*' ) ) );
	}

	/**
	 * Tests the psr/log scenario: monolog requires ^2.0 || ^3.0, another plugin requires ^1.0 || ^2.0 || ^3.0.
	 */
	public function test_psr_log_compatible_scenario() {
		$constraints = array(
			'^2.0 || ^3.0',            // from monolog
			'^1.0 || ^2.0 || ^3.0',   // from another package
		);

		// v3 satisfies both.
		$this->assertTrue( $this->checker->satisfies_all( '3.0.2.0', $constraints ) );
		// v2 satisfies both.
		$this->assertTrue( $this->checker->satisfies_all( '2.0.0.0', $constraints ) );
		// v1 does NOT satisfy monolog's ^2.0 || ^3.0.
		$this->assertFalse( $this->checker->satisfies_all( '1.0.0.0', $constraints ) );
	}
}
