<?php
/**
 * Unit Tests for Util.
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
	 * Moved from Contact_Form_Test.php.
	 */
	public function test_grunion_contact_form_apply_block_attribute_with_surrounding_blocks() {
		// No contact form block.
		$original = <<<'EOT'
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
EOT;
		$expected = <<<'EOT'
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
EOT;
		$this->assertEquals(
			$expected,
			Util::grunion_contact_form_apply_block_attribute( $original, array( 'foo' => 'bar' ) )
		);
		// Contact form block without attributes.
		$original = <<<'EOT'
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
EOT;
		$expected = <<<'EOT'
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
EOT;
		$this->assertEquals(
			$expected,
			Util::grunion_contact_form_apply_block_attribute( $original, array( 'foo' => 'bar' ) )
		);
		// Contact form block with attributes.
		$original = <<<'EOT'
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
EOT;
		$expected = <<<'EOT'
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
EOT;
		$this->assertEquals(
			$expected,
			Util::grunion_contact_form_apply_block_attribute( $original, array( 'foo' => 'bar' ) )
		);

		// Check that the function return null if the function gets null.
		$this->assertNull(
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal
			Util::grunion_contact_form_apply_block_attribute( null, array( 'foo' => 'bar' ) )
		);

		// Check that the function returns an array if the function gets an empty array.
		$this->assertEquals(
			array(), // @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal
			Util::grunion_contact_form_apply_block_attribute( array(), array( 'foo' => 'bar' ) )
		);
	}
}
