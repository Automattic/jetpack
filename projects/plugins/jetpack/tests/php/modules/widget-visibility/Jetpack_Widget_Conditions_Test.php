<?php

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'modules/widget-visibility/widget-conditions.php';

/**
 * Test class for Jetpack_Widget_Conditions (widget visibility)
 *
 * To run: jetpack docker phpunit jetpack -- --filter=Jetpack_Widget_Conditions_Test
 *
 * @covers Jetpack_Widget_Conditions
 */
#[CoversClass( Jetpack_Widget_Conditions::class )]
class Jetpack_Widget_Conditions_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Verifies that filter_widget is able to understand gutenberg blocks
	 * passed to it, and filter visibility based on their rules.
	 *
	 * Creates a simple paragraph block, then runs it through
	 * recursively_filter_blocks() with (1) rule for "show
	 * if logged out", (2) rule for "show if logged in", and
	 * (3) No rules.
	 *
	 * Expects to see the same paragraph block for (1) and (3),
	 * and false for (2).
	 */
	public function test_filter_widget() {
		// Block with rule for "Display only when logged out" (Will pass during unit tests).
		// Expect to see: Same block ("Allowed to display").
		$block_content = '<!-- wp:paragraph {"conditions":{"action":"show","rules":[{"major":"loggedin","minor":"loggedout"}],"match_all":0}} -->'
		. "\n" . '<p>Test Paragraph</p>'
		. "\n" . '<!-- /wp:paragraph -->';
		$block         = array( 'content' => $block_content );
		// Expect to see the same block. Clone it, just in case the function modifies its parameters.
		$expected   = unserialize( serialize( $block ) );
		$return_val = Jetpack_Widget_Conditions::filter_widget( $block );
		$this->assertSame( $expected, $return_val );

		// Block with rule for "Display only when logged in" (Will fail during unit tests).
		// Expect to see: False ("Not allowed to display").
		$block_content = '<!-- wp:paragraph {"conditions":{"action":"show","rules":[{"major":"loggedin","minor":"loggedin"}],"match_all":0}} -->'
		. "\n" . '<p>Test Paragraph</p>'
		. "\n" . '<!-- /wp:paragraph -->';
		$block         = array( 'content' => $block_content );
		$expected      = false;
		$return_val    = Jetpack_Widget_Conditions::filter_widget( $block );
		$this->assertSame( $expected, $return_val );

		// Block with no rules:.
		$block_content = '<!-- wp:paragraph -->'
		. "\n" . '<p>Test Paragraph</p>'
		. "\n" . '<!-- /wp:paragraph -->';
		$block         = array( 'content' => $block_content );
		// Expect to see the same block. Clone it, just in case the function modifies its parameters.
		$expected   = unserialize( serialize( $block ) );
		$return_val = Jetpack_Widget_Conditions::filter_widget( $block );
		$this->assertSame( $expected, $return_val );
	}

	/**
	 * Verifies that filter_widget handles parsed blocks arrays (output of parse_blocks)
	 * and respects visibility rules without throwing errors.
	 */
	public function test_filter_widget_with_parsed_blocks_array() {
		// Block with rule for "Display only when logged out" (Will pass during unit tests).
		$block_content = '<!-- wp:paragraph {"conditions":{"action":"show","rules":[{"major":"loggedin","minor":"loggedout"}],"match_all":0}} -->'
			. "\n" . '<p>Test Paragraph</p>'
			. "\n" . '<!-- /wp:paragraph -->';
		$parsed_blocks = parse_blocks( $block_content );
		$block         = array( 'content' => $parsed_blocks );
		$expected      = unserialize( serialize( $block ) );
		$return_val    = Jetpack_Widget_Conditions::filter_widget( $block );
		$this->assertSame( $expected, $return_val );

		// Block with rule for "Display only when logged in" (Will fail during unit tests).
		$block_content = '<!-- wp:paragraph {"conditions":{"action":"show","rules":[{"major":"loggedin","minor":"loggedin"}],"match_all":0}} -->'
			. "\n" . '<p>Test Paragraph</p>'
			. "\n" . '<!-- /wp:paragraph -->';
		$parsed_blocks = parse_blocks( $block_content );
		$block         = array( 'content' => $parsed_blocks );
		$expected      = false;
		$return_val    = Jetpack_Widget_Conditions::filter_widget( $block );
		$this->assertSame( $expected, $return_val );
	}

	/**
	 * Verifies that filter_widget safely bails and returns the instance when content
	 * is an unknown array shape that cannot be normalized.
	 */
	public function test_filter_widget_with_unknown_array_shape() {
		$block    = array( 'content' => array( 'foo' => 'bar' ) );
		$expected = unserialize( serialize( $block ) );
		$this->assertSame( $expected, Jetpack_Widget_Conditions::filter_widget( $block ) );
	}

	/**
	 * Verifies that filter_widget safely returns the instance when content is an empty array.
	 */
	public function test_filter_widget_with_empty_array_content() {
		$block    = array( 'content' => array() );
		$expected = unserialize( serialize( $block ) );
		$this->assertSame( $expected, Jetpack_Widget_Conditions::filter_widget( $block ) );
	}
}
