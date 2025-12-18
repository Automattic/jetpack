<?php
/**
 * Unit Tests for Contact_Form_Block.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Block;
use WP_Block_Type_Registry;

/**
 * Test class for Contact_Form_Block
 *
 * @covers \Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block
 */
#[CoversClass( \Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block::class )]
class Contact_Form_Block_Test extends BaseTestCase {
	/**
	 * Test that ::find_nested_html_block works correctly.
	 */
	public function test_find_nested_html_block() {
		$block = array(
			'blockName'   => 'core/html',
			'attrs'       => array(),
			'innerBlocks' => array(),
		);

		$parent_block = array(
			'blockName' => 'jetpack/contact-form',
		);

		$expected_block = array_merge( $block, array( 'hasJPFormParent' => true ) );

		$this->assertEquals( $expected_block, Contact_Form_Block::find_nested_html_block( $block, array(), new WP_Block( $parent_block ) ) );
	}

	/**
	 * Test that we're registering inner block types via ::register_child_blocks.
	 *
	 * @dataProvider data_provider_test_register_child_blocks
	 */
	#[DataProvider( 'data_provider_test_register_child_blocks' )]
	public function test_register_child_blocks( $block_name, $expected_supports = array() ) {
		Contact_Form_Block::register_child_blocks();
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $block_name );
		$this->assertNotNull( $block_type );

		// Test block supports if provided
		if ( ! empty( $expected_supports ) ) {
			$this->assertSame( $expected_supports, $block_type->supports, 'Block supports do not match expected values' );
		}
	}

	/**
	 * Data provider for test_register_child_blocks.
	 */
	public static function data_provider_test_register_child_blocks() {
		return array(
			'jetpack/input'   => array(
				'jetpack/input',
				array(
					'__experimentalBorder' => array(
						'color'  => true,
						'radius' => true,
						'style'  => true,
						'width'  => true,
					),
					'color'                => array(
						'text'       => true,
						'background' => true,
						'gradients'  => false,
					),
					'typography'           => array(
						'fontSize'                     => true,
						'lineHeight'                   => true,
						'__experimentalFontFamily'     => true,
						'__experimentalFontWeight'     => true,
						'__experimentalFontStyle'      => true,
						'__experimentalTextTransform'  => true,
						'__experimentalTextDecoration' => true,
						'__experimentalLetterSpacing'  => true,
					),
				),
			),
			'jetpack/label'   => array(
				'jetpack/label',
				array(
					'color'           => array(
						'text'       => true,
						'background' => false,
						'gradients'  => false,
					),
					'typography'      => array(
						'fontSize'                     => true,
						'lineHeight'                   => true,
						'__experimentalFontFamily'     => true,
						'__experimentalFontWeight'     => true,
						'__experimentalFontStyle'      => true,
						'__experimentalTextTransform'  => true,
						'__experimentalTextDecoration' => true,
						'__experimentalLetterSpacing'  => true,
					),
					'blockVisibility' => true,
				),
			),
			'jetpack/options' => array(
				'jetpack/options',
				array(
					'__experimentalBorder' => array(
						'color'  => true,
						'radius' => true,
						'style'  => true,
						'width'  => true,
					),
					'color'                => array(
						'text'       => false,
						'background' => true,
					),
					'spacing'              => array(
						'blockGap' => false,
					),
				),
			),
			'jetpack/option'  => array(
				'jetpack/option',
				array(
					'color'      => array(
						'text'       => true,
						'background' => false,
						'gradients'  => false,
					),
					'typography' => array(
						'fontSize'                     => true,
						'lineHeight'                   => true,
						'__experimentalFontFamily'     => true,
						'__experimentalFontWeight'     => true,
						'__experimentalFontStyle'      => true,
						'__experimentalTextTransform'  => true,
						'__experimentalTextDecoration' => true,
						'__experimentalLetterSpacing'  => true,
					),
				),
			),
		);
	}

	/**
	 * Test that ::render_wrapped_html_block wraps HTML blocks with jetpack form parent.
	 */
	public function test_render_wrapped_html_block() {
		$content = '<p>Some HTML content</p>';

		// Test with hasJPFormParent flag
		$parsed_block_with_parent = array( 'hasJPFormParent' => true );
		$result                   = Contact_Form_Block::render_wrapped_html_block( $content, $parsed_block_with_parent );
		$this->assertEquals( '<div><p>Some HTML content</p></div>', $result );

		// Test without hasJPFormParent flag
		$parsed_block_without_parent = array();
		$result                      = Contact_Form_Block::render_wrapped_html_block( $content, $parsed_block_without_parent );
		$this->assertEquals( '<p>Some HTML content</p>', $result );

		// Test with hasJPFormParent set to false
		$parsed_block_false_parent = array( 'hasJPFormParent' => false );
		$result                    = Contact_Form_Block::render_wrapped_html_block( $content, $parsed_block_false_parent );
		$this->assertEquals( '<p>Some HTML content</p>', $result );
	}

	/**
	 * Test that ::register_feature adds multistep-form feature.
	 */
	public function test_register_feature() {
		$input_features = array( 'existing-feature' => true );

		// We can't easily mock static methods, so we'll test the structure
		$result = Contact_Form_Block::register_feature( $input_features );

		// Should preserve existing features
		$this->assertTrue( $result['existing-feature'] );

		// Should add multistep-form feature
		$this->assertArrayHasKey( 'multistep-form', $result );
		$this->assertIsBool( $result['multistep-form'] );
	}

	/**
	 * Test form step counting functionality.
	 *
	 * @dataProvider data_provider_test_form_step_counting
	 */
	#[DataProvider( 'data_provider_test_form_step_counting' )]
	public function test_form_step_counting( $block_structure, $expected_steps ) {
		// Use reflection to access private method
		$reflection   = new \ReflectionClass( Contact_Form_Block::class );
		$count_method = $reflection->getMethod( 'count_form_steps_in_block' );
		if ( PHP_VERSION_ID < 80100 ) {
			$count_method->setAccessible( true );
		}

		$result = $count_method->invoke( null, $block_structure );
		$this->assertEquals( $expected_steps, $result );
	}

	/**
	 * Data provider for form step counting tests.
	 */
	public static function data_provider_test_form_step_counting() {
		return array(
			'no inner blocks'                => array(
				array(
					'blockName'   => 'jetpack/contact-form',
					'innerBlocks' => array(),
				),
				0,
			),
			'single form step'               => array(
				array(
					'blockName'   => 'jetpack/contact-form',
					'innerBlocks' => array(
						array(
							'blockName'   => 'jetpack/form-step',
							'innerBlocks' => array(),
						),
					),
				),
				1,
			),
			'multiple form steps'            => array(
				array(
					'blockName'   => 'jetpack/contact-form',
					'innerBlocks' => array(
						array(
							'blockName'   => 'jetpack/form-step',
							'innerBlocks' => array(),
						),
						array(
							'blockName'   => 'jetpack/form-step',
							'innerBlocks' => array(),
						),
						array(
							'blockName'   => 'jetpack/form-step',
							'innerBlocks' => array(),
						),
					),
				),
				3,
			),
			'nested form steps in container' => array(
				array(
					'blockName'   => 'jetpack/contact-form',
					'innerBlocks' => array(
						array(
							'blockName'   => 'jetpack/form-step-container',
							'innerBlocks' => array(
								array(
									'blockName'   => 'jetpack/form-step',
									'innerBlocks' => array(),
								),
								array(
									'blockName'   => 'jetpack/form-step',
									'innerBlocks' => array(),
								),
							),
						),
					),
				),
				2,
			),
			'mixed blocks with form steps'   => array(
				array(
					'blockName'   => 'jetpack/contact-form',
					'innerBlocks' => array(
						array(
							'blockName'   => 'jetpack/field-text',
							'innerBlocks' => array(),
						),
						array(
							'blockName'   => 'jetpack/form-step',
							'innerBlocks' => array(),
						),
						array(
							'blockName'   => 'jetpack/field-email',
							'innerBlocks' => array(),
						),
						array(
							'blockName'   => 'jetpack/form-step',
							'innerBlocks' => array(),
						),
					),
				),
				2,
			),
		);
	}

	/**
	 * Test pre_render_contact_form hook processing.
	 */
	public function test_pre_render_contact_form() {
		$contact_form_block = array(
			'blockName'   => 'jetpack/contact-form',
			'innerBlocks' => array(
				array(
					'blockName'   => 'jetpack/form-step',
					'innerBlocks' => array(),
				),
				array(
					'blockName'   => 'jetpack/form-step',
					'innerBlocks' => array(),
				),
			),
		);

		$other_block = array(
			'blockName'   => 'core/paragraph',
			'innerBlocks' => array(),
		);

		// Test that it returns null for non-contact-form blocks
		$result = Contact_Form_Block::pre_render_contact_form( null, $other_block );
		$this->assertNull( $result );

		// Test that it processes contact form blocks and returns null (lets normal rendering continue)
		$result = Contact_Form_Block::pre_render_contact_form( null, $contact_form_block );
		$this->assertNull( $result );

		// Test that step count is updated after processing
		$step_count = Contact_Form_Block::get_form_step_count();
		$this->assertEquals( 2, $step_count );
	}

	/**
	 * Test get_form_step_count method.
	 */
	public function test_get_form_step_count() {
		// Use reflection to set the private static property for testing
		$reflection          = new \ReflectionClass( Contact_Form_Block::class );
		$step_count_property = $reflection->getProperty( 'form_step_count' );
		if ( PHP_VERSION_ID < 80100 ) {
			$step_count_property->setAccessible( true );
		}
		$step_count_property->setValue( null, 5 );

		$result = Contact_Form_Block::get_form_step_count();
		$this->assertEquals( 5, $result );

		// Reset to default
		$step_count_property->setValue( null, 1 );
	}

	/**
	 * Test can_manage_block method behavior.
	 */
	public function test_can_manage_block() {
		// Test the filter override
		add_filter( 'jetpack_contact_form_can_manage_block', '__return_true' );
		$this->assertTrue( Contact_Form_Block::can_manage_block() );
		remove_filter( 'jetpack_contact_form_can_manage_block', '__return_true' );

		add_filter( 'jetpack_contact_form_can_manage_block', '__return_false' );

		// When not in Jetpack context (class doesn't exist), should return true
		if ( ! class_exists( 'Jetpack' ) ) {
			$this->assertTrue( Contact_Form_Block::can_manage_block() );
		}

		remove_filter( 'jetpack_contact_form_can_manage_block', '__return_false' );
	}
}
