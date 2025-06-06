<?php
/**
 * Adapted from modsecurity tests: https://github.com/SpiderLabs/ModSecurity/tree/caadf97524a4861456be176a8cb91dcbb76b97e4/tests/op
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Operators;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Operators test suite.
 */
final class WafOperatorsTest extends PHPUnit\Framework\TestCase {
	/**
	 * Instance of Waf_Operators
	 *
	 * @var Waf_Operators
	 */
	private $o;

	/**
	 * Test setup
	 *
	 * @before
	 */
	#[Before]
	protected function before() {
		$this->o = new Waf_Operators();
	}

	/**
	 * Main test function.
	 *
	 * @param string $ofn   The name of the operator function that is being tested.
	 * @param array  $tests Array of test cases, where each test case is an array with 3 elements:
	 *                      [0] => string $input         The input value to test.
	 *                      [1] => mixed  $paramToMatch  The parameter to match against.
	 *                      [2] => mixed  $expected      The expected return value.
	 *
	 * @dataProvider transformDataProvider
	 */
	#[DataProvider( 'transformDataProvider' )]
	public function testOperators( $ofn, $tests ) {
		foreach ( $tests as $test ) {
			$input    = $test[0];
			$param    = $test[1];
			$expected = $test[2];
			$this->assertSame(
				$expected,
				$this->o->$ofn( $input, $param ),
				sprintf( 'Failed %s assertion with input: %s ', $ofn, $input )
			);
		}
	}

	/**
	 * Test data provider
	 */
	public static function transformDataProvider() {
		yield array(
			'begins_with',
			// input, paramToMatch, expected_return.
			array(
				array( '', '', '' ),
				array( 'TestCase', '', '' ),
				array( 'abcdef', 'abcdef', 'abcdef' ),
				array( 'abcdefghi', 'abcdef', 'abcdef' ),
				array( '', 'TestCase', false ),
				array( 'abc', 'abcdef', false ),
			),
		);
		yield array(
			'contains',
			// input, paramToMatch, expected_return.
			array(
				array( '', '', false ),
				array( 'TestCase', '', false ),
				array( 'abcdefghi', 'abc', 'abc' ),
				array( 'abcdefghi', 'ghi', 'ghi' ),
				array( 'x', 'x', 'x' ),
				array( 'xyz', 'y', 'y' ),
				array( 'hidinX<-not quite, but is later on->hiding', 'hiding', 'hiding' ),
			),
		);
		yield array(
			'contains_word',
			// input, paramToMatch, expected_return.
			array(
				array( '', '', '' ),
				array( 'TestCase', '', '' ),
				array( 'abc def ghi', 'abc', 'abc' ),
				array( 'abc def ghi', 'def', 'def' ),
				array( 'abc def ghi', 'ghi', 'ghi' ),
				array( "abc\0def ghi", 'abc', 'abc' ),
				array( "abc\0def ghi", 'def', 'def' ),
				array( 'x', 'x', 'x' ),
				array( ' x ', 'x', 'x' ),
				array( 'hidingX<-not on word boundary, but is later on->hiding', 'hiding', 'hiding' ),
				array( '', 'TestCase', false ),
				array( 'abcdefghi', 'abc', false ),
				array( 'abcdefghi', 'def', false ),
				array( 'abcdefghi', 'ghi', false ),
				array( 'xyz', 'y', false ),
			),
		);
		yield array(
			'ends_with',
			// input, paramToMatch, expected_return.
			array(
				array( '', '', '' ),
				array( 'TestCase', '', '' ),
				array( 'abcdefghi', 'ghi', 'ghi' ),
				array( "abcdef\0ghi", 'ghi', 'ghi' ),
				array( '', 'TestCase', false ),
				array( 'abcdefghi', 'abc', false ),
				array( 'abcdefghi', 'def', false ),
			),
		);
		yield array(
			'eq',
			// input, paramToMatch, expected_return.
			array(
				array( '', '0', '' ),
				array( '0', 'xxx', '0' ),
				array( 'xxx', '0', 'xxx' ),
				array( '0', '0', '0' ),
				array( '5', '5', '5' ),
				array( '-5', '-5', '-5' ),
				array( '', '5', false ),
				array( '5', 'xxx', false ),
				array( '-1', 'xxx', false ),
				array( 'xxx', '5', false ),
				array( '-5', '0', false ),
				array( '5', '0', false ),
				array( '0', '5', false ),
				array( '10', '5', false ),
			),
		);
		yield array(
			'ge',
			// input, paramToMatch, expected_return.
			array(
				array( '', '0', '' ),
				array( '5', 'xxx', '5' ),
				array( 'xxx', '0', 'xxx' ),
				array( '0', '0', '0' ),
				array( '5', '0', '5' ),
				array( '5', '5', '5' ),
				array( '10', '5', '10' ),
				array( '', '5', false ),
				array( '-1', 'xxx', false ),
				array( 'xxx', '5', false ),
				array( '-5', '', false ),
				array( '0', '5', false ),
			),
		);
		yield array(
			'gt',
			// input, paramToMatch, expected_return.
			array(
				array( '5', 'xxx', '5' ),
				array( 'xxx', '-1', 'xxx' ),
				array( '5', '0', '5' ),
				array( '10', '5', '10' ),
				array( '', '0', false ),
				array( '', '5', false ),
				array( '-1', 'xxx', false ),
				array( 'xxx', '5', false ),
				array( '-5', '0', false ),
				array( '0', '0', false ),
				array( '0', '5', false ),
				array( '5', '5', false ),
			),
		);
		yield array(
			'le',
			// input, paramToMatch, expected_return.
			array(
				array( '', '0', '' ),
				array( '', '5', '' ),
				array( '5', 'xxx', false ),
				array( '-1', 'xxx', '-1' ),
				array( 'xxx', '0', 'xxx' ),
				array( 'xxx', '5', 'xxx' ),
				array( '-5', '0', '-5' ),
				array( '0', '0', '0' ),
				array( '5', '0', false ),
				array( '0', '5', '0' ),
				array( '5', '5', '5' ),
				array( '10', '5', false ),
			),
		);
		yield array(
			'lt',
			// input, paramToMatch, expected_return.
			array(
				array( '', '0', false ),
				array( '', '5', '' ),
				array( '5', 'xxx', false ),
				array( '-1', 'xxx', '-1' ),
				array( 'xxx', '-1', false ),
				array( 'xxx', '5', 'xxx' ),
				array( '-5', '0', '-5' ),
				array( '0', '0', false ),
				array( '5', '0', false ),
				array( '0', '5', '0' ),
				array( '5', '5', false ),
				array( '10', '5', false ),
			),
		);
		yield array(
			'no_match',
			// input, paramToMatch, expected_return.
			array(
				array( '', '', false ),
				array( 'TestCase', '', false ),
				array( '', 'TestCase', false ),
			),
		);
		yield array(
			'rx',
			// input, paramToMatch, expected_return.
			array(
				array( '', '//Ds', array( '' ) ),
				array( '', '/TestCase/Ds', false ),
				array( 'TestCase', '//Ds', array( '' ) ),
				array( 'abcdefghi', '/abc/Ds', array( 'abc' ) ),
				array( 'abcdefghi', '/def/Ds', array( 'def' ) ),
				array( 'abcdefghi', '/ghi/Ds', array( 'ghi' ) ),
				array( 'abcdefghi', '/ghij/Ds', false ),
				array( 'SELECT pg_sleep(10);', '/(?i:(sleep\\((\\s*?)(\\d*?)(\\s*?)\\)|benchmark\\((.*?)\\,(.*?)\\)))/Ds', array( 'sleep(10)', 'sleep(10)', '', '10', '' ) ),
			),
		);
		yield array(
			'streq',
			// input, paramToMatch, expected_return.
			array(
				array( '', '', '' ),
				array( '', 'TestCase', false ),
				array( 'TestCase', '', false ),
				array( 'abcdefghi', 'abc', false ),
				array( 'abcdefghi', 'def', false ),
				array( 'abcdefghi', 'ghi', false ),
				array( 'abcdefghi', 'abcdefghi', 'abcdefghi' ),
			),
		);
		yield array(
			'unconditional_match',
			// input, paramToMatch, expected_return.
			array(
				array( '', '', '' ),
				array( '', 'TestCase', '' ),
				array( 'TestCase', '', 'TestCase' ),
			),
		);
		$zero_to_255_range = array(
			'min'   => 0,
			'max'   => 255,
			'range' => array( array( 0, 255 ) ),
		);
		$a_to_i_range      = array(
			'min'   => ord( 'a' ),
			'max'   => ord( 'i' ),
			'range' => array( array( ord( 'a' ), ord( 'i' ) ) ),
		);
		yield array(
			'validate_byte_range',
			// input, paramToMatch, expected_return.
			array(
				array( '', $zero_to_255_range, false ),
				array( 'abcdefghi', $zero_to_255_range, false ),
				array( 'abcdefghi', $a_to_i_range, false ),
				array( 'abcdefghij', $a_to_i_range, 'j' ),
			),
		);
		yield array(
			'within',
			// input, paramToMatch, expected_return.
			array(
				array( '', '', false ),
				array( '', 'TestCase', false ),
				array( 'TestCase', '', false ),
				array( 'abc', 'abcdefghi', 'abc' ),
				array( 'def', 'abcdefghi', 'def' ),
				array( 'ghi', 'abcdefghi', 'ghi' ),
				array( 'ghij', 'abcdefghi', false ),
				array( 'ABC', 'abcdefghi', false ),
			),
		);
	}
}
