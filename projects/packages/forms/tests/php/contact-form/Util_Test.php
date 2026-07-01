<?php
/**
 * Unit Tests for Util class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Util
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Util
 */
#[CoversClass( Util::class )]
class Util_Test extends BaseTestCase {

	/**
	 * Test that grunion_contact_form_apply_block_attribute returns non-string content unchanged.
	 */
	public function test_apply_block_attribute_with_non_string_content() {
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal
		$result = Util::grunion_contact_form_apply_block_attribute( null, array( 'test' => 'value' ) );
		$this->assertNull( $result );

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal
		$result = Util::grunion_contact_form_apply_block_attribute( array(), array( 'test' => 'value' ) );
		$this->assertEquals( array(), $result );

		// @phan-suppress-next-line PhanTypeMismatchArgument
		$result = Util::grunion_contact_form_apply_block_attribute( 123, array( 'test' => 'value' ) );
		$this->assertEquals( 123, $result );
	}

	/**
	 * Test that grunion_contact_form_apply_block_attribute returns content unchanged if no contact form block exists.
	 */
	public function test_apply_block_attribute_with_no_contact_form_block() {
		$content = '<!-- wp:paragraph --><p>Hello World</p><!-- /wp:paragraph -->';
		$result  = Util::grunion_contact_form_apply_block_attribute( $content, array( 'test' => 'value' ) );
		$this->assertEquals( $content, $result );
	}

	/**
	 * Test that grunion_contact_form_apply_block_attribute adds attributes to contact form block without existing attributes.
	 *
	 * @dataProvider provider_apply_block_attribute_scenarios
	 */
	#[DataProvider( 'provider_apply_block_attribute_scenarios' )]
	public function test_apply_block_attribute( $content, $new_attr, $expected_attrs ) {
		$result = Util::grunion_contact_form_apply_block_attribute( $content, $new_attr );

		// Parse the result to verify attributes were added
		$blocks = parse_blocks( $result );

		// Find the contact form block
		$contact_form_block = $this->find_contact_form_block( $blocks );

		$this->assertNotNull( $contact_form_block, 'Contact form block should exist in result' );

		// Verify that the new attributes were added
		foreach ( $expected_attrs as $key => $value ) {
			$this->assertArrayHasKey( $key, $contact_form_block['attrs'], "Attribute '$key' should exist" );
			$this->assertEquals( $value, $contact_form_block['attrs'][ $key ], "Attribute '$key' should have correct value" );
		}
	}

	/**
	 * Helper method to find contact form block in parsed blocks array (recursively).
	 *
	 * @param array $blocks Parsed blocks array.
	 * @return array|null Contact form block or null if not found.
	 */
	private function find_contact_form_block( $blocks ) {
		foreach ( $blocks as $block ) {
			if ( 'jetpack/contact-form' === $block['blockName'] ) {
				return $block;
			}

			// Search in inner blocks recursively
			if ( ! empty( $block['innerBlocks'] ) ) {
				$found = $this->find_contact_form_block( $block['innerBlocks'] );
				if ( $found ) {
					return $found;
				}
			}
		}
		return null;
	}

	/**
	 * Data provider for test_apply_block_attribute
	 *
	 * @return array
	 */
	public static function provider_apply_block_attribute_scenarios() {
		return array(
			'contact form without existing attributes' => array(
				'content'        => '<!-- wp:jetpack/contact-form -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name {"required":true} /-->
	<!-- wp:jetpack/field-email {"required":true} /-->
	<!-- wp:jetpack/button {"element":"button","text":"Submit"} /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'new_attr'       => array( 'widget' => 'test-widget-1' ),
				'expected_attrs' => array( 'widget' => 'test-widget-1' ),
			),
			'contact form with existing attributes'    => array(
				'content'        => '<!-- wp:jetpack/contact-form {"subject":"Test Subject"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name {"required":true} /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'new_attr'       => array( 'widget' => 'test-widget-2' ),
				'expected_attrs' => array(
					'subject' => 'Test Subject',
					'widget'  => 'test-widget-2',
				),
			),
			'multiple contact form blocks'             => array(
				'content'        => '<!-- wp:jetpack/contact-form {"subject":"Form 1"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:paragraph -->
<p>Some text</p>
<!-- /wp:paragraph -->

<!-- wp:jetpack/contact-form -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-email /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'new_attr'       => array( 'block_template' => 'canvas' ),
				'expected_attrs' => array(
					'subject'        => 'Form 1',
					'block_template' => 'canvas',
				),
			),
			'nested contact form in columns'           => array(
				'content'        => '<!-- wp:columns -->
<div class="wp-block-columns">
	<!-- wp:column -->
	<div class="wp-block-column">
		<!-- wp:jetpack/contact-form {"formTitle":"Contact Us"} -->
		<div class="wp-block-jetpack-contact-form">
			<!-- wp:jetpack/field-name /-->
		</div>
		<!-- /wp:jetpack/contact-form -->
	</div>
	<!-- /wp:column -->
</div>
<!-- /wp:columns -->',
				'new_attr'       => array( 'block_template_part' => 'footer' ),
				'expected_attrs' => array(
					'formTitle'           => 'Contact Us',
					'block_template_part' => 'footer',
				),
			),
			'contact form with complex attributes'     => array(
				'content'        => '<!-- wp:jetpack/contact-form {"subject":"RSVP","to":"test@example.com","customThankyou":"Thanks!"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'new_attr'       => array(
					'widget'         => 'widget-3',
					'block_template' => 'page',
				),
				'expected_attrs' => array(
					'subject'        => 'RSVP',
					'to'             => 'test@example.com',
					'customThankyou' => 'Thanks!',
					'widget'         => 'widget-3',
					'block_template' => 'page',
				),
			),
		);
	}

	/**
	 * Test that all contact form blocks in content get the new attributes.
	 */
	public function test_apply_block_attribute_to_multiple_forms() {
		$content = '<!-- wp:jetpack/contact-form {"subject":"Form 1"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:jetpack/contact-form {"subject":"Form 2"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-email /-->
</div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:jetpack/contact-form -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-textarea /-->
</div>
<!-- /wp:jetpack/contact-form -->';

		$result = Util::grunion_contact_form_apply_block_attribute(
			$content,
			array( 'widget' => 'test-widget' )
		);

		$blocks = parse_blocks( $result );

		// Count contact form blocks and verify they all have the new attribute
		$contact_form_count = 0;
		foreach ( $blocks as $block ) {
			if ( 'jetpack/contact-form' === $block['blockName'] ) {
				++$contact_form_count;
				$this->assertArrayHasKey( 'widget', $block['attrs'], 'Each contact form should have widget attribute' );
				$this->assertEquals( 'test-widget', $block['attrs']['widget'] );
			}
		}

		$this->assertEquals( 3, $contact_form_count, 'Should have found 3 contact form blocks' );
	}

	/**
	 * Test that existing attributes are preserved when adding new ones.
	 */
	public function test_apply_block_attribute_preserves_existing_attributes() {
		$content = '<!-- wp:jetpack/contact-form {"subject":"Contact Form","to":"admin@example.com","customThankyou":"Thank you!"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->';

		$result = Util::grunion_contact_form_apply_block_attribute(
			$content,
			array( 'block_template' => 'canvas' )
		);

		$blocks             = parse_blocks( $result );
		$contact_form_block = $blocks[0];

		// Verify all original attributes are preserved
		$this->assertEquals( 'Contact Form', $contact_form_block['attrs']['subject'] );
		$this->assertEquals( 'admin@example.com', $contact_form_block['attrs']['to'] );
		$this->assertEquals( 'Thank you!', $contact_form_block['attrs']['customThankyou'] );

		// Verify new attribute was added
		$this->assertEquals( 'canvas', $contact_form_block['attrs']['block_template'] );
	}

	/**
	 * Test that new attributes override existing ones with the same key.
	 */
	public function test_apply_block_attribute_overrides_existing_attributes() {
		$content = '<!-- wp:jetpack/contact-form {"widget":"old-widget"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->';

		$result = Util::grunion_contact_form_apply_block_attribute(
			$content,
			array( 'widget' => 'new-widget' )
		);

		$blocks             = parse_blocks( $result );
		$contact_form_block = $blocks[0];

		// Verify attribute was overridden
		$this->assertEquals( 'new-widget', $contact_form_block['attrs']['widget'] );
	}

	/**
	 * Test that malformed JSON in block attributes is handled gracefully.
	 *
	 * @dataProvider provider_malformed_json_scenarios
	 */
	#[DataProvider( 'provider_malformed_json_scenarios' )]
	public function test_apply_block_attribute_with_malformed_json( $malformed_content, $expected_behavior ) {
		$result = Util::grunion_contact_form_apply_block_attribute(
			$malformed_content,
			array( 'widget' => 'test-widget' )
		);

		$blocks = parse_blocks( $result );

		// WordPress parse_blocks() is very lenient - it will still create a block
		// even with malformed JSON. Let's verify the behavior.
		$contact_form_block = $this->find_contact_form_block( $blocks );

		if ( 'should_parse' === $expected_behavior ) {
			$this->assertNotNull( $contact_form_block, 'Block should be parsed despite malformed JSON' );

			// Check if attributes were added
			if ( isset( $contact_form_block['attrs'] ) ) {
				$this->assertArrayHasKey( 'widget', $contact_form_block['attrs'], 'Widget attribute should be added' );
			}
		} elseif ( 'should_skip' === $expected_behavior ) {
			// If the block name couldn't be determined or it's not recognized as jetpack/contact-form
			// the function should skip it
			$this->assertNull( $contact_form_block, 'Malformed block should not be recognized as contact-form' );
		}
	}

	/**
	 * Data provider for malformed JSON scenarios.
	 *
	 * @return array
	 */
	public static function provider_malformed_json_scenarios() {
		return array(
			'unclosed JSON object'               => array(
				'<!-- wp:jetpack/contact-form {"subject":"Test" -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'should_skip', // WordPress won't parse this - missing closing brace
			),
			'invalid JSON with trailing comma'   => array(
				'<!-- wp:jetpack/contact-form {"subject":"Test",} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'should_parse', // WordPress is lenient and ignores trailing commas
			),
			'JSON with unquoted keys'            => array(
				'<!-- wp:jetpack/contact-form {subject:"Test"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'should_parse', // WordPress parses this and fixes it
			),
			'JSON with single quotes'            => array(
				"<!-- wp:jetpack/contact-form {'subject':'Test'} -->
<div class=\"wp-block-jetpack-contact-form\">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->",
				'should_parse', // WordPress parses this and fixes it
			),
			'completely invalid JSON'            => array(
				'<!-- wp:jetpack/contact-form {this is not json at all} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'should_parse', // WordPress still recognizes the block name and processes it
			),
			'empty attributes object'            => array(
				'<!-- wp:jetpack/contact-form {} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'should_parse', // This is actually valid JSON
			),
			'attributes with special characters' => array(
				'<!-- wp:jetpack/contact-form {"subject":"Test\nWith\tSpecial\rChars"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->',
				'should_parse', // This is valid JSON with escaped characters
			),
		);
	}

	/**
	 * Test that the refactored method handles malformed JSON better than regex approach.
	 * This test documents the actual behavior when WordPress's parse_blocks encounters malformed JSON.
	 */
	public function test_parse_blocks_behavior_with_malformed_json() {
		// WordPress parse_blocks() is very resilient and will attempt to parse even malformed JSON
		$malformed = '<!-- wp:jetpack/contact-form {"subject":"Test", "invalid":} -->
<div class="wp-block-jetpack-contact-form"></div>
<!-- /wp:jetpack/contact-form -->';

		// First, let's see what parse_blocks does with this
		$blocks = parse_blocks( $malformed );

		// WordPress will still create a block, but attrs might be null or empty
		$this->assertNotEmpty( $blocks, 'parse_blocks should return blocks even with malformed JSON' );

		// Now let's see what our refactored method does
		$result = Util::grunion_contact_form_apply_block_attribute(
			$malformed,
			array( 'widget' => 'test-widget' )
		);

		// The method should not crash and should return a string
		$this->assertIsString( $result, 'Method should return a string even with malformed JSON' );

		// Parse the result to verify it's still valid block markup
		$result_blocks = parse_blocks( $result );
		$this->assertNotEmpty( $result_blocks, 'Result should contain parseable blocks' );
	}

	/**
	 * Test handling of extremely large attribute values.
	 */
	public function test_apply_block_attribute_with_large_content() {
		// Create a very long attribute value
		$large_value = str_repeat( 'A', 10000 );

		$content = '<!-- wp:jetpack/contact-form {"subject":"Test"} -->
<div class="wp-block-jetpack-contact-form">
	<!-- wp:jetpack/field-name /-->
</div>
<!-- /wp:jetpack/contact-form -->';

		$result = Util::grunion_contact_form_apply_block_attribute(
			$content,
			array( 'large_attr' => $large_value )
		);

		$blocks             = parse_blocks( $result );
		$contact_form_block = $blocks[0];

		// Verify the large attribute was added successfully
		$this->assertArrayHasKey( 'large_attr', $contact_form_block['attrs'] );
		$this->assertEquals( $large_value, $contact_form_block['attrs']['large_attr'] );
	}

	/**
	 * Test with comprehensive scenarios including surrounding blocks.
	 * Moved from Contact_Form_Test.php and refactored to use data provider.
	 *
	 * @dataProvider provider_apply_block_attribute_with_surrounding_blocks
	 */
	#[DataProvider( 'provider_apply_block_attribute_with_surrounding_blocks' )]
	public function test_grunion_contact_form_apply_block_attribute_with_surrounding_blocks( $original, $expected ) {
		$this->assertEquals(
			$expected,
			Util::grunion_contact_form_apply_block_attribute( $original, array( 'foo' => 'bar' ) )
		);
	}

	/**
	 * Data provider for test_grunion_contact_form_apply_block_attribute_with_surrounding_blocks.
	 *
	 * @return array
	 */
	public static function provider_apply_block_attribute_with_surrounding_blocks() {
		return array(
			'no contact form block'                       => array(
				'original' => <<<'EOT'
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT
				,
				'expected' => <<<'EOT'
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT
				,
			),
			'contact form block without attributes'       => array(
				'original' => <<<'EOT'
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:jetpack/contact-form -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-name {"label":"Single Template","required":true} /-->

<!-- wp:jetpack/field-textarea /-->

<!-- wp:jetpack/button {"element":"button","text":"Contact Us"} /--></div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT
				,
				'expected' => <<<'EOT'
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:jetpack/contact-form {"foo":"bar"} -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-name {"label":"Single Template","required":true} /-->

<!-- wp:jetpack/field-textarea /-->

<!-- wp:jetpack/button {"element":"button","text":"Contact Us"} /--></div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT
				,
			),
			'contact form block with existing attributes' => array(
				'original' => <<<'EOT'
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:jetpack/contact-form {"customThankyou":"message"} -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-name {"label":"Single Template","required":true} /-->

<!-- wp:jetpack/field-textarea /-->

<!-- wp:jetpack/button {"element":"button","text":"Contact Us"} /--></div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT
				,
				'expected' => <<<'EOT'
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:jetpack/contact-form {"customThankyou":"message","foo":"bar"} -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-name {"label":"Single Template","required":true} /-->

<!-- wp:jetpack/field-textarea /-->

<!-- wp:jetpack/button {"element":"button","text":"Contact Us"} /--></div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT
				,
			),
		);
	}

	/**
	 * Test maybe_add_colon_to_label adds colon to regular labels.
	 */
	public function test_maybe_add_colon_to_label_adds_colon() {
		$this->assertSame( 'Name:', Util::maybe_add_colon_to_label( 'Name' ) );
	}

	/**
	 * Test maybe_add_colon_to_label does not double-add colon.
	 */
	public function test_maybe_add_colon_to_label_no_double_colon() {
		$this->assertSame( 'Name:', Util::maybe_add_colon_to_label( 'Name:' ) );
	}

	/**
	 * Test maybe_add_colon_to_label preserves question mark.
	 */
	public function test_maybe_add_colon_to_label_preserves_question_mark() {
		$this->assertSame( 'How are you?', Util::maybe_add_colon_to_label( 'How are you?' ) );
	}

	/**
	 * Test maybe_add_colon_to_label strips trailing period.
	 */
	public function test_maybe_add_colon_to_label_strips_period() {
		$this->assertSame( 'I agree:', Util::maybe_add_colon_to_label( 'I agree.' ) );
	}

	/**
	 * Test maybe_add_colon_to_label handles empty string.
	 */
	public function test_maybe_add_colon_to_label_empty_string() {
		$this->assertSame( ':', Util::maybe_add_colon_to_label( '' ) );
	}

	/**
	 * Test that Util::init() sets up the expected hooks and filters.
	 *
	 * This test verifies that the Util::init() method properly registers
	 * the expected WordPress hooks and filters.
	 */
	public function test_util_init_registers_expected_hooks() {
		// Remove any existing hooks first to get a clean state
		remove_all_filters( 'template_include' );
		remove_all_actions( 'render_block_core_template_part_post' );
		remove_all_actions( 'init' );
		remove_all_actions( 'grunion_scheduled_delete' );
		remove_all_actions( 'grunion_pre_message_sent' );

		// Initialize Util
		Util::init();

		// Verify that the expected hooks are registered (has_filter/has_action return priority or false)
		$this->assertNotFalse(
			has_filter( 'template_include', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_attribute' ),
			'template_include filter should be registered'
		);

		$this->assertNotFalse(
			has_action( 'render_block_core_template_part_post', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global' ),
			'render_block_core_template_part_post action should be registered'
		);

		$this->assertNotFalse(
			has_filter( 'pre_render_block', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_suspend_block_template_id_in_post_content' ),
			'pre_render_block filter should suspend the block_template global'
		);

		$this->assertNotFalse(
			has_filter( 'render_block', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_restore_block_template_id_after_post_content' ),
			'render_block filter should restore the block_template global'
		);

		$this->assertNotFalse(
			has_action( 'init', '\Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::init' ),
			'Contact_Form_Plugin::init should be registered on init action'
		);

		$this->assertNotFalse(
			has_action( 'grunion_scheduled_delete', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_delete_old_spam' ),
			'grunion_scheduled_delete action should be registered'
		);

		$this->assertNotFalse(
			has_action( 'grunion_pre_message_sent', '\Automattic\Jetpack\Forms\ContactForm\Util::jetpack_tracks_record_grunion_pre_message_sent' ),
			'grunion_pre_message_sent action should be registered'
		);
	}

	/**
	 * Test that the post-content bracket suspends the block_template global for a
	 * core/post-content block and leaves it untouched for other blocks.
	 */
	public function test_suspend_block_template_id_only_for_post_content() {
		$GLOBALS['grunion_block_template_id'] = 'mytheme//single';

		// A non-post-content block must not touch the global.
		$ret = Util::grunion_contact_form_suspend_block_template_id_in_post_content( null, array( 'blockName' => 'core/paragraph' ) );
		$this->assertNull( $ret, 'pre_render value is returned unchanged' );
		$this->assertSame( 'mytheme//single', $GLOBALS['grunion_block_template_id'], 'Non post-content block leaves the global in place' );

		// core/post-content suspends it.
		$ret = Util::grunion_contact_form_suspend_block_template_id_in_post_content( null, array( 'blockName' => 'core/post-content' ) );
		$this->assertNull( $ret, 'pre_render value is returned unchanged' );
		$this->assertArrayNotHasKey( 'grunion_block_template_id', $GLOBALS, 'Global is suspended while post-content renders' );

		unset( $GLOBALS['grunion_block_template_id'] );
	}

	/**
	 * Test that suspending then restoring around a core/post-content block returns the global
	 * to its previous value, and that a non-post-content block does not restore.
	 */
	public function test_restore_block_template_id_after_post_content() {
		$GLOBALS['grunion_block_template_id'] = 'mytheme//single';
		$pc                                   = array( 'blockName' => 'core/post-content' );

		Util::grunion_contact_form_suspend_block_template_id_in_post_content( null, $pc );

		// A non-post-content block must not restore anything.
		Util::grunion_contact_form_restore_block_template_id_after_post_content( '', array( 'blockName' => 'core/paragraph' ) );
		$this->assertArrayNotHasKey( 'grunion_block_template_id', $GLOBALS, 'Non post-content block does not restore the global' );

		$ret = Util::grunion_contact_form_restore_block_template_id_after_post_content( 'BODY', $pc );
		$this->assertSame( 'BODY', $ret, 'Block content is returned unchanged' );
		$this->assertSame( 'mytheme//single', $GLOBALS['grunion_block_template_id'], 'Global is restored after post-content' );

		unset( $GLOBALS['grunion_block_template_id'] );
	}

	/**
	 * Test that nested core/post-content renders (e.g. a query loop) restore the OUTER value,
	 * which is the reason the suspended values are stacked rather than stored in a scalar.
	 */
	public function test_nested_post_content_restores_outer_block_template_id() {
		$GLOBALS['grunion_block_template_id'] = 'theme//tmpl';
		$pc                                   = array( 'blockName' => 'core/post-content' );

		Util::grunion_contact_form_suspend_block_template_id_in_post_content( null, $pc ); // outer
		$this->assertArrayNotHasKey( 'grunion_block_template_id', $GLOBALS, 'Outer post-content suspends the global' );

		Util::grunion_contact_form_suspend_block_template_id_in_post_content( null, $pc ); // inner (already absent)
		Util::grunion_contact_form_restore_block_template_id_after_post_content( '', $pc ); // inner: was absent, stays absent
		$this->assertArrayNotHasKey( 'grunion_block_template_id', $GLOBALS, 'Inner restore (value was absent) leaves the global absent' );

		Util::grunion_contact_form_restore_block_template_id_after_post_content( '', $pc ); // outer
		$this->assertSame( 'theme//tmpl', $GLOBALS['grunion_block_template_id'], 'Outer value is restored after nested post-content' );

		unset( $GLOBALS['grunion_block_template_id'] );
	}

	/**
	 * Test that the canvas injector marks the block_template global when (and only when) a block
	 * template is being rendered (template-canvas.php).
	 */
	public function test_set_block_template_attribute_marks_block_template_global() {
		global $_wp_current_template_content, $_wp_current_template_id;
		// The `global` declaration above defines both (null if unset), so no null-guard is needed.
		$prev_content = $_wp_current_template_content;
		$prev_id      = $_wp_current_template_id;

		$_wp_current_template_content = '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->';
		$_wp_current_template_id      = 'twentytwentyfour//single';
		unset( $GLOBALS['grunion_block_template_id'] );

		$ret = Util::grunion_contact_form_set_block_template_attribute( '/themes/x/template-canvas.php' );
		$this->assertSame( '/themes/x/template-canvas.php', $ret, 'Template path is returned unchanged' );
		$this->assertSame( 'twentytwentyfour//single', $GLOBALS['grunion_block_template_id'], 'Block template global is set while the canvas renders' );

		// A non-canvas template must not set the global.
		unset( $GLOBALS['grunion_block_template_id'] );
		Util::grunion_contact_form_set_block_template_attribute( '/themes/x/single.php' );
		$this->assertArrayNotHasKey( 'grunion_block_template_id', $GLOBALS, 'Non-canvas template does not set the global' );

		// Restore globals.
		unset( $GLOBALS['grunion_block_template_id'] );
		$_wp_current_template_content = $prev_content;
		$_wp_current_template_id      = $prev_id;
	}

	/**
	 * Test export_to_gdrive validation method with various security scenarios.
	 *
	 * This test verifies that the validate_export_to_gdrive_request method properly
	 * validates permissions and nonces.
	 */
	public function test_export_to_gdrive_security_validation() {
		$plugin        = Contact_Form_Plugin::init();
		$original_user = wp_get_current_user();

		// Test 1: User without 'export' capability should fail
		wp_set_current_user( 0 );
		$post_data = array(
			'feedback_export_nonce_gdrive' => wp_create_nonce( 'feedback_export' ),
		);
		$this->assertFalse(
			$plugin->validate_export_to_gdrive_request( $post_data ),
			'Validation should fail for user without export capability'
		);

		// Test 2: Missing nonce field should fail
		$admin_user = wp_insert_user(
			array(
				'user_login' => 'testadmin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_user );
		$post_data = array(); // No nonce field
		$this->assertFalse(
			$plugin->validate_export_to_gdrive_request( $post_data ),
			'Validation should fail when nonce field is missing'
		);

		// Test 3: Invalid nonce should fail
		$post_data = array(
			'feedback_export_nonce_gdrive' => 'invalid_nonce',
		);
		$this->assertFalse(
			$plugin->validate_export_to_gdrive_request( $post_data ),
			'Validation should fail with invalid nonce'
		);

		// Test 4: Valid user with valid nonce should pass
		$post_data = array(
			'feedback_export_nonce_gdrive' => wp_create_nonce( 'feedback_export' ),
		);
		$this->assertTrue(
			$plugin->validate_export_to_gdrive_request( $post_data ),
			'Validation should pass with valid user and nonce'
		);

		// Cleanup
		wp_set_current_user( $original_user->ID );
	}
}
