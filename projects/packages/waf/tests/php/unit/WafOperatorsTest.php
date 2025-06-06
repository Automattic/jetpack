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
	 * @param string $ofn  The operator function name.
	 * @param array  $args The test case arguments: sets of input, parameter, and expected result.
	 *
	 * @dataProvider transformDataProvider
	 */
	#[DataProvider( 'transformDataProvider' )]
	public function testOperators( $ofn, $args ) {
		$n = 1;
		for ( $i = 0, $z = count( $args ); $i < $z; $i += 3 ) {
			$input    = $args[ $i ];
			$param    = $args[ $i + 1 ];
			$expected = $args[ $i + 2 ];
			$this->assertSame(
				$expected,
				$this->o->$ofn( $input, $param ),
				sprintf( 'Failed %s assertion #%d with input: %s ', $ofn, $n, $input )
			);
			++$n;
		}
	}

	/**
	 * Test data provider
	 */
	public static function transformDataProvider() {
		yield array(
			'begins_with',
			array(
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
			),
		);
		yield array(
			'contains',
			array(
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
			),
		);
		yield array(
			'contains_word',
			array(
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
			),
		);
		yield array(
			'ends_with',
			array(
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
			),
		);
		yield array(
			'eq',
			array(
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
			),
		);
		yield array(
			'ge',
			array(
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
			),
		);
		yield array(
			'gt',
			array(
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
			),
		);
		yield array(
			'le',
			array(
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
			),
		);
		yield array(
			'lt',
			array(
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
			),
		);
		yield array(
			'no_match',
			array(
				'',
				'',
				false,
				'TestCase',
				'',
				false,
				'',
				'TestCase',
				false,
			),
		);
		yield array(
			'rx',
			array(
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
				'/(?i:(sleep\((\s*?)(\d*?)(\s*?)\)|benchmark\((.*?)\,(.*?)\)))/Ds',
				array( 'sleep(10)', 'sleep(10)', '', '10', '' ),
			),
		);
		yield array(
			'streq',
			array(
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
			),
		);
		yield array(
			'unconditional_match',
			array(
				'',
				'',
				'',
				'',
				'TestCase',
				'',
				'TestCase',
				'',
				'TestCase',
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
			array(
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
			),
		);
		yield array(
			'within',
			array(
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
				'ABC',
				'abcdefghi',
				false,
			),
		);
	}
}
