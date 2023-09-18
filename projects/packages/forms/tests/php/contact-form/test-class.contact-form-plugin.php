<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form
 *
 * @covers Contact_Form_Plugin
 */
class WP_Test_Contact_Form_Plugin extends BaseTestCase {
	/**
	 * Test that ::revert_that_print works correctly
	 *
	 * @dataProvider arrayReversals
	 */
	public function testStaticPrintReversal( $array, $decode_html ) {
		$print = print_r( $array, true );
		$this->assertSame( $array, Contact_Form_Plugin::reverse_that_print( $print, $decode_html ) );
	}

	/**
	 * Data provider for testStaticPrintReversal
	 */
	public function arrayReversals() {
		return array(
			'nested array' => array(
				array(
					'some',
					'array',
					'with' => array( 'nested', 'arrays' ),
				),
				false,
			),
			'multiline'    => array(
				array(
					'entry'        => "with\njumps",
					'tricky entry' => "with\n[line] =&gt; jumps",
				),
				true,
			),
		);
	}
}
