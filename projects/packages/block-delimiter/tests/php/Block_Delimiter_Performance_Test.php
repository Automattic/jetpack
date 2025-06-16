<?php

namespace Automattic;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Testing the Block Delimiter package performance.
 *
 * @covers \Automattic\Block_Delimiter
 */
#[CoversClass( Block_Delimiter::class )]
class Block_Delimiter_Performance_Test extends TestCase {
	/**
	 * Test performance comparison between parse_blocks and Block_Delimiter.
	 */
	public function test_performance_comparison(): void {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
		}

		// Create a post with multiple blocks
		$post_html = '';
		for ( $i = 0; $i < 100; $i++ ) {
			$post_html .= sprintf(
				'<!-- wp:image {"id":%2$d} --><div class="wp-block-image"><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure></div><!-- /wp:image -->',
				'http://example.com/image.jpg',
				1
			);
		}

		// Test Block_Delimiter performance
		$start_time = microtime( true );
		$delimiters = array();
		foreach ( Block_Delimiter::scan_delimiters( $post_html ) as $position => $delimiter ) {
			$delimiters[] = array(
				'position'   => $position,
				'type'       => $delimiter->get_delimiter_type(),
				'block_type' => $delimiter->allocate_and_return_block_type(),
			);
		}
		$end_time             = microtime( true );
		$block_delimiter_time = $end_time - $start_time;

		// Test parse_blocks performance
		$start_time = microtime( true );
		parse_blocks( $post_html );
		$end_time          = microtime( true );
		$parse_blocks_time = $end_time - $start_time;
		// Verify results
		$this->assertCount( 200, $delimiters ); // 100 blocks = 200 delimiters (openers and closers)
		$this->assertLessThan( $parse_blocks_time, $block_delimiter_time, 'Block_Delimiter should be faster than parse_blocks' );
	}
}
