<?php
/**
 * Runtime test suite.
 *
 * @package automattic/jetpack-waf
 * @phpcs:disable PHPCompatibility.FunctionDeclarations.NewReturnTypeDeclarations.voidFound
 */

use Automattic\Jetpack\Waf\WafOperators;
use Automattic\Jetpack\Waf\WafRuntime;
use Automattic\Jetpack\Waf\WafTransforms;

/**
 * Runtime test suite.
 */
final class WafRuntimeTest extends PHPUnit\Framework\TestCase {
	/**
	 * Instance of the Runtime class
	 *
	 * @var WafRuntime
	 */
	private $runtime;

	/**
	 * Test setup
	 *
	 * @before
	 */
	protected function before() {
		$this->runtime = new WafRuntime( new WafTransforms(), new WafOperators() );
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
		$this->assertEqualsCanonicalizing(
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
}
