<?php

namespace Automattic;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Testing the Block Delimiter package.
 *
 * @covers \Automattic\Block_Delimiter
 */
#[CoversClass( Block_Delimiter::class )]
class Block_Delimiter_Test extends TestCase {
	/**
	 * Test the next_delimiter method with valid block delimiters.
	 *
	 * @dataProvider provideValidBlockDelimiters
	 */
	#[DataProvider( 'provideValidBlockDelimiters' )]
	public function test_next_delimiter_with_valid_input( string $input, int $start_offset, array $expected ): void {
		$match_offset = null;
		$match_length = null;

		$delimiter = Block_Delimiter::next_delimiter( $input, $start_offset, $match_offset, $match_length );

		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );
		$this->assertEquals( $expected['type'], $delimiter->get_delimiter_type() );
		$this->assertEquals( $expected['block_type'], $delimiter->allocate_and_return_block_type() );
		$this->assertEquals( $expected['match_offset'], $match_offset );
		$this->assertEquals( $expected['match_length'], $match_length );
		$this->assertNull( Block_Delimiter::get_last_error() );
	}

	/**
	 * Data provider for valid block delimiters.
	 */
	public static function provideValidBlockDelimiters(): array {
		return array(
			'core paragraph opener'            => array(
				'<!-- wp:paragraph -->',
				0,
				array(
					'type'         => Block_Delimiter::OPENER,
					'block_type'   => 'core/paragraph',
					'match_offset' => 0,
					'match_length' => 21,
				),
			),
			'core paragraph closer'            => array(
				'<!-- /wp:paragraph -->',
				0,
				array(
					'type'         => Block_Delimiter::CLOSER,
					'block_type'   => 'core/paragraph',
					'match_offset' => 0,
					'match_length' => 22,
				),
			),
			'void block'                       => array(
				'<!-- wp:separator /-->',
				0,
				array(
					'type'         => Block_Delimiter::VOID,
					'block_type'   => 'core/separator',
					'match_offset' => 0,
					'match_length' => 22,
				),
			),
			'block with namespace'             => array(
				'<!-- wp:jetpack/contact-form -->',
				0,
				array(
					'type'         => Block_Delimiter::OPENER,
					'block_type'   => 'jetpack/contact-form',
					'match_offset' => 0,
					'match_length' => 32,
				),
			),
			'block with attributes'            => array(
				'<!-- wp:paragraph {"align":"center"} -->',
				0,
				array(
					'type'         => Block_Delimiter::OPENER,
					'block_type'   => 'core/paragraph',
					'match_offset' => 0,
					'match_length' => 40,
				),
			),
			'block with whitespace variations' => array(
				'<!--   wp:paragraph   -->',
				0,
				array(
					'type'         => Block_Delimiter::OPENER,
					'block_type'   => 'core/paragraph',
					'match_offset' => 0,
					'match_length' => 25,
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
	public function test_next_delimiter_with_invalid_input( string $input, int $start_offset, ?string $expected_error ): void {
		$delimiter = Block_Delimiter::next_delimiter( $input, $start_offset );

		$this->assertNull( $delimiter );
		$this->assertEquals( $expected_error, Block_Delimiter::get_last_error() );
	}

	/**
	 * Data provider for invalid block delimiters.
	 */
	public static function provideInvalidBlockDelimiters(): array {
		return array(
			'no block delimiter'                => array( 'Just some regular text', 0, null ),
			'regular HTML comment'              => array( '<!-- This is a regular comment -->', 0, null ),
			'incomplete wp prefix'              => array( '<!-- w:paragraph -->', 0, null ),
			'no whitespace after comment start' => array( '<!--wp:paragraph -->', 0, null ),
			'invalid block name'                => array( '<!-- wp:123invalid -->', 0, null ),
			'empty input'                       => array( '', 0, null ),
			'incomplete input'                  => array( '<!-- wp:paragraph', 0, Block_Delimiter::INCOMPLETE_INPUT ),
		);
	}

	/**
	 * Test scanning multiple delimiters.
	 */
	public function test_scan_delimiters(): void {
		$content    = '<!-- wp:paragraph -->Hello<!-- /wp:paragraph --><!-- wp:separator /-->';
		$delimiters = array();

		foreach ( Block_Delimiter::scan_delimiters( $content ) as $position => $delimiter ) {
			$delimiters[] = array(
				'position'   => $position,
				'type'       => $delimiter->get_delimiter_type(),
				'block_type' => $delimiter->allocate_and_return_block_type(),
			);
		}

		$this->assertCount( 3, $delimiters );
		$this->assertEquals( Block_Delimiter::OPENER, $delimiters[0]['type'] );
		$this->assertEquals( 'core/paragraph', $delimiters[0]['block_type'] );
		$this->assertEquals( Block_Delimiter::CLOSER, $delimiters[1]['type'] );
		$this->assertEquals( 'core/paragraph', $delimiters[1]['block_type'] );
		$this->assertEquals( Block_Delimiter::VOID, $delimiters[2]['type'] );
		$this->assertEquals( 'core/separator', $delimiters[2]['block_type'] );
	}

	/**
	 * Test scanning delimiters with freeform content.
	 */
	public function test_scan_delimiters_with_freeform(): void {
		$content    = 'Some text<!-- wp:paragraph -->Hello<!-- /wp:paragraph -->More text';
		$delimiters = array();

		foreach ( Block_Delimiter::scan_delimiters( $content, 'visit' ) as $position => $delimiter ) {
			$delimiters[] = array(
				'position'   => $position,
				'type'       => $delimiter->get_delimiter_type(),
				'block_type' => $delimiter->allocate_and_return_block_type(),
			);
		}

		$this->assertCount( 6, $delimiters ); // 2 freeform + 2 paragraph + 2 freeform
		$this->assertEquals( 'core/freeform', $delimiters[0]['block_type'] );
		$this->assertEquals( 'core/paragraph', $delimiters[2]['block_type'] );
		$this->assertEquals( 'core/freeform', $delimiters[4]['block_type'] );
	}

	/**
	 * Test is_block_type method.
	 *
	 * @dataProvider provideBlockTypeChecks
	 */
	#[DataProvider( 'provideBlockTypeChecks' )]
	public function test_is_block_type( string $delimiter_content, string $check_type, bool $expected ): void {
		$delimiter = Block_Delimiter::next_delimiter( $delimiter_content, 0 );

		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );
		$this->assertEquals( $expected, $delimiter->is_block_type( $check_type ) );
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
	 */
	public function test_is_block_type_freeform(): void {
		$content    = 'Some freeform text<!-- wp:paragraph -->block content<!-- /wp:paragraph -->More freeform text';
		$delimiters = array();

		// Collect freeform delimiters
		foreach ( Block_Delimiter::scan_delimiters( $content, 'visit' ) as $position => $delimiter ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			if ( $delimiter->is_block_type( 'core/freeform' ) ) {
				$delimiters[] = $delimiter;
			}
		}

		$this->assertCount( 4, $delimiters ); // 2 freeform sections, each with opener and closer

		// Test the first freeform delimiter
		$freeform_delimiter = $delimiters[0];

		// Test both short and full freeform block type names
		$this->assertTrue( $freeform_delimiter->is_block_type( 'core/freeform' ) );
		$this->assertTrue( $freeform_delimiter->is_block_type( 'freeform' ) );

		// Test that it doesn't match other block types
		$this->assertFalse( $freeform_delimiter->is_block_type( 'paragraph' ) );
		$this->assertFalse( $freeform_delimiter->is_block_type( 'core/paragraph' ) );
		$this->assertFalse( $freeform_delimiter->is_block_type( 'jetpack/freeform' ) );
	}

	/**
	 * Test get_delimiter_type method.
	 *
	 * @dataProvider provideDelimiterTypes
	 */
	#[DataProvider( 'provideDelimiterTypes' )]
	public function test_get_delimiter_type( string $delimiter_content, string $expected_type ): void {
		$delimiter = Block_Delimiter::next_delimiter( $delimiter_content, 0 );

		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );
		$this->assertEquals( $expected_type, $delimiter->get_delimiter_type() );
	}

	/**
	 * Data provider for delimiter types.
	 */
	public static function provideDelimiterTypes(): array {
		return array(
			'opener' => array( '<!-- wp:paragraph -->', Block_Delimiter::OPENER ),
			'closer' => array( '<!-- /wp:paragraph -->', Block_Delimiter::CLOSER ),
			'void'   => array( '<!-- wp:separator /-->', Block_Delimiter::VOID ),
		);
	}

	/**
	 * Test has_void_flag method.
	 *
	 * @dataProvider provideVoidFlagTests
	 */
	#[DataProvider( 'provideVoidFlagTests' )]
	public function test_has_void_flag( string $delimiter_content, bool $expected ): void {
		$delimiter = Block_Delimiter::next_delimiter( $delimiter_content, 0 );

		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );
		$this->assertEquals( $expected, $delimiter->has_void_flag() );
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
	 * Test allocate_and_return_block_type method.
	 *
	 * @dataProvider provideBlockTypeReturns
	 */
	#[DataProvider( 'provideBlockTypeReturns' )]
	public function test_allocate_and_return_block_type( string $delimiter_content, string $expected ): void {
		$delimiter = Block_Delimiter::next_delimiter( $delimiter_content, 0 );

		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );
		$this->assertEquals( $expected, $delimiter->allocate_and_return_block_type() );
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
		$delimiter = Block_Delimiter::next_delimiter( $delimiter_content, 0 );

		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );
		$attributes = $delimiter->allocate_and_return_parsed_attributes();

		$this->assertEquals( $expected, $attributes );
		$this->assertEquals( $expected_json_error, $delimiter->get_last_json_error() );
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
		);
	}

	/**
	 * Test allocate_and_detach_from_source_text method.
	 */
	public function test_allocate_and_detach_from_source_text(): void {
		$long_content = str_repeat( 'A', 1000 ) . '<!-- wp:paragraph -->' . str_repeat( 'B', 1000 );
		$delimiter    = Block_Delimiter::next_delimiter( $long_content, 1000 );

		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );

		// Before detaching, the delimiter references the full source text
		$original_type       = $delimiter->get_delimiter_type();
		$original_block_type = $delimiter->allocate_and_return_block_type();

		// Detach from source text
		$delimiter->allocate_and_detach_from_source_text();

		// After detaching, functionality should still work
		$this->assertEquals( $original_type, $delimiter->get_delimiter_type() );
		$this->assertEquals( $original_block_type, $delimiter->allocate_and_return_block_type() );
	}

	/**
	 * Test get_last_error method.
	 */
	public function test_get_last_error(): void {
		// Reset error state by doing a successful parse
		Block_Delimiter::next_delimiter( '<!-- wp:paragraph -->', 0 );
		$this->assertNull( Block_Delimiter::get_last_error() );

		// Trigger an incomplete input error
		Block_Delimiter::next_delimiter( '<!-- wp:paragraph', 0 );
		$this->assertEquals( Block_Delimiter::INCOMPLETE_INPUT, Block_Delimiter::get_last_error() );
	}

	/**
	 * Test get_last_json_error method.
	 */
	public function test_get_last_json_error(): void {
		$delimiter = Block_Delimiter::next_delimiter( '<!-- wp:paragraph {"valid": true} -->', 0 );
		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );

		$delimiter->allocate_and_return_parsed_attributes();
		$this->assertEquals( JSON_ERROR_NONE, $delimiter->get_last_json_error() );

		$delimiter = Block_Delimiter::next_delimiter( '<!-- wp:paragraph {"invalid":} -->', 0 );
		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );

		$delimiter->allocate_and_return_parsed_attributes();
		$this->assertEquals( JSON_ERROR_SYNTAX, $delimiter->get_last_json_error() );
	}

	/**
	 * Test get_attributes method throws exception.
	 */
	public function test_get_attributes_throws_exception(): void {
		$delimiter = Block_Delimiter::next_delimiter( '<!-- wp:paragraph -->', 0 );

		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Lazy attribute parsing not yet supported' );

		$delimiter->get_attributes();
	}

	/**
	 * Test edge cases and error conditions.
	 */
	public function test_edge_cases(): void {
		// Test with starting offset beyond string length
		$delimiter = Block_Delimiter::next_delimiter( '<!-- wp:paragraph -->', 100 );
		$this->assertNull( $delimiter );

		// Test with complex nested HTML comments
		$content   = '<!-- comment --><!-- wp:paragraph -->content<!-- /wp:paragraph -->';
		$delimiter = Block_Delimiter::next_delimiter( $content, 0 );
		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );
		$this->assertEquals( 'core/paragraph', $delimiter->allocate_and_return_block_type() );

		// Test block name with valid characters
		$delimiter = Block_Delimiter::next_delimiter( '<!-- wp:block-name_123 -->', 0 );
		$this->assertInstanceOf( Block_Delimiter::class, $delimiter );
		$this->assertEquals( 'core/block-name_123', $delimiter->allocate_and_return_block_type() );
	}

	/**
	 * Test constants are properly defined.
	 */
	public function test_constants(): void {
		$this->assertEquals( 'opener', Block_Delimiter::OPENER );
		$this->assertEquals( 'closer', Block_Delimiter::CLOSER );
		$this->assertEquals( 'void', Block_Delimiter::VOID );
		$this->assertEquals( 'incomplete-input', Block_Delimiter::INCOMPLETE_INPUT );
		$this->assertEquals( 'uninitialized', Block_Delimiter::UNINITIALIZED );
	}
}
