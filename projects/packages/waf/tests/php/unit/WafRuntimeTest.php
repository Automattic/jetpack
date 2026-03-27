<?php
/**
 * Runtime test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Operators;
use Automattic\Jetpack\Waf\Waf_Runtime;
use Automattic\Jetpack\Waf\Waf_Transforms;
use PHPUnit\Framework\Attributes\Before;

/**
 * Runtime test suite.
 */
final class WafRuntimeTest extends PHPUnit\Framework\TestCase {
	/**
	 * Instance of the Runtime class
	 *
	 * @var Waf_Runtime
	 */
	private $runtime;

	/**
	 * Test setup
	 *
	 * @before
	 */
	#[Before]
	protected function before() {
		$this->runtime = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators() );
	}

	/**
	 * Test removing rule by id
	 */
	public function testRemovingRuleById() {
		$this->runtime->flag_rule_for_removal( 'id', '111' );
		$this->assertTrue( $this->runtime->rule_removed( '111', array() ) );
		$this->assertFalse( $this->runtime->rule_removed( '222', array() ) );
	}

	/**
	 * Test removing rule by tag
	 */
	public function testRemovingRuleByTag() {
		$this->runtime->flag_rule_for_removal( 'tag', 'abc' );
		$this->assertTrue( $this->runtime->rule_removed( '111', array( 'abc' ) ) );
		$this->assertTrue( $this->runtime->rule_removed( '111', array( 'abc', 'def' ) ) );
		$this->assertTrue( $this->runtime->rule_removed( '111', array( '789', 'abc', 'def' ) ) );
		$this->assertFalse( $this->runtime->rule_removed( '111', array() ) );
		$this->assertFalse( $this->runtime->rule_removed( '111', array( 'abcdef' ) ) );
	}

	/**
	 * Test removing target rule by id
	 */
	public function testRemovingTargetByRuleId() {
		$this->runtime->flag_target_for_removal( 'id', '111', 'args' );
		$this->assertEquals(
			array( 'auth_type' => array() ),
			$this->runtime->update_targets(
				array(
					'args'      => array(),
					'auth_type' => array(),
				),
				'111',
				array()
			),
			'Did not remove target'
		);
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array(),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array(),
					'auth_type' => array(),
				),
				'222',
				array()
			),
			'Incorrectly removed target of non-matching rule'
		);
	}

	/**
	 * Test removing targed prop by rule id
	 */
	public function testRemovingTargetPropByRuleId() {
		$this->runtime->flag_target_for_removal( 'id', '111', 'args', 'p' );
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array( 'except' => array( 'p' ) ),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array(),
					'auth_type' => array(),
				),
				'111',
				array()
			),
			'Did not create except list for removed prop'
		);
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array( 'except' => array( 'o', 'p' ) ),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array( 'except' => array( 'o' ) ),
					'auth_type' => array(),
				),
				'111',
				array()
			),
			'Did not add prop to existing except list'
		);
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array(
					'only'   => array( 'z' ),
					'except' => array( 'o', 'p' ),
				),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array(
						'only'   => array( 'z' ),
						'except' => array( 'o' ),
					),
					'auth_type' => array(),
				),
				'111',
				array()
			)
		);
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array(),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array(),
					'auth_type' => array(),
				),
				'222',
				array()
			),
			'Incorrectly updated target of non-matching rule'
		);
	}

	/**
	 * Test removing targed by rule tag
	 */
	public function testRemovingTargetByRuleTag() {
		$this->runtime->flag_target_for_removal( 'tag', 'abc', 'args' );
		$this->assertEquals(
			array( 'auth_type' => array() ),
			$this->runtime->update_targets(
				array(
					'args'      => array(),
					'auth_type' => array(),
				),
				'111',
				array( 'abc' )
			),
			'Did not remove target'
		);
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array(),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array(),
					'auth_type' => array(),
				),
				'222',
				array( 'def' )
			),
			'Incorrectly removed target of non-matching rule'
		);
	}

	/**
	 * Test removing targed prop by rule tag
	 */
	public function testRemovingTargetPropByRuleTag() {
		$this->runtime->flag_target_for_removal( 'tag', 'abc', 'args', 'p' );
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array( 'except' => array( 'p' ) ),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array(),
					'auth_type' => array(),
				),
				'111',
				array( 'abc' )
			),
			'Did not create except list for removed prop'
		);
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array( 'except' => array( 'o', 'p' ) ),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array( 'except' => array( 'o' ) ),
					'auth_type' => array(),
				),
				'222',
				array( 'abc' )
			),
			'Did not add prop to existing except list'
		);
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array(
					'only'   => array( 'z' ),
					'except' => array( 'o', 'p' ),
				),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array(
						'only'   => array( 'z' ),
						'except' => array( 'o' ),
					),
					'auth_type' => array(),
				),
				'333',
				array( 'abc' )
			)
		);
		$this->assertEquals(
			array(
				'auth_type' => array(),
				'args'      => array(),
			),
			$this->runtime->update_targets(
				array(
					'args'      => array(),
					'auth_type' => array(),
				),
				'444',
				array( 'def' )
			),
			'Incorrectly updated target of non-matching rule'
		);
	}

	/**
	 * Test vars
	 */
	public function testVars() {
		$this->assertSame( '', $this->runtime->get_var( 'abc' ) );
		$this->runtime->set_var( 'abc', '123' );
		$this->assertSame( '123', $this->runtime->get_var( 'abc' ) );
		$this->runtime->inc_var( 'abc', 3 );
		$this->assertEquals( 126, $this->runtime->get_var( 'abc' ) );
		$this->runtime->dec_var( 'abc', 10 );
		$this->assertEquals( 116, $this->runtime->get_var( 'abc' ) );
		$this->runtime->inc_var( 'def', 2 );
		$this->assertSame( 2.0, $this->runtime->get_var( 'def' ) );
		$this->runtime->unset_var( 'abc' );
		$this->assertSame( '', $this->runtime->get_var( 'abc' ) );
	}

	/**
	 * Test the sanitize output method catches odd cases
	 */
	public function testSanitizeOutput() {
		$bad_output = 'a=<svg/onload%0c=alert%601%60>';
		$result     = $this->runtime->sanitize_output( $bad_output );

		$this->assertSame( 'a=&lt;svg\/onload\b=alert`1`&gt;', $result );
	}

	/**
	 * Test reset_matched_vars() method
	 */
	public function testResetMatchedVars() {
		$this->runtime->matched_vars       = array( 'var1', 'var2', 'var3' );
		$this->runtime->matched_vars_names = array( 'name1', 'name2', 'name3' );
		$this->runtime->matched_var        = 'value1';
		$this->runtime->matched_var_name   = 'name1';
		$this->runtime->reset_matched_vars();
		$this->assertEmpty( $this->runtime->matched_vars );
		$this->assertEmpty( $this->runtime->matched_vars_names );
		$this->assertEmpty( $this->runtime->matched_var );
		$this->assertEmpty( $this->runtime->matched_var_name );
	}

	/**
	 * Test that reset_matched_vars() invalidates the metadata cache.
	 *
	 * If the cache is not cleared, meta() returns stale matched-variable data
	 * after a reset, potentially allowing a WAF bypass.
	 */
	public function testResetMatchedVarsInvalidatesMetadataCache() {
		// Step 1: Simulate Rule A matching on a benign value.
		$this->runtime->matched_var        = 'safe-string';
		$this->runtime->matched_var_name   = 'ARGS:safe_param';
		$this->runtime->matched_vars       = array( 'safe-string' );
		$this->runtime->matched_vars_names = array( 'ARGS:safe_param' );

		// Populate the metadata cache by reading matched_var values.
		$cached_var        = $this->runtime->meta( 'matched_var' );
		$cached_vars       = $this->runtime->meta( 'matched_vars' );
		$cached_var_name   = $this->runtime->meta( 'matched_var_name' );
		$cached_vars_names = $this->runtime->meta( 'matched_vars_names' );

		// Sanity check: cache has the initial values.
		$this->assertSame( array( 'ARGS:safe_param' => 'safe-string' ), $cached_var );
		$this->assertSame( array( 'ARGS:safe_param' => 'safe-string' ), $cached_vars );
		$this->assertSame( array( 'ARGS:safe_param' ), $cached_var_name );
		$this->assertSame( array( 'ARGS:safe_param' ), $cached_vars_names );

		// Step 2: Reset matched vars (e.g. between rule chains).
		$this->runtime->reset_matched_vars();

		// Step 3: Simulate Rule B matching on a malicious value.
		$this->runtime->matched_var        = '<script>alert(1)</script>';
		$this->runtime->matched_var_name   = 'ARGS:evil_param';
		$this->runtime->matched_vars       = array( '<script>alert(1)</script>' );
		$this->runtime->matched_vars_names = array( 'ARGS:evil_param' );

		// Step 4: meta() must return the NEW values, not the stale cached ones.
		$new_var        = $this->runtime->meta( 'matched_var' );
		$new_vars       = $this->runtime->meta( 'matched_vars' );
		$new_var_name   = $this->runtime->meta( 'matched_var_name' );
		$new_vars_names = $this->runtime->meta( 'matched_vars_names' );

		$this->assertSame(
			array( 'ARGS:evil_param' => '<script>alert(1)</script>' ),
			$new_var,
			'meta("matched_var") returned stale cached data after reset_matched_vars()'
		);
		$this->assertSame(
			array( 'ARGS:evil_param' => '<script>alert(1)</script>' ),
			$new_vars,
			'meta("matched_vars") returned stale cached data after reset_matched_vars()'
		);
		$this->assertSame(
			array( 'ARGS:evil_param' ),
			$new_var_name,
			'meta("matched_var_name") returned stale cached data after reset_matched_vars()'
		);
		$this->assertSame(
			array( 'ARGS:evil_param' ),
			$new_vars_names,
			'meta("matched_vars_names") returned stale cached data after reset_matched_vars()'
		);
	}
}
