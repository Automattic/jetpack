<?php
/**
 * Runtime test suite.
 *
 * @package automattic/jetpack-waf
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
	 * Test array_flatten
	 */
	public function testArrayFlatten() {
		// get the private array_flatten method
		$class  = new \ReflectionClass( $this->runtime );
		$method = $class->getMethod( 'array_flatten' );
		$method->setAccessible( true );

		// base cases
		$this->assertEquals(
			array( 1, 2, 3, 4, 5 ),
			$method->invoke(
				$this->runtime,
				array( 1, 2, 3, 4, 5 )
			)
		);
		$this->assertEquals(
			'test',
			$method->invoke(
				$this->runtime,
				'test'
			)
		);

		// nested case
		$this->assertEquals(
			array( 1, 2, 3, 4, 5 ),
			$method->invoke(
				$this->runtime,
				array( 1, array( 2, 3 ), 4, array( array( 5 ) ) )
			)
		);
	}

	/**
	 * Test normalize_array_targets
	 */
	public function testNormalizeArrayTarget() {
		// get the private normalize_array_targets method
		// note that because the $results parameter is by reference, we have to use invokeArgs not invoke
		$class  = new \ReflectionClass( $this->runtime );
		$method = $class->getMethod( 'normalize_array_target' );
		$method->setAccessible( true );

		$return = array();

		// standard case
		$this->assertEquals(
			array(
				array(
					'name'   => 'abc',
					'value'  => 'onetwothree',
					'source' => 'testone:abc',
				),
				array(
					'name'   => 'def',
					'value'  => 'fourfivesix',
					'source' => 'testone:def',
				),
			),
			$method->invokeArgs(
				$this->runtime,
				array(
					array(
						'abc' => 'onetwothree',
						'def' => 'fourfivesix',
					),
					array(),
					array(),
					'testone',
					&$return,
					false,
				)
			)
		);

		$return = array();

		// nested case
		$this->assertEquals(
			array(
				array(
					'name'   => 'abc',
					'value'  => 'onetwothree',
					'source' => 'testtwo:abc',
				),
				array(
					'name'   => '0',
					'value'  => 'nesting',
					'source' => 'testtwo:0',
				),
				array(
					'name'   => '0',
					'value'  => 'more_nesting',
					'source' => 'testtwo:0',
				),
				array(
					'name'   => '1',
					'value'  => 'two',
					'source' => 'testtwo:1',
				),
				array(
					'name'   => '1',
					'value'  => 'three',
					'source' => 'testtwo:1',
				),
			),
			$method->invokeArgs(
				$this->runtime,
				array(
					array(
						'abc' => 'onetwothree',
						array(
							'nestone' => 'nesting',
							'more_nesting',
						),
						array(
							'evenmore' => array(
								'two',
								'three',
							),
						),
					),
					array(),
					array(),
					'testtwo',
					&$return,
					false,
				)
			)
		);
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
}
