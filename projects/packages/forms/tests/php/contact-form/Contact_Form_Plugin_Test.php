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

	/**
	 * Test that ::block_attributes_to_shortcode_attributes works correctly with styles.
	 */
	public function test_block_attributes_to_shortcode_attributes_with_styles() {
		$block                = array(
			'blockName'   => 'jetpack/field-name',
			'attrs'       => array(
				'required' => false,
			),
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/label',
					'attrs'     => array(
						'label'     => 'Name',
						'textColor' => 'swamp-green',
						'style'     => array(
							'elements' => array(
								'link' => array( 'color' => array( 'text' => 'var:preset|color|accent-3' ) ),
							),
						),
					),
				),
				array(
					'blockName' => 'jetpack/input',
					'attrs'     => array(
						'style' => array(
							'color'      => array(
								'text'       => 'swamp-green',
								'background' => 'swamp-red',
							),
							'typography' => array(
								'fontSize'      => '24px',
								'fontWeight'    => 'bold',
								'fontStyle'     => 'italic',
								'lineHeight'    => '1.5',
								'letterSpacing' => '0.1em',
							),
							'border'     => array(
								'color' => 'swamp-blue',
								'width' => '1px',
								'style' => 'dashed',
							),
						),
					),
				),
			),
		);
		$shortcode_attributes = Contact_Form_Plugin::block_attributes_to_shortcode_attributes( array(), 'checkbox', new \WP_Block( $block ) );

		$this->assertEquals( 'wp-block-jetpack-label has-text-color has-swamp-green-color', $shortcode_attributes['labelclasses'] );
		$this->assertEquals( 'wp-block-jetpack-input has-text-color has-background has-border-color', $shortcode_attributes['inputclasses'] );
		$this->assertEquals( 'color:swamp-green;background-color:swamp-red; font-size:24px;font-style:italic;font-weight:bold;line-height:1.5;letter-spacing:0.1em; border-color:swamp-blue;border-style:dashed;border-width:1px;', $shortcode_attributes['inputstyles'] );
	}
}
