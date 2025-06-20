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
	 * @param string $ofn      The name of the operator function that is being tested.
	 * @param string $input    The input value to pass to the operator function.
	 * @param mixed  $param    The parameter value to pass to the operator function.
	 * @param mixed  $expected The expected return value from the operator function.
	 *
	 * @dataProvider transformDataProvider
	 */
	#[DataProvider( 'transformDataProvider' )]
	public function testOperator( $ofn, $input, $param, $expected ) {
		$this->assertSame(
			$expected,
			$this->o->$ofn( $input, $param )
		);
	}

	/**
	 * Test data provider
	 */
	public static function transformDataProvider() {
		yield from array(
			'begins_with - empty input and pattern'        => array( 'begins_with', '', '', '' ),
			'begins_with - non-empty input, empty pattern' => array( 'begins_with', 'TestCase', '', '' ),
			'begins_with - full match'                     => array( 'begins_with', 'abcdef', 'abcdef', 'abcdef' ),
			'begins_with - prefix match'                   => array( 'begins_with', 'abcdefghi', 'abcdef', 'abcdef' ),
			'begins_with - no match empty input'           => array( 'begins_with', '', 'TestCase', false ),
			'begins_with - no match'                       => array( 'begins_with', 'abc', 'abcdef', false ),
		);

		yield from array(
			'contains - empty input and pattern'        => array( 'contains', '', '', false ),
			'contains - non-empty input, empty pattern' => array( 'contains', 'TestCase', '', false ),
			'contains - match at beginning'             => array( 'contains', 'abcdefghi', 'abc', 'abc' ),
			'contains - match at end'                   => array( 'contains', 'abcdefghi', 'ghi', 'ghi' ),
			'contains - single character match'         => array( 'contains', 'x', 'x', 'x' ),
			'contains - middle character match'         => array( 'contains', 'xyz', 'y', 'y' ),
			'contains - match in longer string'         => array( 'contains', 'hidinX<-not quite, but is later on->hiding', 'hiding', 'hiding' ),
		);

		yield from array(
			'contains_word - empty input and pattern'      => array( 'contains_word', '', '', '' ),
			'contains_word - non-empty input, empty pattern' => array( 'contains_word', 'TestCase', '', '' ),
			'contains_word - word at beginning'            => array( 'contains_word', 'abc def ghi', 'abc', 'abc' ),
			'contains_word - word in middle'               => array( 'contains_word', 'abc def ghi', 'def', 'def' ),
			'contains_word - word at end'                  => array( 'contains_word', 'abc def ghi', 'ghi', 'ghi' ),
			'contains_word - word at beginning with null byte' => array( 'contains_word', "abc\0def ghi", 'abc', 'abc' ),
			'contains_word - word in middle with null byte' => array( 'contains_word', "abc\0def ghi", 'def', 'def' ),
			'contains_word - single character as word'     => array( 'contains_word', 'x', 'x', 'x' ),
			'contains_word - single character with spaces' => array( 'contains_word', ' x ', 'x', 'x' ),
			'contains_word - substring with word boundary' => array( 'contains_word', 'hidingX<-not on word boundary, but is later on->hiding', 'hiding', 'hiding' ),
			'contains_word - empty input, non-empty pattern' => array( 'contains_word', '', 'TestCase', false ),
			'contains_word - no word boundary for first match' => array( 'contains_word', 'abcdefghi', 'abc', false ),
			'contains_word - no word boundary for middle match' => array( 'contains_word', 'abcdefghi', 'def', false ),
			'contains_word - no word boundary for last match' => array( 'contains_word', 'abcdefghi', 'ghi', false ),
			'contains_word - substring not at word boundary' => array( 'contains_word', 'xyz', 'y', false ),
		);

		yield from array(
			'ends_with - empty input and pattern'        => array( 'ends_with', '', '', '' ),
			'ends_with - non-empty input, empty pattern' => array( 'ends_with', 'TestCase', '', '' ),
			'ends_with - match at end'                   => array( 'ends_with', 'abcdefghi', 'ghi', 'ghi' ),
			'ends_with - match at end with null byte'    => array( 'ends_with', "abcdef\0ghi", 'ghi', 'ghi' ),
			'ends_with - empty input, non-empty pattern' => array( 'ends_with', '', 'TestCase', false ),
			'ends_with - no match at beginning'          => array( 'ends_with', 'abcdefghi', 'abc', false ),
			'ends_with - no match in middle'             => array( 'ends_with', 'abcdefghi', 'def', false ),
		);

		yield from array(
			'eq - empty input, zero param'           => array( 'eq', '', '0', '' ),
			'eq - zero input, non-numeric param'     => array( 'eq', '0', 'xxx', '0' ),
			'eq - non-numeric input, zero param'     => array( 'eq', 'xxx', '0', 'xxx' ),
			'eq - zero input and param'              => array( 'eq', '0', '0', '0' ),
			'eq - numeric input and param'           => array( 'eq', '5', '5', '5' ),
			'eq - negative input and param'          => array( 'eq', '-5', '-5', '-5' ),
			'eq - empty input, numeric param'        => array( 'eq', '', '5', false ),
			'eq - numeric input, non-numeric param'  => array( 'eq', '5', 'xxx', false ),
			'eq - negative input, non-numeric param' => array( 'eq', '-1', 'xxx', false ),
			'eq - non-numeric input, numeric param'  => array( 'eq', 'xxx', '5', false ),
			'eq - negative input, 0 param'           => array( 'eq', '-5', '0', false ),
			'eq - numeric input, 0 param'            => array( 'eq', '5', '0', false ),
			'eq - 0 input, non-zero numeric param'   => array( 'eq', '0', '5', false ),
			'eq - different numeric input and param' => array( 'eq', '10', '5', false ),
		);

		yield from array(
			'ge - empty input, zero param'           => array( 'ge', '', '0', '' ),
			'ge - numeric input, non-numeric param'  => array( 'ge', '5', 'xxx', '5' ),
			'ge - non-numeric input, zero param'     => array( 'ge', 'xxx', '0', 'xxx' ),
			'ge - zero input and param'              => array( 'ge', '0', '0', '0' ),
			'ge - non-zero numeric input, 0 param'   => array( 'ge', '5', '0', '5' ),
			'ge - numeric input and param'           => array( 'ge', '5', '5', '5' ),
			'ge - 10 input, 5 param'                 => array( 'ge', '10', '5', '10' ),
			'ge - empty input, numeric param'        => array( 'ge', '', '5', false ),
			'ge - negative input, non-numeric param' => array( 'ge', '-1', 'xxx', false ),
			'ge - non-numeric input, numeric param'  => array( 'ge', 'xxx', '5', false ),
			'ge - negative input, empty param'       => array( 'ge', '-5', '', false ),
			'ge - 0 input, positive param'           => array( 'ge', '0', '5', false ),
		);

		yield from array(
			'gt - numeric input, non-numeric param'  => array( 'gt', '5', 'xxx', '5' ),
			'gt - non-numeric input, negative param' => array( 'gt', 'xxx', '-1', 'xxx' ),
			'gt - positive input, 0 param'           => array( 'gt', '5', '0', '5' ),
			'gt - 10 input, 5 param'                 => array( 'gt', '10', '5', '10' ),
			'gt - empty input, 0 param'              => array( 'gt', '', '0', false ),
			'gt - empty input, numeric param'        => array( 'gt', '', '5', false ),
			'gt - negative input, non-numeric param' => array( 'gt', '-1', 'xxx', false ),
			'gt - non-numeric input, numeric param'  => array( 'gt', 'xxx', '5', false ),
			'gt - negative input, 0 param'           => array( 'gt', '-5', '0', false ),
			'gt - 0 input and param'                 => array( 'gt', '0', '0', false ),
			'gt - 0 input, positive param'           => array( 'gt', '0', '5', false ),
			'gt - numeric input and param'           => array( 'gt', '5', '5', false ),
		);

		yield from array(
			'le - empty input, zero param'           => array( 'le', '', '0', '' ),
			'le - empty input, numeric param'        => array( 'le', '', '5', '' ),
			'le - numeric input, non-numeric param'  => array( 'le', '5', 'xxx', false ),
			'le - negative input, non-numeric param' => array( 'le', '-1', 'xxx', '-1' ),
			'le - non-numeric input, zero param'     => array( 'le', 'xxx', '0', 'xxx' ),
			'le - non-numeric input, numeric param'  => array( 'le', 'xxx', '5', 'xxx' ),
			'le - negative input, 0 param'           => array( 'le', '-5', '0', '-5' ),
			'le - 0 input and param'                 => array( 'le', '0', '0', '0' ),
			'le - positive input, 0 param'           => array( 'le', '5', '0', false ),
			'le - 0 input, positive param'           => array( 'le', '0', '5', '0' ),
			'le - numeric input and param'           => array( 'le', '5', '5', '5' ),
			'le - 10 input, 5 param'                 => array( 'le', '10', '5', false ),
		);

		yield from array(
			'lt - empty input, zero param'           => array( 'lt', '', '0', false ),
			'lt - empty input, numeric param'        => array( 'lt', '', '5', '' ),
			'lt - numeric input, non-numeric param'  => array( 'lt', '5', 'xxx', false ),
			'lt - negative input, non-numeric param' => array( 'lt', '-1', 'xxx', '-1' ),
			'lt - non-numeric input, negative param' => array( 'lt', 'xxx', '-1', false ),
			'lt - non-numeric input, numeric param'  => array( 'lt', 'xxx', '5', 'xxx' ),
			'lt - negative input, 0 param'           => array( 'lt', '-5', '0', '-5' ),
			'lt - 0 input and param'                 => array( 'lt', '0', '0', false ),
			'lt - positive input, 0 param'           => array( 'lt', '5', '0', false ),
			'lt - 0 input, positive param'           => array( 'lt', '0', '5', '0' ),
			'lt - positive input and param'          => array( 'lt', '5', '5', false ),
			'lt - 10 input, 5 param'                 => array( 'lt', '10', '5', false ),
		);

		yield from array(
			'no_match - empty input and pattern'        => array( 'no_match', '', '', false ),
			'no_match - non-empty input, empty pattern' => array( 'no_match', 'TestCase', '', false ),
			'no_match - empty input, non-empty pattern' => array( 'no_match', '', 'TestCase', false ),
		);

		yield from array(
			'rx - empty input, empty pattern'     => array( 'rx', '', '//Ds', array( '' ) ),
			'rx - empty input, non-empty pattern' => array( 'rx', '', '/TestCase/Ds', false ),
			'rx - non-empty input, empty pattern' => array( 'rx', 'TestCase', '//Ds', array( '' ) ),
			'rx - match at beginning'             => array( 'rx', 'abcdefghi', '/abc/Ds', array( 'abc' ) ),
			'rx - match in middle'                => array( 'rx', 'abcdefghi', '/def/Ds', array( 'def' ) ),
			'rx - match at end'                   => array( 'rx', 'abcdefghi', '/ghi/Ds', array( 'ghi' ) ),
			'rx - no match'                       => array( 'rx', 'abcdefghi', '/ghij/Ds', false ),
			'rx - complex pattern'                => array( 'rx', 'SELECT pg_sleep(10);', '/(?i:(sleep\\((\\s*?)(\\d*?)(\\s*?)\\)|benchmark\\((.*?)\\,(.*?)\\)))/Ds', array( 'sleep(10)', 'sleep(10)', '', '10', '' ) ),
		);

		yield from array(
			'streq - empty input and pattern'        => array( 'streq', '', '', '' ),
			'streq - empty input, non-empty pattern' => array( 'streq', '', 'TestCase', false ),
			'streq - non-empty input, empty pattern' => array( 'streq', 'TestCase', '', false ),
			'streq - partial match at beginning'     => array( 'streq', 'abcdefghi', 'abc', false ),
			'streq - partial match in middle'        => array( 'streq', 'abcdefghi', 'def', false ),
			'streq - partial match at end'           => array( 'streq', 'abcdefghi', 'ghi', false ),
			'streq - exact match'                    => array( 'streq', 'abcdefghi', 'abcdefghi', 'abcdefghi' ),
		);

		yield from array(
			'unconditional_match - empty input and pattern'        => array( 'unconditional_match', '', '', '' ),
			'unconditional_match - empty input, non-empty pattern' => array( 'unconditional_match', '', 'TestCase', '' ),
			'unconditional_match - non-empty input, empty pattern' => array( 'unconditional_match', 'TestCase', '', 'TestCase' ),
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
		yield from array(
			'validate_byte_range - empty input, 0-255 range' => array( 'validate_byte_range', '', $zero_to_255_range, false ),
			'validate_byte_range - a-i all within 0-255 range' => array( 'validate_byte_range', 'abcdefghi', $zero_to_255_range, false ),
			'validate_byte_range - a-i all within a-i range' => array( 'validate_byte_range', 'abcdefghi', $a_to_i_range, false ),
			'validate_byte_range - j outside a-i range' => array( 'validate_byte_range', 'abcdefghij', $a_to_i_range, 'j' ),
		);

		yield from array(
			'within - empty input and pattern'        => array( 'within', '', '', false ),
			'within - empty input, non-empty pattern' => array( 'within', '', 'TestCase', false ),
			'within - non-empty input, empty pattern' => array( 'within', 'TestCase', '', false ),
			'within - match at beginning'             => array( 'within', 'abc', 'abcdefghi', 'abc' ),
			'within - match in middle'                => array( 'within', 'def', 'abcdefghi', 'def' ),
			'within - match at end'                   => array( 'within', 'ghi', 'abcdefghi', 'ghi' ),
			'within - no match longer string'         => array( 'within', 'ghij', 'abcdefghi', false ),
			'within - no match case sensitive'        => array( 'within', 'ABC', 'abcdefghi', false ),
		);
	}
}
