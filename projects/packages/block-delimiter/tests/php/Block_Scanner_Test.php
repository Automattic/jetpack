<?php

namespace Automattic;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Testing the Block Scanner class.
 *
 * @covers \Automattic\Block_Scanner
 */
#[CoversClass( Block_Scanner::class )]
class Block_Scanner_Test extends TestCase {

	/**
	 * Test the create method with valid input.
	 */
	public function test_create_with_valid_input(): void {
		$scanner = Block_Scanner::create( '<!-- wp:paragraph -->' );

		$this->assertInstanceOf( Block_Scanner::class, $scanner );
		$this->assertNull( $scanner->get_last_error() );
	}

	/**
	 * Test the create method with empty input.
	 */
	public function test_create_with_empty_input(): void {
		$scanner = Block_Scanner::create( '' );

		$this->assertInstanceOf( Block_Scanner::class, $scanner );
		$this->assertNull( $scanner->get_last_error() );
	}

	/**
	 * Test the next_delimiter method with valid block delimiters.
	 *
	 * @dataProvider provideValidBlockDelimiters
	 */
	#[DataProvider( 'provideValidBlockDelimiters' )]
	public function test_next_delimiter_with_valid_input( string $input, array $expected ): void {
		$scanner = Block_Scanner::create( $input );

		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( $expected['type'], $scanner->get_delimiter_type() );
		$this->assertEquals( $expected['block_type'], $scanner->get_block_type() );
		$this->assertNull( $scanner->get_last_error() );
	}

	/**
	 * Data provider for valid block delimiters.
	 */
	public static function provideValidBlockDelimiters(): array {
		return array(
			'core paragraph opener'            => array(
				'<!-- wp:paragraph -->',
				array(
					'type'       => Block_Scanner::OPENER,
					'block_type' => 'core/paragraph',
				),
			),
			'core paragraph closer'            => array(
				'<!-- /wp:paragraph -->',
				array(
					'type'       => Block_Scanner::CLOSER,
					'block_type' => 'core/paragraph',
				),
			),
			'void block'                       => array(
				'<!-- wp:separator /-->',
				array(
					'type'       => Block_Scanner::VOID,
					'block_type' => 'core/separator',
				),
			),
			'block with namespace'             => array(
				'<!-- wp:jetpack/contact-form -->',
				array(
					'type'       => Block_Scanner::OPENER,
					'block_type' => 'jetpack/contact-form',
				),
			),
			'block with attributes'            => array(
				'<!-- wp:paragraph {"align":"center"} -->',
				array(
					'type'       => Block_Scanner::OPENER,
					'block_type' => 'core/paragraph',
				),
			),
			'block with whitespace variations' => array(
				'<!--   wp:paragraph   -->',
				array(
					'type'       => Block_Scanner::OPENER,
					'block_type' => 'core/paragraph',
				),
			),
			'block with complex attributes'    => array(
				'<!-- wp:image {"url":"https://example.com/image.jpg","alt":"Test image","width":800} -->',
				array(
					'type'       => Block_Scanner::OPENER,
					'block_type' => 'core/image',
				),
			),
		);
	}

	/**
	 * Test the next_delimiter method with invalid input.
	 *
	 * @dataProvider provideInvalidBlockDelimiters
	 */
	#[DataProvider( 'provideInvalidBlockDelimiters' )]
	public function test_next_delimiter_with_invalid_input( string $input, ?string $expected_error ): void {
		$scanner = Block_Scanner::create( $input );

		$this->assertFalse( $scanner->next_delimiter() );
		$this->assertEquals( $expected_error, $scanner->get_last_error() );
	}

	/**
	 * Data provider for invalid block delimiters.
	 */
	public static function provideInvalidBlockDelimiters(): array {
		return array(
			'no block delimiter'                => array( 'Just some regular text', null ),
			'regular HTML comment'              => array( '<!-- This is a regular comment -->', null ),
			'incomplete wp prefix'              => array( '<!-- w:paragraph -->', null ),
			'no whitespace after comment start' => array( '<!--wp:paragraph -->', null ),
			'invalid block name'                => array( '<!-- wp:123invalid -->', null ),
			'empty input'                       => array( '', null ),
			'incomplete input'                  => array( '<!-- wp:paragraph', Block_Scanner::INCOMPLETE_INPUT ),
			'incomplete input with partial wp'  => array( '<!-- wp:', Block_Scanner::INCOMPLETE_INPUT ),
			'incomplete input with block name'  => array( '<!-- wp:paragraph', Block_Scanner::INCOMPLETE_INPUT ),
		);
	}

	/**
	 * Test scanning multiple delimiters.
	 */
	public function test_scan_multiple_delimiters(): void {
		$content = '<!-- wp:paragraph -->Hello<!-- /wp:paragraph --><!-- wp:separator /-->';
		$scanner = Block_Scanner::create( $content );

		// First delimiter
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( Block_Scanner::OPENER, $scanner->get_delimiter_type() );
		$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );

		// Second delimiter
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( Block_Scanner::CLOSER, $scanner->get_delimiter_type() );
		$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );

		// Third delimiter
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( Block_Scanner::VOID, $scanner->get_delimiter_type() );
		$this->assertEquals( 'core/separator', $scanner->get_block_type() );

		// No more delimiters
		$this->assertFalse( $scanner->next_delimiter() );
	}

	/**
	 * Test scanning delimiters with freeform content.
	 * Note: Freeform block scanning is not yet implemented in Block_Scanner.
	 */
	public function test_scan_delimiters_with_freeform(): void {
		$content = 'Some text<!-- wp:paragraph -->Hello<!-- /wp:paragraph -->More text';
		$scanner = Block_Scanner::create( $content );

		// Freeform blocks are not yet implemented, but next_delimiter('visit') still finds regular blocks
		// The 'visit' parameter is currently ignored, so it behaves the same as without it
		$this->assertTrue( $scanner->next_delimiter( 'visit' ) );
		$this->assertEquals( Block_Scanner::OPENER, $scanner->get_delimiter_type() );
		$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );

		// When scanning without freeform, should find the paragraph blocks
		$scanner = Block_Scanner::create( $content );
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( Block_Scanner::OPENER, $scanner->get_delimiter_type() );
		$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );
	}

	/**
	 * Test scanning delimiters with freeform content skipped.
	 */
	public function test_scan_delimiters_without_freeform(): void {
		$content = 'Some text<!-- wp:paragraph -->Hello<!-- /wp:paragraph -->More text';
		$scanner = Block_Scanner::create( $content );

		// First delimiter (paragraph opener)
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( Block_Scanner::OPENER, $scanner->get_delimiter_type() );
		$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );

		// Second delimiter (paragraph closer)
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( Block_Scanner::CLOSER, $scanner->get_delimiter_type() );
		$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );

		// No more delimiters
		$this->assertFalse( $scanner->next_delimiter() );
	}

	/**
	 * Test is_block_type method.
	 *
	 * @dataProvider provideBlockTypeChecks
	 */
	#[DataProvider( 'provideBlockTypeChecks' )]
	public function test_is_block_type( string $delimiter_content, string $check_type, bool $expected ): void {
		$scanner = Block_Scanner::create( $delimiter_content );
		$scanner->next_delimiter();

		$this->assertEquals( $expected, $scanner->is_block_type( $check_type ) );
	}

	/**
	 * Data provider for block type checks.
	 */
	public static function provideBlockTypeChecks(): array {
		return array(
			'core paragraph with short name'           => array(
				'<!-- wp:paragraph -->',
				'paragraph',
				true,
			),
			'core paragraph with full name'            => array(
				'<!-- wp:paragraph -->',
				'core/paragraph',
				true,
			),
			'wrong block type'                         => array(
				'<!-- wp:paragraph -->',
				'heading',
				false,
			),
			'namespaced block correct'                 => array(
				'<!-- wp:jetpack/contact-form -->',
				'jetpack/contact-form',
				true,
			),
			'namespaced block wrong namespace'         => array(
				'<!-- wp:jetpack/contact-form -->',
				'core/contact-form',
				false,
			),
			'namespaced block short name'              => array(
				'<!-- wp:jetpack/contact-form -->',
				'contact-form',
				false,
			),
			'core separator with short name'           => array(
				'<!-- wp:separator /-->',
				'separator',
				true,
			),
			'core separator with full name'            => array(
				'<!-- wp:separator /-->',
				'core/separator',
				true,
			),
			'core block wrong short name'              => array(
				'<!-- wp:paragraph -->',
				'separator',
				false,
			),
			'non-core namespace with short name fails' => array(
				'<!-- wp:jetpack/contact-form -->',
				'jetpack',
				false,
			),
		);
	}

	/**
	 * Test is_block_type method with freeform blocks.
	 * Note: Freeform block scanning is not yet implemented in Block_Scanner.
	 */
	public function test_is_block_type_freeform(): void {
		$content = 'Some freeform text<!-- wp:paragraph -->block content<!-- /wp:paragraph -->More freeform text';
		$scanner = Block_Scanner::create( $content );

		// Freeform blocks are not yet implemented, so we can't test them directly
		// Instead, test that the scanner correctly identifies regular blocks
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );
		$this->assertTrue( $scanner->is_block_type( 'paragraph' ) );
		$this->assertTrue( $scanner->is_block_type( 'core/paragraph' ) );
	}

	/**
	 * Test get_delimiter_type method.
	 *
	 * @dataProvider provideDelimiterTypes
	 */
	#[DataProvider( 'provideDelimiterTypes' )]
	public function test_get_delimiter_type( string $delimiter_content, string $expected_type ): void {
		$scanner = Block_Scanner::create( $delimiter_content );
		$scanner->next_delimiter();

		$this->assertEquals( $expected_type, $scanner->get_delimiter_type() );
	}

	/**
	 * Data provider for delimiter types.
	 */
	public static function provideDelimiterTypes(): array {
		return array(
			'opener' => array( '<!-- wp:paragraph -->', Block_Scanner::OPENER ),
			'closer' => array( '<!-- /wp:paragraph -->', Block_Scanner::CLOSER ),
			'void'   => array( '<!-- wp:separator /-->', Block_Scanner::VOID ),
		);
	}

	/**
	 * Test has_void_flag method.
	 *
	 * @dataProvider provideVoidFlagTests
	 */
	#[DataProvider( 'provideVoidFlagTests' )]
	public function test_has_void_flag( string $delimiter_content, bool $expected ): void {
		$scanner = Block_Scanner::create( $delimiter_content );
		$scanner->next_delimiter();

		$this->assertEquals( $expected, $scanner->has_void_flag() );
	}

	/**
	 * Data provider for void flag tests.
	 */
	public static function provideVoidFlagTests(): array {
		return array(
			'opener without void flag'        => array( '<!-- wp:paragraph -->', false ),
			'closer without void flag'        => array( '<!-- /wp:paragraph -->', false ),
			'void block with flag'            => array( '<!-- wp:separator /-->', true ),
			'closer with erroneous void flag' => array( '<!-- /wp:paragraph /-->', true ),
		);
	}

	/**
	 * Test get_block_type method.
	 *
	 * @dataProvider provideBlockTypeReturns
	 */
	#[DataProvider( 'provideBlockTypeReturns' )]
	public function test_get_block_type( string $delimiter_content, string $expected ): void {
		$scanner = Block_Scanner::create( $delimiter_content );
		$scanner->next_delimiter();

		$this->assertEquals( $expected, $scanner->get_block_type() );
	}

	/**
	 * Data provider for block type returns.
	 */
	public static function provideBlockTypeReturns(): array {
		return array(
			'core paragraph'   => array( '<!-- wp:paragraph -->', 'core/paragraph' ),
			'core separator'   => array( '<!-- wp:separator /-->', 'core/separator' ),
			'namespaced block' => array( '<!-- wp:jetpack/contact-form -->', 'jetpack/contact-form' ),
		);
	}

	/**
	 * Test allocate_and_return_parsed_attributes method.
	 *
	 * @dataProvider provideAttributeTests
	 */
	#[DataProvider( 'provideAttributeTests' )]
	public function test_allocate_and_return_parsed_attributes( string $delimiter_content, ?array $expected, int $expected_json_error ): void {
		$scanner = Block_Scanner::create( $delimiter_content );
		$scanner->next_delimiter();

		$attributes = $scanner->allocate_and_return_parsed_attributes();

		$this->assertEquals( $expected, $attributes );
		$this->assertEquals( $expected_json_error, $scanner->get_last_json_error() );
	}

	/**
	 * Data provider for attribute tests.
	 */
	public static function provideAttributeTests(): array {
		return array(
			'no attributes'                       => array(
				'<!-- wp:paragraph -->',
				null,
				JSON_ERROR_NONE,
			),
			'empty attributes'                    => array(
				'<!-- wp:paragraph {} -->',
				array(),
				JSON_ERROR_NONE,
			),
			'valid attributes'                    => array(
				'<!-- wp:paragraph {"align":"center","dropCap":true} -->',
				array(
					'align'   => 'center',
					'dropCap' => true,
				),
				JSON_ERROR_NONE,
			),
			'invalid JSON'                        => array(
				'<!-- wp:paragraph {"align":} -->',
				null,
				JSON_ERROR_SYNTAX,
			),
			'closer with attributes returns null' => array(
				'<!-- /wp:paragraph {"align":"center"} -->',
				null,
				JSON_ERROR_NONE,
			),
			'void block with attributes'          => array(
				'<!-- wp:separator {"color":"black"} /-->',
				array(
					'color' => 'black',
				),
				JSON_ERROR_NONE,
			),
		);
	}

	/**
	 * Test get_span method.
	 */
	public function test_get_span(): void {
		$content = '<!-- wp:paragraph -->';
		$scanner = Block_Scanner::create( $content );

		// Before next_delimiter, should return a span with length 0
		$span = $scanner->get_span();
		$this->assertInstanceOf( \WP_HTML_Span::class, $span );
		$this->assertSame( 0, $span->length );

		// After next_delimiter, should return a span with actual length
		$scanner->next_delimiter();
		$span = $scanner->get_span();

		$this->assertInstanceOf( \WP_HTML_Span::class, $span );
		$this->assertSame( 0, $span->start );
		$this->assertEquals( 21, $span->length );
	}

	/**
	 * Test get_span with freeform blocks.
	 * Note: Freeform block scanning is not yet implemented in Block_Scanner.
	 */
	public function test_get_span_freeform(): void {
		$content = 'Some text';
		$scanner = Block_Scanner::create( $content );

		// Freeform blocks are not yet implemented, so next_delimiter should return false
		$this->assertFalse( $scanner->next_delimiter( 'visit' ) );
		// get_span() always returns a WP_HTML_Span object, even when no delimiter is found
		$span = $scanner->get_span();
		$this->assertInstanceOf( \WP_HTML_Span::class, $span );
		$this->assertSame( 0, $span->length );
	}

	/**
	 * Test opens_block method.
	 *
	 * @dataProvider provideOpensBlockTests
	 */
	#[DataProvider( 'provideOpensBlockTests' )]
	public function test_opens_block( string $delimiter_content, array $block_types, bool $expected ): void {
		$scanner = Block_Scanner::create( $delimiter_content );
		$scanner->next_delimiter();

		$result = $scanner->opens_block( ...$block_types );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Data provider for opens_block tests.
	 */
	public static function provideOpensBlockTests(): array {
		return array(
			'opener without type check'        => array(
				'<!-- wp:paragraph -->',
				array(),
				true,
			),
			'opener with matching type'        => array(
				'<!-- wp:paragraph -->',
				array( 'paragraph' ),
				true,
			),
			'opener with matching full type'   => array(
				'<!-- wp:paragraph -->',
				array( 'core/paragraph' ),
				true,
			),
			'opener with multiple types'       => array(
				'<!-- wp:paragraph -->',
				array( 'heading', 'paragraph', 'image' ),
				true,
			),
			'opener with non-matching type'    => array(
				'<!-- wp:paragraph -->',
				array( 'heading' ),
				false,
			),
			'closer should return false'       => array(
				'<!-- /wp:paragraph -->',
				array( 'paragraph' ),
				false,
			),
			'void block should return true'    => array(
				'<!-- wp:separator /-->',
				array( 'separator' ),
				true,
			),
			'namespaced block with full name'  => array(
				'<!-- wp:jetpack/contact-form -->',
				array( 'jetpack/contact-form' ),
				true,
			),
			'namespaced block with short name' => array(
				'<!-- wp:jetpack/contact-form -->',
				array( 'contact-form' ),
				false,
			),
		);
	}

	/**
	 * Test is_freeform method.
	 * Note: Freeform block scanning is not yet implemented in Block_Scanner.
	 */
	public function test_is_freeform(): void {
		$content = 'Some text<!-- wp:paragraph -->block content<!-- /wp:paragraph -->More text';
		$scanner = Block_Scanner::create( $content );

		// Freeform blocks are not yet implemented, so we can't test them directly
		// Instead, test that regular blocks are not freeform
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertFalse( $scanner->is_freeform() );
		$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );
	}

	/**
	 * Test is_non_whitespace_freeform method.
	 * Note: Freeform block scanning is not yet implemented in Block_Scanner.
	 */
	public function test_is_non_whitespace_freeform(): void {
		$content = 'Some text<!-- wp:paragraph -->block content<!-- /wp:paragraph -->More text';
		$scanner = Block_Scanner::create( $content );

		// Freeform blocks are not yet implemented, so we can't test them directly
		// Instead, test that regular blocks are not non-whitespace freeform
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertFalse( $scanner->is_non_whitespace_freeform() );
	}

	/**
	 * Test get_attributes method throws exception.
	 */
	public function test_get_attributes_throws_exception(): void {
		$scanner = Block_Scanner::create( '<!-- wp:paragraph -->' );
		$scanner->next_delimiter();

		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Lazy attribute parsing not yet supported' );

		$scanner->get_attributes();
	}

	/**
	 * Test get_last_error method.
	 */
	public function test_get_last_error(): void {
		$scanner = Block_Scanner::create( '<!-- wp:paragraph -->' );

		// Initially no error
		$this->assertNull( $scanner->get_last_error() );

		// Successful parse
		$scanner->next_delimiter();
		$this->assertNull( $scanner->get_last_error() );

		// Error case
		$scanner = Block_Scanner::create( '<!-- wp:paragraph' );
		$scanner->next_delimiter();
		$this->assertEquals( Block_Scanner::INCOMPLETE_INPUT, $scanner->get_last_error() );
	}

	/**
	 * Test get_last_json_error method.
	 */
	public function test_get_last_json_error(): void {
		$scanner = Block_Scanner::create( '<!-- wp:paragraph {"valid": true} -->' );
		$scanner->next_delimiter();

		$scanner->allocate_and_return_parsed_attributes();
		$this->assertEquals( JSON_ERROR_NONE, $scanner->get_last_json_error() );

		$scanner = Block_Scanner::create( '<!-- wp:paragraph {"invalid":} -->' );
		$scanner->next_delimiter();

		$scanner->allocate_and_return_parsed_attributes();
		$this->assertEquals( JSON_ERROR_SYNTAX, $scanner->get_last_json_error() );
	}

	/**
	 * Test edge cases and error conditions.
	 */
	public function test_edge_cases(): void {
		// Test with complex nested HTML comments
		$content = '<!-- comment --><!-- wp:paragraph -->content<!-- /wp:paragraph -->';
		$scanner = Block_Scanner::create( $content );

		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );

		// Test block name with valid characters
		$scanner = Block_Scanner::create( '<!-- wp:block-name_123 -->' );
		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( 'core/block-name_123', $scanner->get_block_type() );

		// Test with mixed content
		$content = 'Text before<!-- wp:paragraph -->Content<!-- /wp:paragraph -->Text after';
		$scanner = Block_Scanner::create( $content );

		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( Block_Scanner::OPENER, $scanner->get_delimiter_type() );

		$this->assertTrue( $scanner->next_delimiter() );
		$this->assertEquals( Block_Scanner::CLOSER, $scanner->get_delimiter_type() );

		$this->assertFalse( $scanner->next_delimiter() );
	}

	/**
	 * Test scanning with different whitespace patterns.
	 */
	public function test_whitespace_patterns(): void {
		$test_cases = array(
			'<!-- wp:paragraph -->',
			'<!--  wp:paragraph  -->',
			'<!--	wp:paragraph	-->',
			'<!-- wp:paragraph {"attr":"value"} -->',
			'<!-- wp:paragraph {"attr":"value"}  -->',
		);

		foreach ( $test_cases as $test_case ) {
			$scanner = Block_Scanner::create( $test_case );
			$this->assertTrue( $scanner->next_delimiter(), "Failed to parse: {$test_case}" );
			$this->assertEquals( 'core/paragraph', $scanner->get_block_type() );
		}
	}

	/**
	 * Test constants are properly defined.
	 */
	public function test_constants(): void {
		$this->assertEquals( 'opener', Block_Scanner::OPENER );
		$this->assertEquals( 'closer', Block_Scanner::CLOSER );
		$this->assertEquals( 'void', Block_Scanner::VOID );
		$this->assertEquals( 'incomplete-input', Block_Scanner::INCOMPLETE_INPUT );
		$this->assertEquals( 'uninitialized', Block_Scanner::UNINITIALIZED );
	}

	/**
	 * Test scanning multiple blocks in sequence.
	 */
	public function test_scan_multiple_blocks_sequence(): void {
		$content = '<!-- wp:heading -->Title<!-- /wp:heading --><!-- wp:paragraph -->Content<!-- /wp:paragraph --><!-- wp:separator /-->';
		$scanner = Block_Scanner::create( $content );

		$expected_sequence = array(
			array(
				'type'       => Block_Scanner::OPENER,
				'block_type' => 'core/heading',
			),
			array(
				'type'       => Block_Scanner::CLOSER,
				'block_type' => 'core/heading',
			),
			array(
				'type'       => Block_Scanner::OPENER,
				'block_type' => 'core/paragraph',
			),
			array(
				'type'       => Block_Scanner::CLOSER,
				'block_type' => 'core/paragraph',
			),
			array(
				'type'       => Block_Scanner::VOID,
				'block_type' => 'core/separator',
			),
		);

		foreach ( $expected_sequence as $index => $expected ) {
			$this->assertTrue( $scanner->next_delimiter(), "Failed to find delimiter at index {$index}" );
			$this->assertEquals( $expected['type'], $scanner->get_delimiter_type(), "Wrong type at index {$index}" );
			$this->assertEquals( $expected['block_type'], $scanner->get_block_type(), "Wrong block type at index {$index}" );
		}

		$this->assertFalse( $scanner->next_delimiter() );
	}

	/**
	 * Test error handling with malformed JSON.
	 */
	public function test_malformed_json_handling(): void {
		$malformed_cases = array(
			'<!-- wp:paragraph {"invalid":} -->',
			'<!-- wp:paragraph {"missing": "value",} -->',
		);

		foreach ( $malformed_cases as $test_case ) {
			$scanner = Block_Scanner::create( $test_case );
			// Only test cases that can be parsed as valid delimiters
			if ( $scanner->next_delimiter() ) {
				$attributes = $scanner->allocate_and_return_parsed_attributes();
				$this->assertNull( $attributes, "Should return null for malformed JSON: {$test_case}" );
				$this->assertNotEquals( JSON_ERROR_NONE, $scanner->get_last_json_error(), "Should have JSON error for: {$test_case}" );
			}
		}
	}
}
