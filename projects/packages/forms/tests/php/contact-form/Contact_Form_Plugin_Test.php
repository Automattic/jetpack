<?php
/**
 * Unit Tests for Contact_Form_Plugin.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Forms\Dashboard\Dashboard;
use Automattic\Jetpack\Menu_Badges\Notification_Counts;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Block;
use WP_Error;

// Load the Form_Submission_Error class for testing.
require_once __DIR__ . '/../../../src/contact-form/class-form-submission-error.php';

/**
 * Test class for Contact_Form_Plugin
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
 */
#[CoversClass( Contact_Form_Plugin::class )]
class Contact_Form_Plugin_Test extends BaseTestCase {

	private $get_current_user;
	/**
	 * Test that ::revert_that_print works correctly
	 *
	 * @dataProvider arrayReversals
	 */
	#[DataProvider( 'arrayReversals' )]
	public function testStaticPrintReversal( $array, $decode_html ) {
		$print = print_r( $array, true );
		$this->assertEquals( $array, Contact_Form_Plugin::reverse_that_print( $print, $decode_html ) );
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
		$expected  = '[contact-field type="checkbox-multiple" label="Choose several options" labelclasses="wp-block-jetpack-label has-text-color has-swamp-green-color" labelhiddenbyblockvisibility="" optionsclasses="wp-block-jetpack-options" options="truth,dare" optionsdata="&#091;{&quot;label&quot;:&quot;truth&quot;&#044;&quot;class&quot;:&quot;has-text-color wp-block-jetpack-option&quot;&#044;&quot;style&quot;:&quot;color:caramel; font-size:24px;&quot;}&#044;{&quot;label&quot;:&quot;dare&quot;&#044;&quot;class&quot;:&quot;has-text-color wp-block-jetpack-option&quot;&#044;&quot;style&quot;:&quot;color:gummy; font-size:24px;&quot;}&#093;" stylevariationattributes="" stylevariationclasses="" stylevariationstyles="" fieldwrapperclasses="wp-block-jetpack-field-checkbox-multiple"/]';

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
		$expected  = '[contact-field type="checkbox" label="single" optionclasses="wp-block-jetpack-option has-text-color" optionstyles="color:caramel;font-size:24px" fieldwrapperclasses="wp-block-jetpack-field-checkbox"/]';

		$this->assertEquals( $expected, $shortcode );
	}

	/**
	 * Tests that requiredText from jetpack/option block is passed through correctly in checkbox field.
	 */
	public function test_gutenblock_render_field_checkbox_with_required_text() {
		$block     = array(
			'blockName'   => 'jetpack/field-checkbox',
			'attrs'       => array(
				'required' => true,
			),
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/option',
					'attrs'     => array(
						'label'        => 'I agree to the terms',
						'isStandalone' => true,
						'requiredText' => '(must check)',
					),
				),
			),
		);
		$shortcode = Contact_Form_Plugin::gutenblock_render_field_checkbox( array(), '', new WP_Block( $block ) );
		$expected  = '[contact-field type="checkbox" label="I agree to the terms" optionclasses="wp-block-jetpack-option" requiredText="(must check)" fieldwrapperclasses="wp-block-jetpack-field-checkbox"/]';

		$this->assertEquals( $expected, $shortcode );
	}

	/**
	 * Tests the render output of gutenblock_render_field_hidden.
	 */
	public function test_gutenblock_render_field_hidden_shortcode() {
		// Test with attributes passed directly to the method
		$atts = array(
			'name'  => 'hidden_field',
			'value' => 'hidden_value',
		);

		$shortcode = Contact_Form_Plugin::gutenblock_render_field_hidden( $atts, '' );
		$expected  = '[contact-field name="hidden_field" value="hidden_value" type="hidden"/]';

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
		$expected  = '[contact-field type="text" label="Label" requiredText="Do it" labelclasses="wp-block-jetpack-label has-text-color" labelstyles="color:caramel;font-size:24px" labelhiddenbyblockvisibility="" placeholder="hi!" min="1" max="10" inputclasses="wp-block-jetpack-input has-text-color has-border-color" inputstyles="color:toot;font-size:33rem;border-color:toot;border-width:1px" stylevariationattributes="{&quot;border&quot;:{&quot;color&quot;:&quot;toot&quot;&#044;&quot;width&quot;:&quot;1px&quot;}}" stylevariationclasses=" has-border-color" stylevariationstyles="border-color:toot;border-width:1px" fieldwrapperclasses="wp-block-jetpack-field-text"/]';

		$this->assertEquals( $expected, $shortcode );
	}

	/**
	 * Tests that gutenblock_render_field_file does not wrap its output in an extra element.
	 *
	 * The file field must render like every other gutenblock_render_field_* method - the
	 * bare shortcode, with no extra wrapper. An extra wrapper demotes the field's own
	 * `.grunion-field-wrap` shell from being the contact form's direct flex child, which
	 * makes the field collapse to its content width on the front end instead of filling
	 * the form.
	 */
	public function test_gutenblock_render_field_file_has_no_extra_wrapper() {
		$block = array(
			'blockName'   => 'jetpack/field-file',
			'attrs'       => array(),
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/label',
					'attrs'     => array( 'label' => 'Upload a file' ),
				),
				array(
					'blockName' => 'jetpack/dropzone',
					'attrs'     => array(),
				),
			),
		);

		$output = Contact_Form_Plugin::gutenblock_render_field_file( array(), '', new WP_Block( $block ) );

		$this->assertStringNotContainsString( '<div class="jetpack-form-file-field">', $output );
		$this->assertStringStartsWith( '[contact-field', trim( $output ) );
		$this->assertStringContainsString( 'type="file"', $output );
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
		$expected  = '[contact-field type="radio" label="Radio gaga" labelclasses="wp-block-jetpack-label has-text-color has-turmoil-purple-color" labelhiddenbyblockvisibility="" optionsclasses="wp-block-jetpack-options" options="freddy,brian" optionsdata="&#091;{&quot;label&quot;:&quot;freddy&quot;&#044;&quot;class&quot;:&quot;has-text-color wp-block-jetpack-option&quot;&#044;&quot;style&quot;:&quot;color:reddo; font-size:24px;&quot;}&#044;{&quot;label&quot;:&quot;brian&quot;&#044;&quot;class&quot;:&quot;has-text-color wp-block-jetpack-option&quot;&#044;&quot;style&quot;:&quot;color:blueo; font-size:100rem;&quot;}&#093;" stylevariationattributes="" stylevariationclasses="" stylevariationstyles="" fieldwrapperclasses="wp-block-jetpack-field-radio"/]';

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
					'labelclasses'                 => 'wp-block-jetpack-label has-text-color has-accent-3-color',
					'labelstyles'                  => 'font-size:32px;',
					'labelhiddenbyblockvisibility' => '',
					'inputclasses'                 => 'wp-block-jetpack-input has-text-color has-background has-border-color',
					'inputstyles'                  => 'color:swamp-green;background-color:swamp-red; font-size:24px;font-style:italic;font-weight:bold;line-height:1.5;letter-spacing:0.1em; border-color:swamp-blue;border-style:dashed;border-width:1px;',
					'label'                        => 'Label and Input',
					'requiredText'                 => 'Do it',
					'placeholder'                  => 'Yo',
					'min'                          => '1',
					'max'                          => '10',
					'type'                         => 'text',
					'fieldwrapperclasses'          => 'wp-block-jetpack-field-text',
					'stylevariationclasses'        => ' has-background has-border-color',
					'stylevariationattributes'     => '{"border":{"color":"swamp-blue","width":"1px","style":"dashed"},"color":{"background":"swamp-red"}}',
					'stylevariationstyles'         => 'background-color:swamp-red; border-color:swamp-blue;border-style:dashed;border-width:1px;',
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
					'requiredText'        => null,
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
					'class'                        => 'some-custom-class',
					'labelclasses'                 => 'wp-block-jetpack-label has-text-color has-accent-3-color',
					'labelstyles'                  => 'letter-spacing:0.1em;',
					'labelhiddenbyblockvisibility' => '',
					'options'                      => 'Option 1,Option 2',
					'optionsdata'                  => '[{"label":"Option 1","class":"has-text-color has-sweet-potato-option-1-color wp-block-jetpack-option","style":"font-size:24px;font-weight:bold;line-height:1.5;letter-spacing:0.1em;"},{"label":"Option 2","class":"has-text-color has-sweet-potato-option-2-color wp-block-jetpack-option","style":"font-size:22px;font-weight:normal;"}]',
					'label'                        => 'Label multiple options',
					'type'                         => 'checkbox-multiple',
					'requiredText'                 => 'Do it again',
					'fieldwrapperclasses'          => 'wp-block-jetpack-field-checkbox-multiple is-style-button  is-style-button-wrap',
					'optionsclasses'               => 'wp-block-jetpack-options has-background',
					'optionsstyles'                => 'background-color:green-tonight; border-top-width:2px;border-top-color:terrible-red;border-top-style:solid;',
					'stylevariationclasses'        => ' has-background',
					'stylevariationattributes'     => '{"border":{"top":{"color":"terrible-red","width":"2px","style":"solid","radius":"10px"}},"color":{"background":"green-tonight"}}',
					'stylevariationstyles'         => 'background-color:green-tonight; border-top-width:2px;border-top-color:terrible-red;border-top-style:solid;',
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

	public function test_process_form_with_jwt() {
		$previous_post = $this->setup_token_test( null, 'Test User' );

		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->process_form_submission();

		$this->assertInstanceOf( WP_Error::class, $result, 'Expected a WP_Error when processing the form submission.' );
		$this->assertEquals( 'check_spam', $result->get_error_code(), 'Expected the error code to be "check_spam".' );

		$this->teardown_post_for_test( $previous_post );
	}

	public function test_process_form_with_jwt_validation_error() {
		$previous_post = $this->setup_token_test( null );

		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->process_form_submission();
		$this->assertInstanceOf( Form_Submission_Error::class, $result, 'Expected a Form_Submission_Error when processing the form submission.' );
		$this->assertEquals( 'Name field is required.', $result->get_error_message(), 'Expected the error message to be "Name field is required.".' );
		$this->assertTrue( $result->is_validation_type(), 'Expected this to be a validation error.' );

		$this->teardown_post_for_test( $previous_post );
	}

	public function test_process_form_with_fake_jwt() {
		$previous_post = $this->setup_token_test( 'fake.jwt.token' );

		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->process_form_submission();

		$this->assertInstanceOf( Form_Submission_Error::class, $result, 'Expected a Form_Submission_Error when processing the form submission with invalid JWT.' );
		$this->assertEquals( 'invalid_jwt', $result->get_error_code(), 'Expected the error code to be "invalid_jwt".' );
		$this->assertTrue( $result->is_system_type(), 'Expected this to be a system error.' );

		$this->teardown_post_for_test( $previous_post );
	}

	public function test_process_form_with_deleted_parent_post() {
		global $post;
		$previous_post = $this->setup_token_test( null, 'Test User' );
		$post_id       = $post->ID;

		// Delete the parent post after JWT is created
		wp_delete_post( $post_id, true );

		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->process_form_submission();

		$this->assertInstanceOf( Form_Submission_Error::class, $result, 'Expected a Form_Submission_Error when parent post is deleted.' );
		$this->assertEquals( 'form_unavailable', $result->get_error_code(), 'Expected the error code to be "form_unavailable".' );
		$this->assertEquals( 'This form is no longer available.', $result->get_error_message(), 'Expected appropriate error message.' );
		$this->assertTrue( $result->is_system_type(), 'Expected this to be a system error.' );

		$post = $previous_post; // Restore the previous post.
		remove_filter( 'jetpack_contact_form_is_spam', array( $this, 'return_error_for_test' ) );
		unset( $_POST['contact-form-hash'] );
		unset( $_POST['jetpack_contact_form_jwt'] );
		unset( $_POST['contact-form-id'] );
		unset( $_POST[ 'g' . $post_id . '-name' ] );
	}

	public function test_process_form_with_trashed_parent_post() {
		global $post;
		$previous_post = $this->setup_token_test( null, 'Test User' );
		$post_id       = $post->ID;

		// Move the parent post to trash after JWT is created
		wp_trash_post( $post_id );

		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->process_form_submission();

		$this->assertInstanceOf( Form_Submission_Error::class, $result, 'Expected a Form_Submission_Error when parent post is trashed.' );
		$this->assertEquals( 'form_unavailable', $result->get_error_code(), 'Expected the error code to be "form_unavailable".' );
		$this->assertEquals( 'This form is no longer available.', $result->get_error_message(), 'Expected appropriate error message.' );
		$this->assertTrue( $result->is_system_type(), 'Expected this to be a system error.' );

		$this->teardown_post_for_test( $previous_post );
	}

	private function setup_token_test( $token = null, $name = null ) {
		global $post;
		$this->get_current_user = wp_get_current_user();
		wp_set_current_user( 0 );
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Contact Form',
				'post_content' => '<!-- wp:jetpack/contact-form {"id":"test-contact-form"} /-->',
				'post_status'  => 'publish',
				'post_type'    => 'post',
			)
		);

		$previous_post = $post;
		$post          = get_post( $post_id );
		// We do this because we don't currenly have a way to prevent the redirect to happen.
		add_filter( 'jetpack_contact_form_is_spam', array( $this, 'return_error_for_test' ) );
		$form                              = new Contact_Form( array( 'to' => 'test@example.com' ), "[contact-field label='Name' type='name' required='1'/]" );
		$_POST['jetpack_contact_form_jwt'] = $token ?? $form->get_jwt();
		$_POST['contact-form-hash']        = $form->hash;
		$_POST['contact-form-id']          = $post_id;

		if ( $name ) {
			$_POST[ 'g' . $post_id . '-name' ] = $name;
		}

		return $previous_post;
	}

	private function teardown_post_for_test( $previous_post ) {
		global $post;
		wp_set_current_user( $this->get_current_user->ID );
		wp_delete_post( $post->ID, true ); // Clean up the test post.
		$post = $previous_post; // Restore the previous post.
		remove_filter( 'jetpack_contact_form_is_spam', array( $this, 'return_error_for_test' ) );
		unset( $_POST['contact-form-hash'] );
		unset( $_POST['jetpack_contact_form_jwt'] );
		unset( $_POST['contact-form-id'] );
		unset( $_POST[ 'g' . $post->ID . '-name' ] );
	}

	public function return_error_for_test() {
		return new WP_Error( 'check_spam', 'check_spam form submission.' );
	}

	public function test_export_csv_legacy_data() {
		$plugin       = Contact_Form_Plugin::init();
		$current_post = Utility::create_post_context();
		$post_ids     = array();

		$post_id_1  = Utility::create_legacy_feedback(
			array(
				'1_field_A' => 'value1',
				'2_field_B' => 'value2',
			)
		);
		$post_1     = get_post( $post_id_1 );
		$post_ids[] = $post_id_1;

		$post_id_2  = Utility::create_legacy_feedback(
			array(
				'1_field_A' => 'value1',
				'2_field_C' => 'value2',
				'3_Date'    => '2024-01-01',
			)
		);
		$post_2     = get_post( $post_id_2 );
		$post_ids[] = $post_id_2;

		$default_consent = 'No';
		$ip              = 'https://127.0.0.1';

		$country_code = null; // No country code for legacy feedback
		$prefix_meta  = ' ';
		$this->assertEquals(
			array(
				$prefix_meta . 'ID'           => array( $post_id_1, $post_id_2 ),
				$prefix_meta . 'Date'         => array( $post_1->post_date, $post_2->post_date ),
				$prefix_meta . 'Title'        => array( $current_post->post_title, $current_post->post_title ),
				'field_A'                     => array( 'value1', 'value1' ),
				'field_B'                     => array( 'value2', '' ),
				'field_C'                     => array( '', 'value2' ),
				'Date'                        => array( '', '2024-01-01' ),
				$prefix_meta . 'Source'       => array( '/?p=' . $current_post->ID, '/?p=' . $current_post->ID ),
				$prefix_meta . 'Consent'      => array( $default_consent, $default_consent ),
				$prefix_meta . 'IP Address'   => array( $ip, $ip ),
				$prefix_meta . 'Country code' => array( $country_code, $country_code ),
				$prefix_meta . 'Browser'      => array( null, null ), // No browser for legacy feedback
			),
			$plugin->get_export_feedback_data( $post_ids )
		);

		Utility::destroy_post_context( $current_post );
	}

	/**
	 * Test get_export_feedback_data with empty feedback list
	 */
	public function test_get_export_feedback_data_empty_list() {
		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->get_export_feedback_data( array() );
		$this->assertEquals( array(), $result );
	}

	/**
	 * Test get_export_feedback_data with non-existent feedback IDs
	 */
	public function test_get_export_feedback_data_invalid_ids() {
		// Test with non-existent feedback IDs
		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->get_export_feedback_data( array( 99999, 99998 ) );
		$this->assertEquals( array(), $result );
	}

	/**
	 * Test get_export_feedback_data with mixed field types
	 */
	public function test_get_export_feedback_data_mixed_fields() {
		$current_post = Utility::create_post_context();

		// Create two feedback entries with different field combinations
		$post_id_1 = Utility::create_legacy_feedback(
			array(
				'1_Name'    => 'User 1',
				'2_Message' => 'First message',
			)
		);

		$post_id_2 = Utility::create_legacy_feedback(
			array(
				'1_Name'  => 'User 2',
				'3_Phone' => '123-456-7890',
			)
		);
		$plugin    = Contact_Form_Plugin::init();
		$result    = $plugin->get_export_feedback_data( array( $post_id_1, $post_id_2 ) );

		// Verify that the result contains the expected fields
		$this->assertIsArray( $result );
		$this->assertTrue( isset( $result['Name'] ) );
		$this->assertCount( 2, $result['Name'] );
		$this->assertEquals( array( 'User 1', 'User 2' ), $result['Name'] );

		$this->assertTrue( isset( $result['Message'] ) );
		$this->assertCount( 2, $result['Message'] );
		$this->assertEquals( array( 'First message', '' ), $result['Message'] );

		$this->assertTrue( isset( $result['Phone'] ) );
		$this->assertCount( 2, $result['Phone'] );
		$this->assertEquals( array( '', '123-456-7890' ), $result['Phone'] );

		Utility::destroy_post_context( $current_post );
	}

	/**
	 * Test get_export_feedback_data with duplicate field labels (legacy format).
	 * Ensures that when the same label appears multiple times in a form response,
	 * the duplicates are incremented with "(2)", "(3)", etc.
	 */
	public function test_get_export_feedback_data_same_fields() {
		$current_post = Utility::create_post_context();

		// Create two feedback entries with duplicate "Name" fields
		$post_id_1 = Utility::create_legacy_feedback(
			array(
				'1_Name' => 'User 1',
				'2_Name' => 'First message',
			)
		);

		$post_id_2 = Utility::create_legacy_feedback(
			array(
				'1_Name' => 'User 2',
				'2_Name' => '123-456-7890',
			)
		);
		$plugin    = Contact_Form_Plugin::init();
		$result    = $plugin->get_export_feedback_data( array( $post_id_1, $post_id_2 ) );

		// Verify that the result contains the expected fields with incremented labels
		$this->assertIsArray( $result );
		$this->assertTrue( isset( $result['Name'] ), 'First Name field should exist' );
		$this->assertCount( 2, $result['Name'] );
		$this->assertEquals( array( 'User 1', 'User 2' ), $result['Name'] );

		$this->assertTrue( isset( $result['Name (2)'] ), 'Second Name field should be incremented to "Name (2)"' );
		$this->assertCount( 2, $result['Name (2)'] );
		$this->assertEquals( array( 'First message', '123-456-7890' ), $result['Name (2)'] );

		Utility::destroy_post_context( $current_post );
	}

	/**
	 * Test get_export_feedback_data returns correct structure
	 */
	public function test_get_export_feedback_data_structure() {
		$current_post = Utility::create_post_context();
		$special_data = array(
			'1_Name'    => 'Test "Quotes" User',
			'2_Text'    => 'test@example.com',
			'3_Message' => 'Message with, commas and "quotes"',
			'4_Formula' => '=SUM(A1:A10)', // Potential CSV injection
			'5_Unicode' => 'Café naïve résumé',
		);
		$post_id      = Utility::create_legacy_feedback( $special_data );
		$plugin       = Contact_Form_Plugin::init();
		$result       = $plugin->get_export_feedback_data( array( $post_id ) );

		$prefix_meta = ' ';

		// Verify the basic structure
		$this->assertIsArray( $result );
		$this->assertTrue( isset( $result[ $prefix_meta . 'ID' ] ) );
		$this->assertTrue( isset( $result[ $prefix_meta . 'Date' ] ) );
		$this->assertTrue( isset( $result[ $prefix_meta . 'Title' ] ) );
		$this->assertTrue( isset( $result[ $prefix_meta . 'Source' ] ) );
		$this->assertTrue( isset( $result[ $prefix_meta . 'Consent' ] ) );
		$this->assertTrue( isset( $result[ $prefix_meta . 'IP Address' ] ) );
		$this->assertTrue( isset( $result[ $prefix_meta . 'Browser' ] ) );
		$this->assertTrue( isset( $result[ $prefix_meta . 'Country code' ] ) );

		// check that none of the fields are null
		$fields = array_keys( $result );

		foreach ( $fields as $field ) {
			foreach ( $result[ $field ] as $index => $value ) {
				$this->assertNotNull( $value, "Field {$field}[{$index}] should not be null." );
			}
		}
		$equals = array(
			'Name'    => array( 'Test "Quotes" User' ),
			'Text'    => array( 'test@example.com' ),
			'Message' => array( 'Message with, commas and "quotes"' ),
			'Formula' => array( '=SUM(A1:A10)' ), // Potential CSV injection
			'Unicode' => array( 'Café naïve résumé' ),
		);

		// Each field should be an array with one entry
		$this->assertCount( 1, $result[ $prefix_meta . 'ID' ] );
		$this->assertEquals( $post_id, $result[ $prefix_meta . 'ID' ][0] );

		foreach ( $equals as $key => $value ) {
			$this->assertTrue( isset( $result[ $key ] ) );
			$this->assertCount( 1, $result[ $key ] );
			$this->assertEquals( $value, $result[ $key ] );
		}

		Utility::destroy_post_context( $current_post );
	}

	/**
	 * Helper: insert a v3-format feedback post, optionally flagged as a test submission.
	 *
	 * @param bool $is_test Whether to mark the feedback as a test submission.
	 * @return int The new feedback post ID.
	 */
	private function insert_v3_feedback_post( $is_test = false ) {
		$content = array(
			'subject'     => 'Test Subject',
			'ip'          => '127.0.0.1',
			'entry_title' => 'Source Post',
			'entry_page'  => 1,
			'source_id'   => 0,
			'source_type' => 'single',
			'request_url' => '',
			'fields'      => array(
				array(
					'id'    => '1_Name',
					'label' => 'Name',
					'type'  => 'text',
					'value' => $is_test ? 'Preview Tester' : 'Real User',
				),
			),
		);

		if ( $is_test ) {
			$content['is_test'] = true;
		}

		// Clear the Feedback static cache so repeat calls in one test see fresh data.
		Feedback::clear_cache();

		return wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'post_title'     => 'Preview ' . ( $is_test ? 'test' : 'real' ) . ' ' . microtime(),
				'post_content'   => wp_json_encode( $content, JSON_UNESCAPED_SLASHES ),
				'post_mime_type' => 'v3',
			)
		);
	}

	/**
	 * By default, the export excludes feedback flagged as test submissions.
	 */
	public function test_export_excludes_test_feedback_by_default() {
		$plugin  = Contact_Form_Plugin::init();
		$real_id = $this->insert_v3_feedback_post( false );
		$test_id = $this->insert_v3_feedback_post( true );

		$result = $plugin->get_export_feedback_data( array( $real_id, $test_id ) );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( ' ID', $result );
		$this->assertEquals(
			array( $real_id ),
			$result[' ID'],
			'The default export should only return the non-test feedback row.'
		);

		wp_delete_post( $real_id, true );
		wp_delete_post( $test_id, true );
	}

	/**
	 * Callers that pass an explicit selection (e.g. the dashboard's selected
	 * row IDs) include the test responses in that selection — the user
	 * deliberately picked them.
	 */
	public function test_export_includes_test_feedback_when_explicitly_requested() {
		$plugin  = Contact_Form_Plugin::init();
		$real_id = $this->insert_v3_feedback_post( false );
		$test_id = $this->insert_v3_feedback_post( true );

		$result = $plugin->get_export_feedback_data( array( $real_id, $test_id ), true );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( ' ID', $result );
		$this->assertEqualsCanonicalizing(
			array( $real_id, $test_id ),
			$result[' ID'],
			'When include_test_responses is true, both rows should be present in the export.'
		);

		wp_delete_post( $real_id, true );
		wp_delete_post( $test_id, true );
	}

	public function test_interpersonal_data_exporter() {

		$post_id = Utility::create_legacy_feedback(
			array(
				'1_field' => 'value1',
				'2_field' => 'value2',
				'3_email' => 'hello@example.com',
			)
		);

		$plugin   = Contact_Form_Plugin::init();
		$exporter = $plugin->internal_personal_data_formater( array( $post_id ) );

		$assert = array(
			'group_id'    => 'feedback',
			'group_label' => 'Feedback',
			'item_id'     => 'feedback-' . $post_id,
			'data'        => array(
				array(
					'name'  => 'Date',
					'value' => get_post_field( 'post_date', $post_id ),
				),
				array(
					'name'  => 'Source Title',
					'value' => '(deleted) Cool Post Title', // the default value in the create_legacy_feedback
				),
				array(
					'name'  => 'Source URL:',
					'value' => '',
				),
				array(
					'name'  => 'field',
					'value' => 'value1',
				),
				array(
					'name'  => 'field',
					'value' => 'value2',
				),
				array(
					'name'  => 'email',
					'value' => 'hello@example.com',
				),
				array(
					'name'  => 'Consent',
					'value' => 'No',
				),
				array(
					'name'  => 'IP Address',
					'value' => 'https://127.0.0.1',
				), // same as the default value in the create_legacy_feedback
				array(
					'name'  => 'Country code',
					'value' => null,
				), // no country code for legacy feedback
			),
		);

		$this->assertEquals(
			$assert,
			$exporter[0]
		);
		$this->assertIsArray( $exporter, 'Expected the exporter to return an array.' );
	}

	public function test_personal_data_search_filter_v2_unicode_search() {

		$email_with_emoji = 'test🎉@example.com';

		// Test the conversion function
		$plugin = Contact_Form_Plugin::init();
		$plugin->set_pde_email_address( $email_with_emoji );

		$search = '..PDE..AUTHOR EMAIL:..PDE..';
		$result = $plugin->personal_data_search_filter( $search );

		// Should search for both original AND V2 corrupted version
		$this->assertStringContainsString( $email_with_emoji, $result, 'Should search for original email' );
		$this->assertStringContainsString( 'testud83cudf89@example.com', $result, 'Should ALSO search for V2 corrupted version' );
	}

	public function test_personal_data_search_filter_includes_v2_v3_json_patterns() {
		// Test that the filter generates the correct SQL pattern for V2/V3 JSON formats
		$test_email = 'user+test@example.com'; // Email with + sign
		$plugin     = Contact_Form_Plugin::init();
		$plugin->set_pde_email_address( $test_email );

		// Call the filter with a mock search string
		$search = '..PDE..AUTHOR EMAIL:..PDE..';
		$result = $plugin->personal_data_search_filter( $search );

		// Verify JSON format pattern: \"value\":\"email
		// The pattern should contain the escaped quotes and the email
		$this->assertStringContainsString( $test_email, $result, 'Should include email address in pattern' );

		// Verify it contains multiple OR conditions (for legacy + JSON patterns)
		$or_count = substr_count( $result, ' OR ' );
		$this->assertGreaterThanOrEqual( 3, $or_count, 'Should have at least 3 OR clauses (legacy LF, legacy CR, JSON escaped, JSON unescaped)' );
		$this->assertStringContainsString( 'AND (', $result, 'Should start with AND (' );
		$this->assertStringContainsString( 'post_content LIKE', $result, 'Should include LIKE clause' );
		$this->assertStringContainsString( '\"value\":\"' . $test_email, $result, 'Should include JSON value pattern with single-escaped quotes' );
		$this->assertStringContainsString( '\\"value\\":\\"' . $test_email, $result, 'Should include JSON value pattern' );
	}

	public function test_get_unread_count_zero() {
		delete_option( 'jetpack_feedback_unread_count' );
		$this->assertIsInt( Contact_Form_Plugin::get_unread_count() );
		$this->assertGreaterThanOrEqual( 0, Contact_Form_Plugin::get_unread_count() );
	}

	public function test_get_unread_count_nonzero() {
		update_option( 'jetpack_feedback_unread_count', 5 );
		$this->assertEquals( 5, Contact_Form_Plugin::get_unread_count() );
		delete_option( 'jetpack_feedback_unread_count' );
	}

	public function test_recalculate_unread_count() {
		update_option( 'jetpack_feedback_unread_count', 5 );
		$this->assertEquals( 5, Contact_Form_Plugin::get_unread_count() );
		Contact_Form_Plugin::recalculate_unread_count();
		$this->assertSame( 0, Contact_Form_Plugin::get_unread_count() );
	}

	/**
	 * Reset the menu-badges registry before each unread_count test so entries
	 * left by other test classes in the same PHPUnit process don't leak in.
	 */
	public function setUp(): void {
		parent::setUp();
		Notification_Counts::reset();
	}

	/**
	 * Clean up the menu-badges registry and options after each unread_count test.
	 */
	public function tearDown(): void {
		Notification_Counts::reset();
		remove_filter( 'jetpack_forms_alpha', '__return_false' );
		delete_option( 'jetpack_feedback_unread_count' );
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Helper: create an admin user (with edit_pages capability) and set as current user.
	 *
	 * @return int The user ID.
	 */
	private function create_admin_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'forms_test_admin_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => 'editor', // editors have edit_pages capability.
			)
		);
		wp_set_current_user( $user_id );
		return $user_id;
	}

	/**
	 * Unread_count() should register the unread count with the central
	 * menu-badges registry, under the Forms wp-build dashboard slug (the
	 * default, since jetpack_forms_alpha defaults to true).
	 */
	public function test_unread_count_registers_with_menu_badges() {
		$this->create_admin_user();
		update_option( 'jetpack_feedback_unread_count', 3 );

		Contact_Form_Plugin::init()->unread_count();

		$this->assertSame( 3, Notification_Counts::get_for_menu( Dashboard::FORMS_WPBUILD_ADMIN_SLUG ) );
	}

	/**
	 * Unread_count() should register against the legacy ADMIN_SLUG instead when
	 * the jetpack_forms_alpha filter is disabled.
	 */
	public function test_unread_count_registers_legacy_slug_when_alpha_disabled() {
		$this->create_admin_user();
		add_filter( 'jetpack_forms_alpha', '__return_false' );
		update_option( 'jetpack_feedback_unread_count', 4 );

		Contact_Form_Plugin::init()->unread_count();

		$this->assertSame( 4, Notification_Counts::get_for_menu( Dashboard::ADMIN_SLUG ) );
		$this->assertSame( 0, Notification_Counts::get_for_menu( Dashboard::FORMS_WPBUILD_ADMIN_SLUG ) );
	}

	/**
	 * When the current user lacks edit_pages capability, unread_count() should
	 * not register anything with the menu-badges registry.
	 */
	public function test_unread_count_skips_for_user_without_edit_pages() {
		// Create a subscriber (no edit_pages capability).
		$user_id = wp_insert_user(
			array(
				'user_login' => 'forms_test_subscriber_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );
		update_option( 'jetpack_feedback_unread_count', 5 );

		Contact_Form_Plugin::init()->unread_count();

		$this->assertSame( 0, Notification_Counts::get_for_menu( Dashboard::FORMS_WPBUILD_ADMIN_SLUG ) );
	}

	/**
	 * Test has_editor_feature_flag returns true when flag is enabled
	 */
	public function test_has_editor_feature_flag_enabled() {
		add_filter(
			'jetpack_block_editor_feature_flags',
			function ( $flags ) {
				$flags['central-form-management'] = true;
				return $flags;
			}
		);

		$this->assertTrue( Contact_Form_Plugin::has_editor_feature_flag( 'central-form-management' ) );

		remove_all_filters( 'jetpack_block_editor_feature_flags' );
	}

	/**
	 * Test has_editor_feature_flag returns false when flag is disabled
	 */
	public function test_has_editor_feature_flag_disabled() {
		add_filter(
			'jetpack_block_editor_feature_flags',
			function ( $flags ) {
				$flags['central-form-management'] = false;
				return $flags;
			}
		);

		$this->assertFalse( Contact_Form_Plugin::has_editor_feature_flag( 'central-form-management' ) );

		remove_all_filters( 'jetpack_block_editor_feature_flags' );
	}

	/**
	 * Test has_editor_feature_flag returns false when flag does not exist
	 */
	public function test_has_editor_feature_flag_not_set() {
		add_filter(
			'jetpack_block_editor_feature_flags',
			function ( $flags ) {
				return $flags;
			}
		);

		$this->assertFalse( Contact_Form_Plugin::has_editor_feature_flag( 'non-existent-flag' ) );

		remove_all_filters( 'jetpack_block_editor_feature_flags' );
	}

	/**
	 * Test has_editor_feature_flag returns false when no filter is applied
	 */
	public function test_has_editor_feature_flag_no_filter() {
		$this->assertFalse( Contact_Form_Plugin::has_editor_feature_flag( 'any-flag' ) );
	}

	/**
	 * Test get_export_feedback_data with duplicate field labels and empty labels.
	 * Ensures that duplicate labels are incremented (e.g., "Name", "Name (2)", "Name (3)")
	 * and empty labels are replaced with "Field", "Field (2)", etc.
	 */
	public function test_get_export_feedback_data_duplicate_and_empty_labels() {
		global $post;
		$current_post = Utility::create_post_context();

		// Create feedback with duplicate field labels manually
		$feedback_time_1  = current_time( 'mysql' );
		$feedback_title_1 = 'Test User 1 - ' . $feedback_time_1;
		$feedback_id_1    = md5( $feedback_title_1 );

		// Create fields with duplicates and empty labels
		$fields_1 = array(
			( new Feedback_Field( '1_question', 'Question', 'Answer 1', 'text', array(), 'question' ) )->serialize(),
			( new Feedback_Field( '2_email', 'Email', 'user1@example.com', 'email', array(), 'email' ) )->serialize(),
			( new Feedback_Field( '3_question', 'Question', 'Answer 2', 'text', array(), 'question' ) )->serialize(), // Duplicate label
			( new Feedback_Field( '4_empty', '', 'Hidden value 1', 'text', array(), 'empty' ) )->serialize(), // Empty label
			( new Feedback_Field( '5_question', 'Question', 'Answer 3', 'text', array(), 'question' ) )->serialize(), // Another duplicate
			( new Feedback_Field( '6_empty', '', 'Hidden value 2', 'text', array(), 'empty' ) )->serialize(), // Another empty label
		);

		$content_1 = array(
			'subject'     => 'Test Subject',
			'ip'          => 'https://127.0.0.1',
			'entry_title' => 'Cool Post Title',
			'entry_page'  => 1,
			'fields'      => $fields_1,
		);

		$post_id_1 = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'post_title'     => addslashes( wp_kses( $feedback_title_1, array() ) ),
				'post_date'      => $feedback_time_1,
				'post_name'      => $feedback_id_1,
				'post_content'   => wp_json_encode( $content_1, JSON_UNESCAPED_SLASHES ),
				'post_mime_type' => 'v2',
				'post_parent'    => $post ? $post->ID : 0,
			)
		);

		// Create another feedback with different duplicate pattern
		$feedback_time_2  = current_time( 'mysql' );
		$feedback_title_2 = 'Test User 2 - ' . $feedback_time_2;
		$feedback_id_2    = md5( $feedback_title_2 );

		$fields_2 = array(
			( new Feedback_Field( '1_name', 'Name', 'John Doe', 'text', array(), 'name' ) )->serialize(),
			( new Feedback_Field( '2_question', 'Question', 'What is this?', 'text', array(), 'question' ) )->serialize(),
			( new Feedback_Field( '3_empty', '', 'Some data', 'text', array(), 'empty' ) )->serialize(), // Empty label
		);

		$content_2 = array(
			'subject'     => 'Test Subject 2',
			'ip'          => 'https://127.0.0.2',
			'entry_title' => 'Cool Post Title',
			'entry_page'  => 1,
			'fields'      => $fields_2,
		);

		$post_id_2 = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'post_title'     => addslashes( wp_kses( $feedback_title_2, array() ) ),
				'post_date'      => $feedback_time_2,
				'post_name'      => $feedback_id_2,
				'post_content'   => wp_json_encode( $content_2, JSON_UNESCAPED_SLASHES ),
				'post_mime_type' => 'v2',
				'post_parent'    => $post ? $post->ID : 0,
			)
		);

		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->get_export_feedback_data( array( $post_id_1, $post_id_2 ) );

		// Verify that the result contains the expected fields with incremented labels
		$this->assertIsArray( $result );

		// Check that duplicate "Question" labels are incremented
		$this->assertTrue( isset( $result['Question'] ), 'First Question field should exist' );
		$this->assertTrue( isset( $result['Question (2)'] ), 'Second Question field should be incremented' );
		$this->assertTrue( isset( $result['Question (3)'] ), 'Third Question field should be incremented' );

		// Check that empty labels are replaced with "Field" and incremented
		$this->assertTrue( isset( $result['Field'] ), 'First empty field should be "Field"' );
		$this->assertTrue( isset( $result['Field (2)'] ), 'Second empty field should be "Field (2)"' );

		// Check regular fields
		$this->assertTrue( isset( $result['Email'] ), 'Email field should exist' );
		$this->assertTrue( isset( $result['Name'] ), 'Name field should exist' );

		// Verify the data integrity - all fields should have 2 entries (one per feedback)
		$this->assertCount( 2, $result['Question'], 'Question should have 2 entries' );
		$this->assertCount( 2, $result['Question (2)'], 'Question (2) should have 2 entries' );
		$this->assertCount( 2, $result['Question (3)'], 'Question (3) should have 2 entries' );

		// Verify the actual values for the first feedback
		$this->assertEquals( 'Answer 1', $result['Question'][0], 'First Question should have correct value' );
		$this->assertEquals( 'Answer 2', $result['Question (2)'][0], 'Second Question should have correct value' );
		$this->assertEquals( 'Answer 3', $result['Question (3)'][0], 'Third Question should have correct value' );
		$this->assertEquals( 'Hidden value 1', $result['Field'][0], 'First Field should have correct value' );
		$this->assertEquals( 'Hidden value 2', $result['Field (2)'][0], 'Second Field should have correct value' );

		// Verify the second feedback has empty values for fields it doesn't have
		$this->assertEquals( 'What is this?', $result['Question'][1], 'Second feedback Question should have value' );
		$this->assertSame( '', $result['Question (2)'][1], 'Second feedback should have empty Question (2)' );
		$this->assertSame( '', $result['Question (3)'][1], 'Second feedback should have empty Question (3)' );

		Utility::destroy_post_context( $current_post );
	}

	/**
	 * Test that feedback post type supports comments
	 */
	public function test_feedback_post_type_supports_comments() {
		$this->assertTrue( post_type_supports( 'feedback', 'comments' ), 'Feedback post type should support comments' );
	}

	/**
	 * Test that feedback posts have default comment status 'open'
	 */
	public function test_feedback_default_comment_status() {
		$post_type_object = get_post_type_object( 'feedback' );
		$this->assertEquals( 'open', $post_type_object->default_comment_status, 'Feedback should have default comment status "open"' );
	}

	/**
	 * Test that non-logged-in users cannot comment on feedback
	 */
	public function test_comments_restricted_to_logged_in_users() {
		$feedback_id = wp_insert_post(
			array(
				'post_type' => 'feedback',
			)
		);

		wp_set_current_user( 0 ); // Log out

		$plugin        = Contact_Form_Plugin::init();
		$comments_open = $plugin->restrict_feedback_comments_to_logged_in( true, $feedback_id );

		$this->assertFalse( $comments_open, 'Comments should be closed for non-logged-in users on feedback posts' );
	}

	/**
	 * Test that logged-in users can comment on feedback
	 */
	public function test_logged_in_users_can_comment() {
		$feedback_id = wp_insert_post(
			array(
				'post_type' => 'feedback',
			)
		);

		$user_id = wp_insert_user(
			array(
				'user_login' => 'testuser3',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$plugin        = Contact_Form_Plugin::init();
		$comments_open = $plugin->restrict_feedback_comments_to_logged_in( true, $feedback_id );

		$this->assertTrue( $comments_open, 'Comments should be open for logged-in users on feedback posts' );
	}

	/**
	 * Test that logged-in editor can comment even when comment_status is 'closed' (read posts)
	 */
	public function test_logged_in_editor_can_comment_on_read_feedback() {
		$feedback_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'comment_status' => 'closed', // Marked as read
			)
		);

		$user_id = wp_insert_user(
			array(
				'user_login' => 'testuser2',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$plugin = Contact_Form_Plugin::init();

		// Pass false to simulate that comment_status is 'closed'
		$comments_open = $plugin->restrict_feedback_comments_to_logged_in( false, $feedback_id );

		$this->assertTrue( $comments_open, 'Comments should be open for logged-in users even when feedback is marked as read (comment_status=closed)' );
	}

	/**
	 * Test that logged-in subscribers cannot comment even when comment_status is 'closed' (read posts)
	 */
	public function test_logged_in_subscriber_cannot_comment_on_read_feedback() {
		$feedback_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'comment_status' => 'closed', // Marked as read
			)
		);

		$user_id = wp_insert_user(
			array(
				'user_login' => 'testuser1',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		$plugin = Contact_Form_Plugin::init();

		// Pass false to simulate that comment_status is 'closed'
		$comments_open = $plugin->restrict_feedback_comments_to_logged_in( false, $feedback_id );

		$this->assertFalse( $comments_open, 'Comments should be closed for logged-in subscribers when feedback is marked as read (comment_status=closed)' );
	}

	/**
	 * Test that filter doesn't affect other post types
	 */
	public function test_comment_filter_only_affects_feedback_posts() {
		$regular_post_id = wp_insert_post(
			array(
				'post_type' => 'post',
			)
		);

		wp_set_current_user( 0 ); // Log out

		$plugin        = Contact_Form_Plugin::init();
		$comments_open = $plugin->restrict_feedback_comments_to_logged_in( true, $regular_post_id );

		$this->assertTrue( $comments_open, 'Comment filter should not affect non-feedback posts' );
	}

	/**
	 * Test track_feedback_status_change sets spam meta when transitioning to spam
	 */
	public function test_track_feedback_status_change_sets_spam_meta() {
		$feedback_id = wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
			)
		);

		$post   = get_post( $feedback_id );
		$plugin = Contact_Form_Plugin::init();

		// Transition from publish to spam
		$plugin->track_feedback_status_change( 'spam', 'publish', $post );

		$spam_meta = get_post_meta( $feedback_id, '_spam_status_changed_gmt', true );
		$this->assertNotEmpty( $spam_meta, 'Spam meta should be set when transitioning to spam' );
	}

	/**
	 * Test track_feedback_status_change removes spam meta when transitioning from spam
	 */
	public function test_track_feedback_status_change_removes_spam_meta() {
		$feedback_id = wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'spam',
			)
		);

		// Set spam meta
		update_post_meta( $feedback_id, '_spam_status_changed_gmt', current_time( 'mysql', true ) );

		$post   = get_post( $feedback_id );
		$plugin = Contact_Form_Plugin::init();

		// Transition from spam to publish
		$plugin->track_feedback_status_change( 'publish', 'spam', $post );

		$spam_meta = get_post_meta( $feedback_id, '_spam_status_changed_gmt', true );
		$this->assertEmpty( $spam_meta, 'Spam meta should be removed when transitioning from spam' );
	}
	/**
	 * Helper that calls shutdown actions to simulate end of request.
	 */
	private function mock_shutdown_recalculate() {
		if ( has_action( 'shutdown', array( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin', 'recalculate_unread_count' ) ) ) {
			Contact_Form_Plugin::recalculate_unread_count();
		}
		remove_all_actions( 'shutdown' );
		remove_action( 'shutdown', array( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin', 'recalculate_unread_count' ) );
	}

	/**
	 * Test track_feedback_status_change recalculates unread count when status changes to publish
	 */
	public function test_track_feedback_status_change_recalculates_on_publish() {
		// Set initial count
		update_option( 'jetpack_feedback_unread_count', 999 );

		$feedback_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'draft',
				'comment_status' => Feedback::STATUS_UNREAD,
			)
		);

		$post   = get_post( $feedback_id );
		$plugin = Contact_Form_Plugin::init();
		// Transition from draft to publish
		$plugin->track_feedback_status_change( 'publish', 'draft', $post );
		$this->assertEquals( 10, has_action( 'shutdown', array( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin', 'recalculate_unread_count' ) ), 'Recalculate unread count should be scheduled on shutdown' );
		$this->mock_shutdown_recalculate();

		// Count should be recalculated
		$count = get_option( 'jetpack_feedback_unread_count' );
		// Since this test mocking can't do a proper recount, just check that it was reset to 0.
		$this->assertSame( 0, $count, 'Unread count should be recalculated when status changes from publish' );
	}

	/**
	 * Test track_feedback_status_change recalculates unread count when status changes from publish
	 */
	public function test_track_feedback_status_change_recalculates_on_unpublish() {
		// Set initial count
		update_option( 'jetpack_feedback_unread_count', 999 );

		$feedback_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'comment_status' => Feedback::STATUS_UNREAD,
			)
		);

		$post   = get_post( $feedback_id );
		$plugin = Contact_Form_Plugin::init();

		// Transition from publish to draft
		$plugin->track_feedback_status_change( 'draft', 'publish', $post );
		$this->assertEquals( 10, has_action( 'shutdown', array( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin', 'recalculate_unread_count' ) ), 'Recalculate unread count should be scheduled on shutdown' );
		$this->mock_shutdown_recalculate();

		// Count should be recalculated
		$count = get_option( 'jetpack_feedback_unread_count' );
		// Since this test mocking can't do a proper recount, just check that it was reset to 0.
		$this->assertSame( 0, $count, 'Unread count should be recalculated when status changes from publish' );
	}

	/**
	 * Test track_feedback_status_change does not recalculate when comment_status is read
	 */
	public function test_track_feedback_status_change_skips_recount_when_read() {
		// Set initial count
		update_option( 'jetpack_feedback_unread_count', 999 );

		$feedback_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'draft',
				'comment_status' => Feedback::STATUS_READ,
			)
		);

		$post   = get_post( $feedback_id );
		$plugin = Contact_Form_Plugin::init();

		// Transition from draft to publish
		$plugin->track_feedback_status_change( 'publish', 'draft', $post );
		$this->assertFalse( has_action( 'shutdown', array( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin', 'recalculate_unread_count' ) ), 'Recalculate unread count should be scheduled on shutdown' );
		$this->mock_shutdown_recalculate();

		// Count should NOT be recalculated
		$count = get_option( 'jetpack_feedback_unread_count' );
		$this->assertEquals( 999, $count, 'Unread count should not be recalculated when comment_status is read' );
	}

	/**
	 * Test track_feedback_status_change ignores non-feedback posts
	 */
	public function test_track_feedback_status_change_ignores_non_feedback() {
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
			)
		);

		$post   = get_post( $post_id );
		$plugin = Contact_Form_Plugin::init();

		// Transition to spam
		$plugin->track_feedback_status_change( 'spam', 'publish', $post );
		$this->assertFalse( has_action( 'shutdown', array( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin', 'recalculate_unread_count' ) ), 'Recalculate unread count should NOT be scheduled on shutdown' );
		$this->mock_shutdown_recalculate();

		// Spam meta should NOT be set for non-feedback posts
		$spam_meta = get_post_meta( $post_id, '_spam_status_changed_gmt', true );
		$this->assertEmpty( $spam_meta, 'Spam meta should not be set for non-feedback posts' );
	}

	/**
	 * Data provider for edge cache purge tests.
	 */
	public static function edge_cache_purge_cases() {
		return array(
			'published'               => array( 'publish', 'draft', Contact_Form::POST_TYPE, true ),
			'updated while published' => array( 'publish', 'publish', Contact_Form::POST_TYPE, true ),
			'unpublished'             => array( 'draft', 'publish', Contact_Form::POST_TYPE, true ),
			'non-publish transition'  => array( 'pending', 'draft', Contact_Form::POST_TYPE, false ),
			'other post type'         => array( 'publish', 'draft', 'post', false ),
		);
	}

	/**
	 * Test edge cache purge behavior on form status changes.
	 *
	 * @dataProvider edge_cache_purge_cases
	 */
	#[DataProvider( 'edge_cache_purge_cases' )]
	public function test_edge_cache_purge_on_form_status_change( $new_status, $old_status, $post_type, $expected ) {
		$post_id = wp_insert_post(
			array(
				'post_type'   => $post_type,
				'post_status' => $old_status,
			)
		);

		$post   = get_post( $post_id );
		$plugin = Contact_Form_Plugin::init();
		$purged = false;

		add_action(
			'edge_cache_purge_domain',
			function () use ( &$purged ) {
				$purged = true;
			}
		);

		$plugin->purge_edge_cache_on_form_status_change( $new_status, $old_status, $post );

		$this->assertSame( $expected, $purged );

		remove_all_actions( 'edge_cache_purge_domain' );
	}

	/**
	 * Test edge cache purge handles null post gracefully.
	 */
	public function test_no_edge_cache_purge_for_null_post() {
		$plugin = Contact_Form_Plugin::init();
		$purged = false;

		add_action(
			'edge_cache_purge_domain',
			function () use ( &$purged ) {
				$purged = true;
			}
		);

		$plugin->purge_edge_cache_on_form_status_change( 'publish', 'draft', null );

		$this->assertFalse( $purged );

		remove_all_actions( 'edge_cache_purge_domain' );
	}

	/**
	 * Test that prepare_for_akismet includes blog_lang.
	 */
	public function test_prepare_for_akismet_includes_blog_lang() {
		$plugin = Contact_Form_Plugin::init();
		$form   = array(
			'comment_author'  => 'Test',
			'comment_content' => 'Hello',
		);

		$result = $plugin->prepare_for_akismet( $form );

		$this->assertArrayHasKey( 'blog_lang', $result, 'prepare_for_akismet should include blog_lang' );
		$this->assertEquals( get_bloginfo( 'language' ), $result['blog_lang'], 'blog_lang should match site language' );
	}

	/**
	 * Test that prepare_for_akismet includes blog and other standard fields.
	 */
	public function test_prepare_for_akismet_includes_standard_fields() {
		$plugin = Contact_Form_Plugin::init();
		$form   = array(
			'comment_author'  => 'Test',
			'comment_content' => 'Hello',
		);

		$result = $plugin->prepare_for_akismet( $form );

		$expected_keys = array(
			'comment_type',
			'user_ip',
			'user_agent',
			'referrer',
			'blog',
			'blog_lang',
			'comment_date_gmt',
		);

		foreach ( $expected_keys as $key ) {
			$this->assertArrayHasKey( $key, $result, "prepare_for_akismet should include '$key'" );
		}

		$this->assertEquals( 'contact_form', $result['comment_type'] );
		$this->assertEquals( get_option( 'home' ), $result['blog'] );
	}

	/**
	 * Test that the block editor is disabled for the feedback post type.
	 */
	public function test_use_block_editor_for_post_type_feedback() {
		$plugin = Contact_Form_Plugin::init();
		$this->assertFalse( $plugin->use_block_editor_for_post_type( true, 'feedback' ) );
	}

	/**
	 * Test that the block editor is forced on for the jetpack_form post type.
	 */
	public function test_use_block_editor_for_post_type_jetpack_form() {
		$plugin = Contact_Form_Plugin::init();
		$this->assertTrue( $plugin->use_block_editor_for_post_type( false, Contact_Form::POST_TYPE ) );
	}

	/**
	 * Test that the block editor filter passes through for other post types.
	 */
	public function test_use_block_editor_for_post_type_other() {
		$plugin = Contact_Form_Plugin::init();
		$this->assertTrue( $plugin->use_block_editor_for_post_type( true, 'post' ) );
		$this->assertFalse( $plugin->use_block_editor_for_post_type( false, 'page' ) );
	}

	/**
	 * Test that the block editor is forced on for individual jetpack_form posts.
	 */
	public function test_use_block_editor_for_post_jetpack_form() {
		$plugin  = Contact_Form_Plugin::init();
		$post_id = wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_title'  => 'Test Form',
				'post_status' => 'publish',
			)
		);
		$post    = get_post( $post_id );

		$this->assertTrue( $plugin->use_block_editor_for_post( false, $post ) );
	}

	/**
	 * Test that the block editor filter passes through for non-form posts.
	 */
	public function test_use_block_editor_for_post_other() {
		$plugin  = Contact_Form_Plugin::init();
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_title'  => 'Regular Post',
				'post_status' => 'publish',
			)
		);
		$post    = get_post( $post_id );

		$this->assertTrue( $plugin->use_block_editor_for_post( true, $post ) );
		$this->assertFalse( $plugin->use_block_editor_for_post( false, $post ) );
	}

	/**
	 * Creates a user and grants the `export` cap via the `user_has_cap`
	 * filter so tests don't depend on role/option state (which WorDBless
	 * can clear between tests).
	 *
	 * Returns a cleanup closure that removes the cap filter.
	 *
	 * @param string $login The user login.
	 * @return array{0:int,1:callable} [ user_id, cleanup callback ]
	 */
	private static function create_export_capable_user( $login ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$grant   = function ( $allcaps ) {
			$allcaps['export'] = true;
			return $allcaps;
		};
		add_filter( 'user_has_cap', $grant );
		$cleanup = function () use ( $grant ) {
			remove_filter( 'user_has_cap', $grant );
		};
		return array( $user_id, $cleanup );
	}

	/**
	 * Regression test: the response export must apply the Source filter so the
	 * downloaded CSV matches the filtered inbox view — the export handler must
	 * read $_POST[source] and apply the same JOIN/WHERE the list view uses.
	 */
	public function test_export_applies_source_filter_when_source_post_param_is_set() {
		list( $admin_id, $cleanup_cap ) = self::create_export_capable_user( 'export_source_admin' );
		wp_set_current_user( $admin_id );

		$plugin = Contact_Form_Plugin::init();

		$captured_query = null;
		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) use ( &$captured_query ) {
				if ( strpos( $query, 'source_meta' ) !== false ) {
					$captured_query = $query;
				}
				return $results;
			},
			10,
			2
		);

		$nonce                                 = wp_create_nonce( 'feedback_export' );
		$_POST['feedback_export_nonce_csv']    = $nonce;
		$_REQUEST['feedback_export_nonce_csv'] = $nonce;
		$_POST['source']                       = '42';

		try {
			$plugin->get_feedback_entries_from_post();

			$this->assertNotNull( $captured_query, 'Export query should include the source filter SQL when $_POST[source] is set' );
			$this->assertStringContainsString( '_feedback_source_post_id', $captured_query, 'Export query should reference the source meta key' );
			$this->assertStringContainsString( 'source_meta.meta_value', $captured_query, 'Export query should filter by source meta value' );
			$this->assertStringContainsString( 'post_parent', $captured_query, 'Export query should include the post_parent fallback' );
		} finally {
			remove_all_filters( 'wordbless_wpdb_query_results' );
			$cleanup_cap();
			unset(
				$_POST['feedback_export_nonce_csv'],
				$_REQUEST['feedback_export_nonce_csv'],
				$_POST['source']
			);
			wp_set_current_user( 0 );
		}
	}

	/**
	 * Regression test: without `$_POST['source']`, the export must not inject
	 * source-filter SQL (so unfiltered exports stay unfiltered).
	 */
	public function test_export_without_source_post_param_does_not_include_source_sql() {
		list( $admin_id, $cleanup_cap ) = self::create_export_capable_user( 'export_no_source_admin' );
		wp_set_current_user( $admin_id );

		$plugin = Contact_Form_Plugin::init();

		$found_source_sql = false;
		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) use ( &$found_source_sql ) {
				if ( strpos( $query, 'source_meta' ) !== false ) {
					$found_source_sql = true;
				}
				return $results;
			},
			10,
			2
		);

		$nonce                                 = wp_create_nonce( 'feedback_export' );
		$_POST['feedback_export_nonce_csv']    = $nonce;
		$_REQUEST['feedback_export_nonce_csv'] = $nonce;

		try {
			$plugin->get_feedback_entries_from_post();

			$this->assertFalse( $found_source_sql, 'Export query should not include source filter SQL when $_POST[source] is absent' );
		} finally {
			remove_all_filters( 'wordbless_wpdb_query_results' );
			$cleanup_cap();
			unset(
				$_POST['feedback_export_nonce_csv'],
				$_REQUEST['feedback_export_nonce_csv']
			);
			wp_set_current_user( 0 );
		}
	}

	/**
	 * Test that ::block_attributes_to_shortcode_attributes honors the label's
	 * blockVisibility support: full-hide (blockVisibility === false) sets
	 * labelhiddenbyblockvisibility, and per-viewport hide adds the matching
	 * wp-block-hidden-{mobile,tablet,desktop} classes to the label. See FORMS-694.
	 *
	 * @dataProvider data_provider_label_block_visibility
	 *
	 * @param mixed $block_visibility   The label's metadata.blockVisibility value (null to omit).
	 * @param bool  $expected_full_hide Whether labelhiddenbyblockvisibility should be truthy.
	 * @param array $expected_hidden    The viewports expected to add a wp-block-hidden-* class.
	 */
	#[DataProvider( 'data_provider_label_block_visibility' )]
	public function test_block_attributes_to_shortcode_attributes_label_block_visibility( $block_visibility, $expected_full_hide, $expected_hidden ) {
		$label_attrs = array( 'label' => 'Name' );
		if ( null !== $block_visibility ) {
			$label_attrs['metadata'] = array( 'blockVisibility' => $block_visibility );
		}
		$block = array(
			'blockName'   => 'jetpack/field-name',
			'attrs'       => array( 'required' => false ),
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/label',
					'attrs'     => $label_attrs,
				),
			),
		);
		$atts  = Contact_Form_Plugin::block_attributes_to_shortcode_attributes( array(), 'text', new WP_Block( $block ) );

		$this->assertSame( $expected_full_hide, (bool) $atts['labelhiddenbyblockvisibility'] );

		foreach ( array( 'mobile', 'tablet', 'desktop' ) as $viewport ) {
			$class = 'wp-block-hidden-' . $viewport;
			if ( in_array( $viewport, $expected_hidden, true ) ) {
				$this->assertStringContainsString( $class, $atts['labelclasses'] );
			} else {
				$this->assertStringNotContainsString( $class, $atts['labelclasses'] );
			}
		}
	}

	/**
	 * Data provider for test_block_attributes_to_shortcode_attributes_label_block_visibility.
	 *
	 * @return array
	 */
	public static function data_provider_label_block_visibility() {
		return array(
			'no visibility set'       => array( null, false, array() ),
			'full hide (false)'       => array( false, true, array() ),
			'hide on mobile'          => array( array( 'viewport' => array( 'mobile' => false ) ), false, array( 'mobile' ) ),
			'hide on mobile + tablet' => array(
				array(
					'viewport' => array(
						'mobile' => false,
						'tablet' => false,
					),
				),
				false,
				array( 'mobile', 'tablet' ),
			),
			'viewport all visible'    => array(
				array(
					'viewport' => array(
						'mobile' => true,
						'tablet' => true,
					),
				),
				false,
				array(),
			),
		);
	}
}
