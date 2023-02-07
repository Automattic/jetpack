<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use \WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form
 *
 * @covers Contact_Form_Plugin
 */
class WP_Test_Contact_Form_Plugin extends BaseTestCase {
	/**
	 * Test that ::revert_that_print works correctly
	 */
	public function testStaticPrintReversal() {
		$array = array(
			'some',
			'array',
			'with' => array( 'nested', 'arrays' ),
		);
		$print = print_r( $array, true );
		$this->assertSame( $array, Contact_Form_Plugin::reverse_that_print( $print ) );
	}
}
