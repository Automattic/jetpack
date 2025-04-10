<?php
/**
 * Unit Tests for Contact_Form_Plugin.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form_Plugin
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
 */
class Contact_Form_Plugin_Test extends BaseTestCase {
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
	public static function arrayReversals() {
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

	// public function test_get_block_support_classes_and_styles() {}

	// public function test_block_attributes_to_shortcode_attributes() {
	// $attributes = array(
	// 'label'        => 'Single',
	// 'isStandalone' => true,
	// 'style'        => array(
	// 'color' => array( 'text' => 'caramel' ),
	// ),
	// );

	// $shortcode_attributes = Contact_Form_Plugin::block_attributes_to_shortcode_attributes( $attributes, 'checkbox', null );
	// $this->assertEquals( 'label="Single" isStandalone="1" style="color:caramel;"', $shortcode_attributes );
	// }
}
