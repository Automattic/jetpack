<?php
/**
 * Unit Tests for Contact_Form_Plugin.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WorDBless\BaseTestCase;
use WP_Block;

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
	 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_checkbox
	 */
	public function test_gutenblock_render_field_checkbox_multiple_shortcode() {
		$block = array(
			'blockName'   => 'jetpack/field-checkbox-multiple',
			'attrs'       => array(
				'required'             => false,
				'shareFieldAttributes' => false,
				'className'            => 'is-style-list',
			),
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/label',
					'attrs'     => array(
						'label'        => 'Choose several options',
						'defaultLabel' => 'Add label…',
						'textColor'    => 'swamp-green',
						'style'        => array(
							'elements' => array(
								'link' => array( 'color' => array( 'text' => 'var:preset|color|accent-3' ) ),
							),
						),
					),
				),
				array(
					'blockName'   => 'jetpack/options',
					'attrs'       => array(
						'style' => array(
							'spacing' => array(
								'blockGap' => 'var:preset|spacing|40',
							),
						),
					),
					'innerBlocks' => array(
						array(
							'blockName' => 'jetpack/option',
							'attrs'     => array(
								'label' => 'truth',
								'style' => array(
									'color'      => array( 'text' => 'caramel' ),
									'elements'   => array(
										'link' => array( 'color' => array( 'text' => 'caramel' ) ),
									),
									'typography' => array(
										'fontSize' => '24px',
									),
								),
							),
						),
						array(
							'blockName' => 'jetpack/option',
							'attrs'     => array(
								'label' => 'dare',
								'style' => array(
									'color'      => array( 'text' => 'gummy' ),
									'elements'   => array(
										'link' => array( 'color' => array( 'text' => 'gummy' ) ),
									),
									'typography' => array(
										'fontSize' => '24px',
									),
								),
							),
						),
					),
				),
			),
		);

		// Render the shortcode.
		$shortcode = Contact_Form_Plugin::gutenblock_render_field_checkbox_multiple( array(), '', new WP_Block( $block ) );
		$expected  = '[contact-field type="checkbox-multiple" label="Choose several options" labelclasses="wp-block-jetpack-label has-text-color has-swamp-green-color" options="truth,dare" optionsdata="&#091;{&quot;label&quot;:&quot;truth&quot;&#044;&quot;class&quot;:&quot;has-text-color&quot;&#044;&quot;style&quot;:&quot;color:caramel; font-size:24px;&quot;}&#044;{&quot;label&quot;:&quot;dare&quot;&#044;&quot;class&quot;:&quot;has-text-color&quot;&#044;&quot;style&quot;:&quot;color:gummy; font-size:24px;&quot;}&#093;"/]';

		$this->assertEquals( $expected, $shortcode, 'Shortcode is not as expected' );
	}

	/**
	 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_checkbox
	 */
	public function test_gutenblock_render_field_checkbox_shortcode() {
		$block     = array(
			'blockName'   => 'jetpack/field-checkbox',
			'attrs'       => array(
				'required' => false,
			),
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/option',
					'attrs'     => array(
						'label'        => 'single',
						'isStandalone' => true,
						'style'        => array(
							'color'      => array( 'text' => 'caramel' ),
							'elements'   => array(
								'link' => array( 'color' => array( 'text' => 'caramel' ) ),
							),
							'typography' => array(
								'fontSize' => '24px',
							),
						),
					),
				),
			),
		);
		$shortcode = Contact_Form_Plugin::gutenblock_render_field_checkbox( array(), '', new WP_Block( $block ) );
		$expected  = '[contact-field type="checkbox" label="single" optionclasses=" has-text-color" optionstyles="color:caramel; font-size:24px;"/]';

		$this->assertEquals( $expected, $shortcode );
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
		$shortcode_attributes = Contact_Form_Plugin::block_attributes_to_shortcode_attributes( array(), 'checkbox', new WP_Block( $block ) );

		$this->assertEquals( 'wp-block-jetpack-label has-text-color has-swamp-green-color', $shortcode_attributes['labelclasses'] );
		$this->assertEquals( 'wp-block-jetpack-input has-text-color has-background has-border-color', $shortcode_attributes['inputclasses'] );
		$this->assertEquals( 'color:swamp-green;background-color:swamp-red; font-size:24px;font-style:italic;font-weight:bold;line-height:1.5;letter-spacing:0.1em; border-color:swamp-blue;border-style:dashed;border-width:1px;', $shortcode_attributes['inputstyles'] );
	}
}
