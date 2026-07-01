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
					'visibility'           => false,
				),
			),
			'jetpack/label'   => array(
				'jetpack/label',
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
					'visibility' => true,
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
					'visibility'           => false,
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
					'visibility' => false,
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

	/**
	 * Test that register_block registers the jetpack/contact-form block type.
	 */
	public function test_register_block() {
		$registry = WP_Block_Type_Registry::get_instance();

		// Unregister if already registered from a previous test.
		if ( $registry->is_registered( 'jetpack/contact-form' ) ) {
			$registry->unregister( 'jetpack/contact-form' );
		}

		Contact_Form_Block::register_block();

		$this->assertTrue( $registry->is_registered( 'jetpack/contact-form' ) );
	}

	/**
	 * Test that maybe_register_blocks_editor_script registers a fallback
	 * jetpack-blocks-editor script when the Blocks module is inactive.
	 */
	public function test_maybe_register_blocks_editor_script_registers_fallback() {
		// Deregister the script if it exists from a previous test.
		wp_deregister_script( 'jetpack-blocks-editor' );

		$method = new \ReflectionMethod( Contact_Form_Block::class, 'maybe_register_blocks_editor_script' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( null );

		// The fallback script should now be registered.
		$this->assertTrue( wp_script_is( 'jetpack-blocks-editor', 'registered' ), 'jetpack-blocks-editor script should be registered as a fallback.' );

		// The fallback style should also be registered.
		$this->assertTrue( wp_style_is( 'jetpack-blocks-editor', 'registered' ), 'jetpack-blocks-editor style should be registered as a fallback.' );

		// Verify the localized Jetpack_Editor_Initial_State data contains expected keys.
		$scripts = wp_scripts();
		$data    = $scripts->get_data( 'jetpack-blocks-editor', 'data' );

		$this->assertNotEmpty( $data, 'jetpack-blocks-editor should have localized data.' );
		$this->assertStringContainsString( 'available_blocks', $data );
		$this->assertStringContainsString( 'contact-form', $data );
		$this->assertStringContainsString( 'modules', $data );
		$this->assertStringContainsString( 'feature_flags', $data );
	}

	/**
	 * Test that maybe_register_blocks_editor_script is a no-op when the
	 * script is already registered.
	 */
	public function test_maybe_register_blocks_editor_script_skips_when_already_registered() {
		// Pre-register the script with a known src so we can verify it was not overwritten.
		wp_deregister_script( 'jetpack-blocks-editor' );
		wp_register_script( 'jetpack-blocks-editor', 'https://example.com/original.js', array(), '1.0', true );

		$method = new \ReflectionMethod( Contact_Form_Block::class, 'maybe_register_blocks_editor_script' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( null );

		// The original registration should be untouched.
		$scripts = wp_scripts();
		$script  = $scripts->registered['jetpack-blocks-editor'];
		$this->assertSame( 'https://example.com/original.js', $script->src, 'Pre-existing script registration should not be overwritten.' );
	}

	/**
	 * Test render_email with valid attributes.
	 */
	public function test_render_email_with_valid_attributes() {
		// Create a test post to get a valid permalink
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$parsed_block = array(
			'attrs' => array(
				'className' => 'test-class',
			),
		);

		$mock_context = (object) array();

		$result = Contact_Form_Block::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<div', $result );
		$this->assertStringContainsString( '<a', $result );
		$this->assertStringContainsString( 'target="_blank"', $result );
		$this->assertStringContainsString( 'rel="noopener noreferrer"', $result );

		// Should contain the fallback text
		$this->assertStringContainsString( 'Submit a form.', $result );

		// Should contain the permalink
		$this->assertStringContainsString( get_permalink( $post_id ), $result );

		// Cleanup
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email with missing attrs.
	 */
	public function test_render_email_with_missing_attrs() {
		// Create a test post to get a valid permalink
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$mock_context = (object) array();

		// Test with missing attrs key
		$parsed_block = array();
		$result       = Contact_Form_Block::render_email( '', $parsed_block, $mock_context );

		// Should still return HTML (uses empty array as default)
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'Submit a form.', $result );

		// Cleanup
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email with empty attrs.
	 */
	public function test_render_email_with_empty_attrs() {
		// Create a test post to get a valid permalink
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$parsed_block = array(
			'attrs' => array(),
		);

		$mock_context = (object) array();

		$result = Contact_Form_Block::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content even with empty attrs
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'Submit a form.', $result );
		$this->assertStringContainsString( get_permalink( $post_id ), $result );

		// Cleanup
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that ::disable_field_visibility_support turns off the visibility
	 * support on every field, input, and choice/option block, and leaves the
	 * label and non-forms blocks untouched. See FORMS-694.
	 *
	 * @dataProvider data_disable_field_visibility_support
	 *
	 * @param string $block_name     The block name being registered.
	 * @param bool   $should_disable Whether visibility should be disabled for it.
	 */
	#[DataProvider( 'data_disable_field_visibility_support' )]
	public function test_disable_field_visibility_support( $block_name, $should_disable ) {
		$result = Contact_Form_Block::disable_field_visibility_support( array(), $block_name );

		if ( $should_disable ) {
			$this->assertArrayHasKey( 'supports', $result );
			$this->assertFalse( $result['supports']['visibility'] );
		} else {
			$this->assertArrayNotHasKey( 'supports', $result );
		}
	}

	/**
	 * Data provider for test_disable_field_visibility_support.
	 *
	 * @return array
	 */
	public static function data_disable_field_visibility_support() {
		return array(
			'field'                  => array( 'jetpack/field-name', true ),
			'field (file)'           => array( 'jetpack/field-file', true ),
			'deprecated option'      => array( 'jetpack/field-option-radio', true ),
			'standard input'         => array( 'jetpack/input', true ),
			'range input'            => array( 'jetpack/input-range', true ),
			'rating input'           => array( 'jetpack/input-rating', true ),
			'image-option input'     => array( 'jetpack/input-image-option', true ),
			'phone input'            => array( 'jetpack/phone-input', true ),
			'dropzone'               => array( 'jetpack/dropzone', true ),
			'option'                 => array( 'jetpack/option', true ),
			'options'                => array( 'jetpack/options', true ),
			'fieldset-image-options' => array( 'jetpack/fieldset-image-options', true ),
			'label (kept)'           => array( 'jetpack/label', false ),
			'non-forms block'        => array( 'core/paragraph', false ),
		);
	}

	/**
	 * Test that ::drop_field_hidden_everywhere removes a field's rendered output
	 * when it has been hidden everywhere (metadata.blockVisibility === false), and
	 * leaves it untouched for the per-viewport hide, no visibility, non-field
	 * blocks, and non-boolean values. See FORMS-694.
	 *
	 * @dataProvider data_drop_field_hidden_everywhere
	 *
	 * @param array $block        The parsed block passed to the render_block filter.
	 * @param bool  $should_drop  Whether the field output should be dropped.
	 */
	#[DataProvider( 'data_drop_field_hidden_everywhere' )]
	public function test_drop_field_hidden_everywhere( $block, $should_drop ) {
		$content = '[contact-field type="text" label="Name"/]';
		$result  = Contact_Form_Block::drop_field_hidden_everywhere( $content, $block );

		$this->assertSame( $should_drop ? '' : $content, $result );
	}

	/**
	 * Data provider for test_drop_field_hidden_everywhere.
	 *
	 * @return array
	 */
	public static function data_drop_field_hidden_everywhere() {
		$field = static function ( $block_visibility ) {
			$attrs = array();
			if ( null !== $block_visibility ) {
				$attrs['metadata'] = array( 'blockVisibility' => $block_visibility );
			}
			return array(
				'blockName' => 'jetpack/field-name',
				'attrs'     => $attrs,
			);
		};

		return array(
			'field hidden everywhere'     => array( $field( false ), true ),
			'field per-viewport hide'     => array( $field( array( 'viewport' => array( 'mobile' => false ) ) ), false ),
			'field no visibility set'     => array( $field( null ), false ),
			'field visibility true'       => array( $field( true ), false ),
			'non-field hidden everywhere' => array(
				array(
					'blockName' => 'core/paragraph',
					'attrs'     => array( 'metadata' => array( 'blockVisibility' => false ) ),
				),
				false,
			),
			'block without a name'        => array( array( 'attrs' => array() ), false ),
		);
	}

	/**
	 * Integration: confirm the render_block filter is actually wired by
	 * register_child_blocks() and drops a hidden-everywhere field in the real
	 * do_blocks() pipeline (independent of core's visibility filter), while a
	 * normal field still renders its [contact-field] shortcode. Dropping the
	 * shortcode before it reaches Contact_Form::parse() is what keeps a required
	 * hidden field from ever being validated. See FORMS-694.
	 */
	public function test_hidden_everywhere_field_is_dropped_in_do_blocks() {
		Contact_Form_Block::register_block();
		Contact_Form_Block::register_child_blocks();

		$hidden = '<!-- wp:jetpack/field-text {"label":"Hide me","required":true,"metadata":{"blockVisibility":false}} /-->';
		$shown  = '<!-- wp:jetpack/field-text {"label":"Keep me","required":true} /-->';

		// The hidden-everywhere required field produces no output — so it never
		// becomes a [contact-field] shortcode, is never parsed, and is never
		// validated (a required field that isn't in the form can't block submit).
		$this->assertSame( '', trim( do_blocks( $hidden ) ) );

		// A normal field still flattens to its shortcode.
		$this->assertStringContainsString( 'contact-field', do_blocks( $shown ) );
		$this->assertStringContainsString( 'Keep me', do_blocks( $shown ) );
	}
}
