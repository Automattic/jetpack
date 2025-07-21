<?php
/**
 * Unit Tests for Contact_Form_Plugin.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Block;

/**
 * Test class for Contact_Form_Plugin
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
 */
#[CoversClass( Contact_Form_Plugin::class )]
class Contact_Form_Plugin_Test extends BaseTestCase {
	/**
	 * Test that ::revert_that_print works correctly
	 *
	 * @dataProvider arrayReversals
	 */
	#[DataProvider( 'arrayReversals' )]
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
	 * Tests the render output of gutenblock_render_field_checkbox_multiple.
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
						'label'       => 'Choose several options',
						'placeholder' => 'Add label…',
						'textColor'   => 'swamp-green',
						'style'       => array(
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
		$expected  = '[contact-field type="checkbox-multiple" label="Choose several options" labelclasses="wp-block-jetpack-label has-text-color has-swamp-green-color" optionsclasses="wp-block-jetpack-options" options="truth,dare" optionsdata="&#091;{&quot;label&quot;:&quot;truth&quot;&#044;&quot;class&quot;:&quot;has-text-color wp-block-jetpack-option&quot;&#044;&quot;style&quot;:&quot;color:caramel; font-size:24px;&quot;}&#044;{&quot;label&quot;:&quot;dare&quot;&#044;&quot;class&quot;:&quot;has-text-color wp-block-jetpack-option&quot;&#044;&quot;style&quot;:&quot;color:gummy; font-size:24px;&quot;}&#093;" stylevariationattributes="" stylevariationclasses="" stylevariationstyles="" fieldwrapperclasses="wp-block-jetpack-field-checkbox-multiple"/]';

		$this->assertEquals( $expected, $shortcode, 'Shortcode is not as expected' );
	}

	/**
	 * Tests the render output of gutenblock_render_field_checkbox.
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
		$expected  = '[contact-field type="checkbox" label="single" optionclasses="wp-block-jetpack-option has-text-color" optionstyles="color:caramel; font-size:24px;" fieldwrapperclasses="wp-block-jetpack-field-checkbox"/]';

		$this->assertEquals( $expected, $shortcode );
	}

	/**
	 * Tests the render output of gutenblock_render_field_text.
	 */
	public function test_gutenblock_gutenblock_render_field_text_shortcode() {
		$block     = array(
			'blockName'   => 'field-text',
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/label',
					'attrs'     => array(
						'label'        => 'Label',
						'requiredText' => 'Do it',
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
				array(
					'blockName' => 'jetpack/input',
					'attrs'     => array(
						'label'       => 'Label',
						'placeholder' => 'hi!',
						'min'         => '1',
						'max'         => '10',
						'style'       => array(
							'color'      => array( 'text' => 'toot' ),
							'border'     => array(
								'color' => 'toot',
								'width' => '1px',
							),
							'typography' => array(
								'fontSize' => '33rem',
							),
						),
					),
				),
			),
		);
		$shortcode = Contact_Form_Plugin::gutenblock_render_field_text( array(), '', new WP_Block( $block ) );
		$expected  = '[contact-field type="text" label="Label" requiredText="Do it" labelclasses="wp-block-jetpack-label has-text-color" labelstyles="color:caramel; font-size:24px;" placeholder="hi!" min="1" max="10" inputclasses="wp-block-jetpack-input has-text-color has-border-color" inputstyles="color:toot; font-size:33rem; border-color:toot;border-width:1px;" stylevariationattributes="{&quot;border&quot;:{&quot;color&quot;:&quot;toot&quot;&#044;&quot;width&quot;:&quot;1px&quot;}}" stylevariationclasses=" has-border-color" stylevariationstyles="border-color:toot;border-width:1px;" fieldwrapperclasses="wp-block-jetpack-field-text"/]';

		$this->assertEquals( $expected, $shortcode );
	}

	/**
	 * Tests the render output of gutenblock_render_field_radio.
	 */
	public function test_gutenblock_gutenblock_render_field_radio() {
		$block = array(
			'blockName'   => 'jetpack/field-radio',
			'attrs'       => array(
				'required'  => true,
				'width'     => '100%',
				'className' => 'is-style-button some-custom-class',
			),
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/label',
					'attrs'     => array(
						'label'       => 'Radio gaga',
						'placeholder' => 'Radio gaga…',
						'textColor'   => 'turmoil-purple',
						'style'       => array(
							'elements' => array(
								'link' => array( 'color' => array( 'text' => 'var:preset|color|turmoil-purple' ) ),
							),
						),
					),
				),
				array(
					'blockName'   => 'jetpack/options',
					'attrs'       => array(
						'type' => 'radio',
					),
					'innerBlocks' => array(
						array(
							'blockName' => 'jetpack/option',
							'attrs'     => array(
								'label' => 'freddy',
								'style' => array(
									'color'      => array( 'text' => 'reddo' ),
									'elements'   => array(
										'link' => array( 'color' => array( 'text' => 'greeno' ) ),
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
								'label' => 'brian',
								'style' => array(
									'color'      => array( 'text' => 'blueo' ),
									'elements'   => array(
										'link' => array( 'color' => array( 'text' => 'orango' ) ),
									),
									'typography' => array(
										'fontSize' => '100rem',
									),
								),
							),
						),
					),
				),
			),
		);

		// Render the shortcode.
		$shortcode = Contact_Form_Plugin::gutenblock_render_field_radio( array(), '', new WP_Block( $block ) );
		$expected  = '[contact-field type="radio" label="Radio gaga" labelclasses="wp-block-jetpack-label has-text-color has-turmoil-purple-color" optionsclasses="wp-block-jetpack-options" options="freddy,brian" optionsdata="&#091;{&quot;label&quot;:&quot;freddy&quot;&#044;&quot;class&quot;:&quot;has-text-color wp-block-jetpack-option&quot;&#044;&quot;style&quot;:&quot;color:reddo; font-size:24px;&quot;}&#044;{&quot;label&quot;:&quot;brian&quot;&#044;&quot;class&quot;:&quot;has-text-color wp-block-jetpack-option&quot;&#044;&quot;style&quot;:&quot;color:blueo; font-size:100rem;&quot;}&#093;" stylevariationattributes="" stylevariationclasses="" stylevariationstyles="" fieldwrapperclasses="wp-block-jetpack-field-radio"/]';

		$this->assertEquals( $expected, $shortcode, 'Shortcode is not as expected' );
	}

	/**
	 * Test that ::block_attributes_to_shortcode_attributes works correctly with styles.
	 *
	 * @dataProvider data_provider_block_attributes_to_shortcode_attributes_with_styles
	 *
	 * @param array  $expected The expected shortcode attributes.
	 * @param array  $atts The attributes of the shortcode block.
	 * @param array  $inner_blocks The inner blocks of the block.
	 * @param string $type The type of the field.
	 */
	#[DataProvider( 'data_provider_block_attributes_to_shortcode_attributes_with_styles' )]
	public function test_block_attributes_to_shortcode_attributes_with_styles( $expected, $atts = array(), $inner_blocks = array(), $type = 'text' ) {
		$block                = array(
			'blockName'   => 'jetpack/field-name',
			'attrs'       => array(
				'required' => false,
			),
			'innerBlocks' => $inner_blocks,
		);
		$shortcode_attributes = Contact_Form_Plugin::block_attributes_to_shortcode_attributes( $atts, $type, new WP_Block( $block ) );

		// Sorting here so we don't have to care about the order of the attributes in the shortcode/data provider.
		$expected_keys = array_keys( $expected );
		$actual_keys   = array_keys( $shortcode_attributes );
		sort( $expected_keys );
		sort( $actual_keys );
		$this->assertEquals( $expected_keys, $actual_keys );

		foreach ( $expected as $key => $value ) {
			$this->assertEquals( $value, $shortcode_attributes[ $key ] );
		}
	}

	/**
	 * Data provider for test_block_attributes_to_shortcode_attributes_with_styles
	 *
	 * @return array
	 */
	public static function data_provider_block_attributes_to_shortcode_attributes_with_styles() {
		return array(
			'label and input'   => array(
				'expected'     => array(
					'labelclasses'             => 'wp-block-jetpack-label has-text-color has-accent-3-color',
					'labelstyles'              => 'font-size:32px;',
					'inputclasses'             => 'wp-block-jetpack-input has-text-color has-background has-border-color',
					'inputstyles'              => 'color:swamp-green;background-color:swamp-red; font-size:24px;font-style:italic;font-weight:bold;line-height:1.5;letter-spacing:0.1em; border-color:swamp-blue;border-style:dashed;border-width:1px;',
					'label'                    => 'Label and Input',
					'requiredText'             => 'Do it',
					'placeholder'              => 'Yo',
					'min'                      => '1',
					'max'                      => '10',
					'type'                     => 'text',
					'fieldwrapperclasses'      => 'wp-block-jetpack-field-text',
					'stylevariationclasses'    => ' has-background has-border-color',
					'stylevariationattributes' => '{"border":{"color":"swamp-blue","width":"1px","style":"dashed"},"color":{"background":"swamp-red"}}',
					'stylevariationstyles'     => 'background-color:swamp-red; border-color:swamp-blue;border-style:dashed;border-width:1px;',
				),
				'atts'         => array(),
				'inner_blocks' => array(
					array(
						'blockName' => 'jetpack/label',
						'attrs'     => array(
							'label'        => 'Label and Input',
							'textColor'    => 'accent-3',
							'requiredText' => 'Do it',
							'style'        => array(
								'elements'   => array(
									'link' => array( 'color' => array( 'text' => 'var:preset|color|accent-3' ) ),
								),
								'typography' => array(
									'fontSize' => '32px',
								),
							),
						),
					),
					array(
						'blockName' => 'jetpack/input',
						'attrs'     => array(
							'placeholder' => 'Yo',
							'min'         => '1',
							'max'         => '10',
							'type'        => 'text',
							'style'       => array(
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
			),
			'option'            => array(
				'expected'     => array(
					'optionclasses'       => 'wp-block-jetpack-option has-text-color has-swamp-cheese-color',
					'optionstyles'        => 'font-size:24px;font-style:italic;font-weight:bold;line-height:1.5;letter-spacing:0.1em;',
					'label'               => 'Option',
					'type'                => 'radio',
					'fieldwrapperclasses' => 'wp-block-jetpack-field-radio',
				),
				'atts'         => array(),
				'inner_blocks' => array(
					array(
						'blockName' => 'jetpack/option',
						'attrs'     => array(
							'label'     => 'Option',
							'textColor' => 'swamp-cheese',
							'style'     => array(
								'color'      => array(
									'background' => 'swamp-cheese',
								),
								'typography' => array(
									'fontSize'      => '24px',
									'fontWeight'    => 'bold',
									'fontStyle'     => 'italic',
									'lineHeight'    => '1.5',
									'letterSpacing' => '0.1em',
								),
								'border'     => array(
									'color' => 'swamp-cheese',
									'width' => '1px',
									'style' => 'dashed',
								),
							),
						),
					),
				),
				'type'         => 'radio',
			),
			'label and options' => array(
				'expected'     => array(
					'class'                    => 'some-custom-class',
					'labelclasses'             => 'wp-block-jetpack-label has-text-color has-accent-3-color',
					'labelstyles'              => 'letter-spacing:0.1em;',
					'options'                  => 'Option 1,Option 2',
					'optionsdata'              => '[{"label":"Option 1","class":"has-text-color has-sweet-potato-option-1-color wp-block-jetpack-option","style":"font-size:24px;font-weight:bold;line-height:1.5;letter-spacing:0.1em;"},{"label":"Option 2","class":"has-text-color has-sweet-potato-option-2-color wp-block-jetpack-option","style":"font-size:22px;font-weight:normal;"}]',
					'label'                    => 'Label multiple options',
					'type'                     => 'checkbox-multiple',
					'requiredText'             => 'Do it again',
					'fieldwrapperclasses'      => 'wp-block-jetpack-field-checkbox-multiple is-style-button  is-style-button-wrap',
					'optionsclasses'           => 'wp-block-jetpack-options has-background',
					'optionsstyles'            => 'background-color:green-tonight; border-top-width:2px;border-top-color:terrible-red;border-top-style:solid;',
					'stylevariationclasses'    => ' has-background',
					'stylevariationattributes' => '{"border":{"top":{"color":"terrible-red","width":"2px","style":"solid","radius":"10px"}},"color":{"background":"green-tonight"}}',
					'stylevariationstyles'     => 'background-color:green-tonight; border-top-width:2px;border-top-color:terrible-red;border-top-style:solid;',
				),
				'atts'         => array(
					'className' => 'is-style-button some-custom-class',
				),
				'inner_blocks' => array(
					array(
						'blockName' => 'jetpack/label',
						'attrs'     => array(
							'label'        => 'Label multiple options',
							'textColor'    => 'accent-3',
							'requiredText' => 'Do it again',
							'style'        => array(
								'elements'   => array(
									'link' => array( 'color' => array( 'text' => 'var:preset|color|accent-3' ) ),
								),
								'typography' => array(
									'letterSpacing' => '0.1em',
								),
							),
						),
					),
					array(
						'blockName'   => 'jetpack/options',
						'attrs'       => array(
							'type'  => 'radio',
							'style' => array(
								'border' => array(
									'top' => array(
										'color'  => 'terrible-red',
										'width'  => '2px',
										'style'  => 'solid',
										'radius' => '10px',
									),
								),
								'color'  => array(
									'background' => 'green-tonight',
								),
							),
						),
						'innerBlocks' => array(
							array(
								'blockName' => 'jetpack/option',
								'attrs'     => array(
									'label'     => 'Option 1',
									'textColor' => 'sweet-potato-option1',
									'style'     => array(
										'color'      => array(
											'background' => 'sweet-potato-option1',
										),
										'typography' => array(
											'fontSize'   => '24px',
											'fontWeight' => 'bold',
											'lineHeight' => '1.5',
											'letterSpacing' => '0.1em',
										),
										'border'     => array(
											'color' => 'sweet-potato-option1',
											'style' => 'dashed',
										),
									),
								),
							),
							array(
								'blockName' => 'jetpack/option',
								'attrs'     => array(
									'label'     => 'Option 2',
									'textColor' => 'sweet-potato-option2',
									'style'     => array(
										'color'      => array(
											'background' => 'sweet-potato-option2',
										),
										'typography' => array(
											'fontSize'   => '22px',
											'fontWeight' => 'normal',
										),
										'border'     => array(
											'color' => 'sweet-potato-option2',
											'width' => '1px',
											'style' => 'gotted',
										),
									),
								),
							),
						),
					),
				),
				'type'         => 'checkbox-multiple',
			),
		);
	}
}
