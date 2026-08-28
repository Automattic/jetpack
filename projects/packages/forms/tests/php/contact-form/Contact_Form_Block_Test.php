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
	 * The value a Button block inside a form falls back to.
	 */
	public function test_submit_button_element_is_a_submit_button() {
		$this->assertSame( 'button', Contact_Form_Block::submit_button_element() );
	}

	/**
	 * Rendering a form makes element-less Button blocks default to `button`, so the
	 * form can actually be submitted.
	 */
	public function test_pre_render_contact_form_defaults_buttons_to_submit() {
		$this->assertSame(
			'a',
			apply_filters( 'jetpack_button_default_element', 'a' ),
			'The Button block default should be untouched before a form renders.'
		);

		Contact_Form_Block::pre_render_contact_form(
			null,
			array(
				'blockName'   => 'jetpack/contact-form',
				'attrs'       => array(),
				'innerBlocks' => array(),
			)
		);

		$this->assertSame( 'button', apply_filters( 'jetpack_button_default_element', 'a' ) );

		remove_filter( 'jetpack_button_default_element', array( Contact_Form_Block::class, 'submit_button_element' ) );
	}

	/**
	 * The default only applies while the form renders — a Button elsewhere on the page
	 * is not a submit button and must keep the block's own `a` fallback.
	 */
	public function test_gutenblock_render_form_restores_the_button_default() {
		Contact_Form_Block::pre_render_contact_form(
			null,
			array(
				'blockName'   => 'jetpack/contact-form',
				'attrs'       => array(),
				'innerBlocks' => array(),
			)
		);
		$this->assertSame( 'button', apply_filters( 'jetpack_button_default_element', 'a' ) );

		Contact_Form_Block::gutenblock_render_form( array(), '' );

		$this->assertSame( 'a', apply_filters( 'jetpack_button_default_element', 'a' ) );
		$this->assertFalse(
			has_filter( 'jetpack_button_default_element', array( Contact_Form_Block::class, 'submit_button_element' ) )
		);
	}

	/**
	 * When another pre_render_block callback has already short-circuited the form, our
	 * render callback never runs to remove the filter — so it must not be attached at
	 * all, or every later Button block in the request would turn into a submit button.
	 */
	public function test_pre_render_contact_form_leaves_the_default_alone_when_short_circuited() {
		Contact_Form_Block::pre_render_contact_form(
			'<div>rendered by someone else</div>',
			array(
				'blockName'   => 'jetpack/contact-form',
				'attrs'       => array(),
				'innerBlocks' => array(),
			)
		);

		$this->assertSame( 'a', apply_filters( 'jetpack_button_default_element', 'a' ) );
		$this->assertFalse(
			has_filter( 'jetpack_button_default_element', array( Contact_Form_Block::class, 'submit_button_element' ) )
		);
	}

	/**
	 * The synced (`ref`) path renders through gutenblock_render_form() itself, so it is
	 * safe to attach the filter there even when something else short-circuited the
	 * block — it is removed again by the time we return.
	 */
	public function test_pre_render_contact_form_synced_form_does_not_leak_the_filter() {
		Contact_Form_Block::pre_render_contact_form(
			'<div>rendered by someone else</div>',
			array(
				'blockName'   => 'jetpack/contact-form',
				'attrs'       => array( 'ref' => 123 ),
				'innerBlocks' => array(),
			)
		);

		// gutenblock_render_form() ran as part of the ref path and removed the filter.
		$this->assertSame( 'a', apply_filters( 'jetpack_button_default_element', 'a' ) );
	}

	/**
	 * Blocks other than the form leave the Button default alone.
	 */
	public function test_pre_render_contact_form_ignores_other_blocks() {
		Contact_Form_Block::pre_render_contact_form(
			null,
			array(
				'blockName'   => 'core/group',
				'attrs'       => array(),
				'innerBlocks' => array(),
			)
		);

		$this->assertSame( 'a', apply_filters( 'jetpack_button_default_element', 'a' ) );
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
			'jetpack/input'     => array(
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
			'jetpack/label'     => array(
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
			'jetpack/options'   => array(
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
			'jetpack/form-step' => array(
				'jetpack/form-step',
				array(
					'background' => array(
						'backgroundImage'                 => true,
						'backgroundSize'                  => true,
						'__experimentalSkipSerialization' => true,
						'__experimentalDefaultControls'   => array(
							'backgroundImage' => true,
						),
					),
					'layout'     => array(
						'default'                => array(
							'type'           => 'flex',
							'orientation'    => 'vertical',
							'justifyContent' => 'stretch',
							'flexWrap'       => 'nowrap',
						),
						'allowSwitching'         => false,
						'allowEditing'           => true,
						'allowOrientation'       => false,
						'allowJustification'     => true,
						'allowVerticalAlignment' => false,
						'allowWrap'              => false,
					),
				),
			),
			'jetpack/option'    => array(
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

		$supports = $registry->get_registered( 'jetpack/contact-form' )->supports ?? array();

		$this->assertSame(
			array(
				'backgroundImage'                 => true,
				'backgroundSize'                  => true,
				'__experimentalSkipSerialization' => true,
				'__experimentalDefaultControls'   => array(
					'backgroundImage' => true,
				),
			),
			$supports['background'],
			'Background support does not match the expected values'
		);
	}

	/**
	 * Test that ::apply_background_support puts the background on the block's own element.
	 *
	 * @dataProvider data_provider_test_apply_background_support
	 */
	#[DataProvider( 'data_provider_test_apply_background_support' )]
	public function test_apply_background_support( $atts, $expected_style, $expected_class ) {
		$html   = '<div class="wp-block-jetpack-form-step"><p>Field</p></div>';
		$result = Contact_Form_Block::apply_background_support( $html, $atts, Contact_Form_Block::STEP_BLOCK_CLASS );

		if ( null === $expected_style ) {
			$this->assertSame( $html, $result, 'HTML should be returned untouched' );
			return;
		}

		$this->assertStringContainsString( $expected_style, $result );
		$this->assertSame( $expected_class, str_contains( $result, 'has-background' ) );
	}

	/**
	 * The background goes on the element matching the target class, not on whatever tag
	 * happens to come first — a synced form can be preceded by admin-only notices.
	 */
	public function test_apply_background_support_skips_tags_before_the_block() {
		$html = '<div class="jetpack-form-status-notice">Draft</div>'
			. '<div class="jetpack-contact-form-container">'
			. '<div class="wp-block-jetpack-contact-form"><p>Field</p></div>'
			. '</div>';

		$result = Contact_Form_Block::apply_background_support(
			$html,
			array( 'style' => array( 'background' => array( 'backgroundImage' => array( 'url' => 'https://example.com/bg.jpg' ) ) ) ),
			Contact_Form_Block::FORM_BLOCK_CLASS
		);

		$tags = new \WP_HTML_Tag_Processor( $result );

		$tags->next_tag();
		$this->assertNull( $tags->get_attribute( 'style' ), 'The notice must not carry the background' );

		$tags->next_tag();
		$this->assertNull( $tags->get_attribute( 'style' ), 'The container must not carry the background' );

		$tags->next_tag();
		$this->assertTrue( $tags->has_class( Contact_Form_Block::FORM_BLOCK_CLASS ) );
		$this->assertStringContainsString( 'background-image', (string) $tags->get_attribute( 'style' ) );
	}

	/**
	 * Nothing is painted when the block's own element is absent from the output.
	 */
	public function test_apply_background_support_without_the_target_element() {
		$html = '<div class="jetpack-contact-form-container"><p>No form here</p></div>';

		$this->assertSame(
			$html,
			Contact_Form_Block::apply_background_support(
				$html,
				array( 'style' => array( 'background' => array( 'backgroundImage' => array( 'url' => 'https://example.com/bg.jpg' ) ) ) ),
				Contact_Form_Block::FORM_BLOCK_CLASS
			)
		);
	}

	/**
	 * An existing style attribute is kept, with or without a trailing semicolon.
	 *
	 * @dataProvider data_provider_test_apply_background_support_merges_styles
	 */
	#[DataProvider( 'data_provider_test_apply_background_support_merges_styles' )]
	public function test_apply_background_support_merges_existing_styles( $existing, $expected ) {
		$result = Contact_Form_Block::apply_background_support(
			'<div class="wp-block-jetpack-form-step" style="' . $existing . '"></div>',
			array( 'style' => array( 'background' => array( 'backgroundImage' => array( 'url' => 'https://example.com/bg.jpg' ) ) ) ),
			Contact_Form_Block::STEP_BLOCK_CLASS
		);

		$tags = new \WP_HTML_Tag_Processor( $result );
		$tags->next_tag();

		$this->assertSame( $expected, $tags->get_attribute( 'style' ) );
	}

	/**
	 * Data provider for test_apply_background_support_merges_existing_styles.
	 */
	public static function data_provider_test_apply_background_support_merges_styles() {
		$background = "background-image:url('https://example.com/bg.jpg');background-size:cover;";

		return array(
			'trailing semicolon'    => array( 'padding-top:10px;', 'padding-top:10px;' . $background ),
			'no trailing semicolon' => array( 'padding-top:10px', 'padding-top:10px;' . $background ),
		);
	}

	/**
	 * Position, repeat and attachment are passed through to the style engine.
	 */
	public function test_apply_background_support_passes_through_all_properties() {
		$result = Contact_Form_Block::apply_background_support(
			'<div class="wp-block-jetpack-form-step"></div>',
			array(
				'style' => array(
					'background' => array(
						'backgroundImage'      => array( 'url' => 'https://example.com/bg.jpg' ),
						'backgroundSize'       => '200px',
						'backgroundPosition'   => '25% 75%',
						'backgroundRepeat'     => 'no-repeat',
						'backgroundAttachment' => 'fixed',
					),
				),
			),
			Contact_Form_Block::STEP_BLOCK_CLASS
		);

		$this->assertStringContainsString( 'background-size:200px', $result );
		$this->assertStringContainsString( 'background-position:25% 75%', $result );
		$this->assertStringContainsString( 'background-repeat:no-repeat', $result );
		$this->assertStringContainsString( 'background-attachment:fixed', $result );
	}

	/**
	 * A URL containing brackets survives the do_shortcode() pass a step's styles still
	 * sit in front of, instead of being stripped out of the attribute along with the
	 * background — and without running the shortcode it looks like.
	 */
	public function test_apply_background_support_encodes_shortcode_brackets() {
		$result = Contact_Form_Block::apply_background_support(
			'<div class="wp-block-jetpack-form-step"></div>',
			array(
				'style' => array(
					'background' => array(
						'backgroundImage' => array( 'url' => 'https://example.com/a.png[contact-field label=pwn type=text]' ),
					),
				),
			),
			Contact_Form_Block::STEP_BLOCK_CLASS
		);

		$this->assertStringNotContainsString( '[', $result );
		$this->assertStringContainsString( '%5Bcontact-field', $result );
		$this->assertStringContainsString( 'background-image', do_shortcode( $result ) );
	}

	/**
	 * Data provider for test_apply_background_support.
	 */
	public static function data_provider_test_apply_background_support() {
		$image = array(
			'backgroundImage' => array(
				'url'    => 'https://example.com/bg.jpg',
				'source' => 'file',
			),
		);

		return array(
			'no style attribute'      => array( array(), null, false ),
			'no background image'     => array(
				array( 'style' => array( 'background' => array( 'backgroundSize' => 'cover' ) ) ),
				null,
				false,
			),
			'image defaults to cover' => array(
				array( 'style' => array( 'background' => $image ) ),
				'background-size:cover',
				true,
			),
			'contain gets centered'   => array(
				array(
					'style' => array(
						'background' => array_merge( $image, array( 'backgroundSize' => 'contain' ) ),
					),
				),
				'background-position:50% 50%',
				true,
			),
		);
	}

	/**
	 * Integration: a step renders as one element, and the background image lands on
	 * it once. The step's interactivity, its style supports and its layout all share
	 * the block's own div, so there is nothing else here for them to land on — which
	 * is the point: layout supports attach to exactly one element per block.
	 */
	public function test_step_background_lands_on_the_blocks_own_div() {
		Contact_Form_Block::register_block();
		Contact_Form_Block::register_child_blocks();

		$markup = '<!-- wp:jetpack/form-step {"style":{"background":{"backgroundImage":{"url":"https://example.com/bg.png","source":"file"}}}} -->'
			. '<div class="wp-block-jetpack-form-step"><!-- wp:jetpack/field-text {"label":"Name"} /--></div>'
			. '<!-- /wp:jetpack/form-step -->';

		$html = do_blocks( $markup );

		$this->assertSame( 1, substr_count( $html, 'background-image:' ), 'Background should be applied exactly once' );

		$tags = new \WP_HTML_Tag_Processor( $html );

		$this->assertTrue( $tags->next_tag() );
		$this->assertTrue( $tags->has_class( Contact_Form_Block::STEP_BLOCK_CLASS ), 'The step opens with the block\'s own element' );
		$this->assertTrue( $tags->has_class( 'jetpack-form-step' ), 'The same element carries the step interactivity' );
		$this->assertStringContainsString( 'background-image', (string) $tags->get_attribute( 'style' ) );
		$this->assertTrue( $tags->has_class( 'has-background' ) );

		$this->assertStringContainsString(
			'data-wp-context',
			$html,
			'The step keeps its interactivity context, which is also how the form counts its steps'
		);
	}

	/**
	 * Integration: a rendered multistep form knows how many steps it has.
	 *
	 * Nothing passes the step count from the steps to the form. The steps are already
	 * rendered by the time Contact_Form::parse() builds the form's interactivity
	 * context, so it recovers the count by matching each step's `data-wp-context` in
	 * the rendered markup. That makes the exact spelling of an attribute load-bearing
	 * for whether the form paginates at all, and the failure is silent: `maxSteps` and
	 * `currentStep` simply never reach the context, every step evaluates as current,
	 * and the whole form renders at once with dead navigation.
	 */
	public function test_multistep_form_context_counts_its_steps() {
		Contact_Form_Block::register_block();
		Contact_Form_Block::register_child_blocks();

		// The step number is a static counter, and an earlier test in this process
		// may have rendered a step of its own.
		Contact_Form_Plugin::reset_step();

		$step = function ( $label ) {
			return '<!-- wp:jetpack/form-step -->'
				. '<div class="wp-block-jetpack-form-step"><!-- wp:jetpack/field-text {"label":"' . $label . '"} /--></div>'
				. '<!-- /wp:jetpack/form-step -->';
		};

		$markup = '<!-- wp:jetpack/contact-form {"subject":"Steps","variationName":"multistep"} -->'
			. '<div class="wp-block-jetpack-contact-form">'
			. '<!-- wp:jetpack/form-step-container -->'
			. '<div class="jetpack-form-steps-wrapper"><div class="wp-block-jetpack-form-step-container">'
			. $step( 'One' ) . $step( 'Two' )
			. '</div></div>'
			. '<!-- /wp:jetpack/form-step-container -->'
			. '</div>'
			. '<!-- /wp:jetpack/contact-form -->';

		$html = do_blocks( $markup );

		$this->assertSame( 2, substr_count( $html, 'data-wp-class--is-current-step' ), 'Both steps should have rendered' );
		$this->assertStringContainsString( '"maxSteps":2', $html, 'The form context should report two steps' );
		$this->assertStringContainsString( '"isMultiStep":true', $html, 'The form should identify as multistep' );
		$this->assertStringContainsString( '"currentStep":1', $html, 'The form should start on the first step' );
	}

	/**
	 * Integration: the same for the Form block, whose render opens with the container div
	 * Contact_Form::parse() adds rather than with the block's own element.
	 */
	public function test_form_background_lands_on_the_blocks_own_div() {
		Contact_Form_Block::register_block();
		Contact_Form_Block::register_child_blocks();

		$markup = '<!-- wp:jetpack/contact-form {"style":{"background":{"backgroundImage":{"url":"https://example.com/bg.png","source":"file"}}}} -->'
			. '<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-text {"label":"Name"} /--></div>'
			. '<!-- /wp:jetpack/contact-form -->';

		$html = do_blocks( $markup );

		$this->assertStringContainsString( 'jetpack-contact-form-container', $html, 'The form should have rendered' );
		$this->assertSame( 1, substr_count( $html, 'background-image:' ), 'Background should be applied exactly once' );

		$tags = new \WP_HTML_Tag_Processor( $html );

		$this->assertTrue( $tags->next_tag( array( 'class_name' => 'jetpack-contact-form-container' ) ) );
		$this->assertNull( $tags->get_attribute( 'style' ), 'The container must not carry the background' );

		$this->assertTrue( $tags->next_tag( array( 'class_name' => Contact_Form_Block::FORM_BLOCK_CLASS ) ) );
		$this->assertStringContainsString( 'background-image', (string) $tags->get_attribute( 'style' ) );
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
