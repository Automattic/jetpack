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

	public function test_process_from_with_jwt() {
		$previous_post = $this->setup_token_test( null, 'Test User' );

		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->process_form_submission();

		$this->assertInstanceOf( WP_Error::class, $result, 'Expected a WP_Error when processing the form submission.' );
		$this->assertEquals( 'check_spam', $result->get_error_code(), 'Expected the error code to be "check_spam".' );

		$this->teardown_post_for_test( $previous_post );
	}

	public function test_process_from_with_jwt_validation_error() {
		$previous_post = $this->setup_token_test( null );

		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->process_form_submission();
		$this->assertInstanceOf( Form_Submission_Error::class, $result, 'Expected a Form_Submission_Error when processing the form submission.' );
		$this->assertEquals( 'Name field is required.', $result->get_error_message(), 'Expected the error message to be "Name field is required.".' );
		$this->assertTrue( $result->is_validation_type(), 'Expected this to be a validation error.' );

		$this->teardown_post_for_test( $previous_post );
	}

	public function test_process_from_with_fake_jwt() {
		$previous_post = $this->setup_token_test( 'fake.jwt.token' );

		$plugin = Contact_Form_Plugin::init();
		$result = $plugin->process_form_submission();

		$this->assertInstanceOf( Form_Submission_Error::class, $result, 'Expected a Form_Submission_Error when processing the form submission with invalid JWT.' );
		$this->assertEquals( 'invalid_jwt', $result->get_error_code(), 'Expected the error code to be "invalid_jwt".' );
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
			)
		);
		$post_2     = get_post( $post_id_2 );
		$post_ids[] = $post_id_2;

		$default_consent = 'No';
		$ip              = 'https://127.0.0.1';

		$country_code = null; // No country code for legacy feedback

		$this->assertEquals(
			array(

				'ID'           => array( $post_id_1, $post_id_2 ),
				'Date'         => array( $post_1->post_date, $post_2->post_date ),
				'Title'        => array( $current_post->post_title, $current_post->post_title ),
				'field_A'      => array( 'value1', 'value1' ),
				'field_B'      => array( 'value2', '' ),
				'field_C'      => array( '', 'value2' ),
				'Source'       => array( '/?p=' . $current_post->ID, '/?p=' . $current_post->ID ),
				'Consent'      => array( $default_consent, $default_consent ),
				'IP Address'   => array( $ip, $ip ),
				'Country code' => array( $country_code, $country_code ),
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

		// Verify the basic structure
		$this->assertIsArray( $result );
		$this->assertTrue( isset( $result['ID'] ) );
		$this->assertTrue( isset( $result['Date'] ) );
		$this->assertTrue( isset( $result['Title'] ) );
		$this->assertTrue( isset( $result['Source'] ) );
		$this->assertTrue( isset( $result['Consent'] ) );
		$this->assertTrue( isset( $result['IP Address'] ) );

		$equals = array(
			'Name'    => array( 'Test "Quotes" User' ),
			'Text'    => array( 'test@example.com' ),
			'Message' => array( 'Message with, commas and "quotes"' ),
			'Formula' => array( '=SUM(A1:A10)' ), // Potential CSV injection
			'Unicode' => array( 'Café naïve résumé' ),
		);

		// Each field should be an array with one entry
		$this->assertCount( 1, $result['ID'] );
		$this->assertEquals( $post_id, $result['ID'][0] );

		foreach ( $equals as $key => $value ) {
			$this->assertTrue( isset( $result[ $key ] ) );
			$this->assertCount( 1, $result[ $key ] );
			$this->assertEquals( $value, $result[ $key ] );
		}

		Utility::destroy_post_context( $current_post );
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
}
