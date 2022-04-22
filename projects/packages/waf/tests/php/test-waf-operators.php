<?php
/**
 * Adapted from modsecurity tests: https://github.com/SpiderLabs/ModSecurity/tree/caadf97524a4861456be176a8cb91dcbb76b97e4/tests/op
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Operators;

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
	protected function before() {
		$this->o = new Waf_Operators();
	}

	/**
	 * Main test function
	 *
	 * @param string $ofn The name of the operator function that is being tested.
	 * @param array  ...$tests The tests cases.
	 *
	 * @dataProvider transformDataProvider
	 */
	public function testOperators( $ofn, ...$tests ) {
		$n = 1;
		for ( $i = 0, $z = count( $tests ); $i < $z; $i += 3 ) {
			$input    = $tests[ $i ];
			$param    = $tests[ $i + 1 ];
			$expected = $tests[ $i + 2 ];
			$this->assertSame(
				$expected,
				$this->o->$ofn( $input, $param ),
				sprintf( 'Failed %s assertion #%d with input: %s ', $ofn, $n, $input )
			);
			$n++;
		}
	}

	/**
	 * Test data provider
	 */
	public function transformDataProvider() {
		yield array(
			'begins_with',
			// input, paramToMatch, expected_return.
			'',
			'',
			'',
			'TestCase',
			'',
			'',
			'abcdef',
			'abcdef',
			'abcdef',
			'abcdefghi',
			'abcdef',
			'abcdef',
			'',
			'TestCase',
			false,
			'abc',
			'abcdef',
			false,
		);

		yield array(
			'contains',
			// input, paramToMatch, expected_return.
			'',
			'',
			false,
			'TestCase',
			'',
			false,
			'abcdefghi',
			'abc',
			'abc',
			'abcdefghi',
			'ghi',
			'ghi',
			'x',
			'x',
			'x',
			'xyz',
			'y',
			'y',
			'hidinX<-not quite, but is later on->hiding',
			'hiding',
			'hiding',
		);

		yield array(
			'contains_word',
			// input, paramToMatch, expected_return.
			'',
			'',
			'',
			'TestCase',
			'',
			'',
			'abc def ghi',
			'abc',
			'abc',
			'abc def ghi',
			'def',
			'def',
			'abc def ghi',
			'ghi',
			'ghi',
			"abc\0def ghi",
			'abc',
			'abc',
			"abc\0def ghi",
			'def',
			'def',
			'x',
			'x',
			'x',
			' x ',
			'x',
			'x',
			'hidingX<-not on word boundary, but is later on->hiding',
			'hiding',
			'hiding',
			'',
			'TestCase',
			false,
			'abcdefghi',
			'abc',
			false,
			'abcdefghi',
			'def',
			false,
			'abcdefghi',
			'ghi',
			false,
			'xyz',
			'y',
			false,
		);

		yield array(
			'ends_with',
			// input, paramToMatch, expected_return.
			'',
			'',
			'',
			'TestCase',
			'',
			'',
			'abcdefghi',
			'ghi',
			'ghi',
			"abcdef\0ghi",
			'ghi',
			'ghi',
			'',
			'TestCase',
			false,
			'abcdefghi',
			'abc',
			false,
			'abcdefghi',
			'def',
			false,
		);

		yield array(
			'eq',
			// input, paramToMatch, expected_return.
			'',
			'0',
			'',
			'0',
			'xxx',
			'0',
			'xxx',
			'0',
			'xxx',
			'0',
			'0',
			'0',
			'5',
			'5',
			'5',
			'-5',
			'-5',
			'-5',
			'',
			'5',
			false,
			'5',
			'xxx',
			false,
			'-1',
			'xxx',
			false,
			'xxx',
			'5',
			false,
			'-5',
			'0',
			false,
			'5',
			'0',
			false,
			'0',
			'5',
			false,
			'10',
			'5',
			false,
		);

		yield array(
			'ge',
			// input, paramToMatch, expected_return.
			'',
			'0',
			'',
			'5',
			'xxx',
			'5',
			'xxx',
			'0',
			'xxx',
			'0',
			'0',
			'0',
			'5',
			'0',
			'5',
			'5',
			'5',
			'5',
			'10',
			'5',
			'10',
			'',
			'5',
			false,
			'-1',
			'xxx',
			false,
			'xxx',
			'5',
			false,
			'-5',
			'',
			false,
			'0',
			'5',
			false,
		);

		yield array(
			'gt',
			// input, paramToMatch, expected_return.
			'5',
			'xxx',
			'5',
			'xxx',
			'-1',
			'xxx',
			'5',
			'0',
			'5',
			'10',
			'5',
			'10',
			'',
			'0',
			false,
			'',
			'5',
			false,
			'-1',
			'xxx',
			false,
			'xxx',
			'5',
			false,
			'-5',
			'0',
			false,
			'0',
			'0',
			false,
			'0',
			'5',
			false,
			'5',
			'5',
			false,
		);

		yield array(
			'le',
			// input, paramToMatch, expected_return.
			'',
			'0',
			'',
			'',
			'5',
			'',
			'5',
			'xxx',
			false,
			'-1',
			'xxx',
			'-1',
			'xxx',
			'0',
			'xxx',
			'xxx',
			'5',
			'xxx',
			'-5',
			'0',
			'-5',
			'0',
			'0',
			'0',
			'5',
			'0',
			false,
			'0',
			'5',
			'0',
			'5',
			'5',
			'5',
			'10',
			'5',
			false,
		);

		yield array(
			'lt',
			// input, paramToMatch, expected_return.
			'',
			'0',
			false,
			'',
			'5',
			'',
			'5',
			'xxx',
			false,
			'-1',
			'xxx',
			'-1',
			'xxx',
			'-1',
			false,
			'xxx',
			'5',
			'xxx',
			'-5',
			'0',
			'-5',
			'0',
			'0',
			false,
			'5',
			'0',
			false,
			'0',
			'5',
			'0',
			'5',
			'5',
			false,
			'10',
			'5',
			false,
		);

		yield array(
			'no_match',
			// input, paramToMatch, expected_return.
			'',
			'',
			false,
			'TestCase',
			'',
			false,
			'',
			'TestCase',
			false,
		);

		yield array(
			'rx',
			// input, paramToMatch, expected_return.
			'',
			'//Ds',
			array( '' ),
			'',
			'/TestCase/Ds',
			false,
			'TestCase',
			'//Ds',
			array( '' ),
			'abcdefghi',
			'/abc/Ds',
			array( 'abc' ),
			'abcdefghi',
			'/def/Ds',
			array( 'def' ),
			'abcdefghi',
			'/ghi/Ds',
			array( 'ghi' ),
			'abcdefghi',
			'/ghij/Ds',
			false,
			'SELECT pg_sleep(10);',
			'/(?i:(sleep\\((\\s*?)(\\d*?)(\\s*?)\\)|benchmark\\((.*?)\\,(.*?)\\)))/Ds',
			array( 'sleep(10)', 'sleep(10)', '', '10', '' ),
		);

		yield array(
			'streq',
			// input, paramToMatch, expected_return.
			'',
			'',
			'',
			'',
			'TestCase',
			false,
			'TestCase',
			'',
			false,
			'abcdefghi',
			'abc',
			false,
			'abcdefghi',
			'def',
			false,
			'abcdefghi',
			'ghi',
			false,
			'abcdefghi',
			'abcdefghi',
			'abcdefghi',
		);

		yield array(
			'unconditional_match',
			// input, paramToMatch, expected_return.
			'',
			'',
			'',
			'',
			'TestCase',
			'',
			'TestCase',
			'',
			'TestCase',
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
			'',
			$zero_to_255_range,
			false,
			'abcdefghi',
			$zero_to_255_range,
			false,
			'abcdefghi',
			$a_to_i_range,
			false,
			'abcdefghij',
			$a_to_i_range,
			'j',
		);

		yield array(
			'within',
			// input, paramToMatch, expected_return.
			'',
			'',
			false,
			'',
			'TestCase',
			false,
			'TestCase',
			'',
			false,
			'abc',
			'abcdefghi',
			'abc',
			'def',
			'abcdefghi',
			'def',
			'ghi',
			'abcdefghi',
			'ghi',
			'ghij',
			'abcdefghi',
			false,
		);
	}
}
