<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase

require_jetpack_file( 'modules/widget-visibility/widget-conditions.php' );

/**
 * Test class for Jetpack_Widget_Conditions (widget visibility)
 *
 * To run: jetpack docker phpunit -- --filter=widget
 *
 * @covers Jetpack_Widget_Conditions
 */
class WP_Test_Jetpack_Widget_Conditions extends WP_UnitTestCase {
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
	 *
	 * @covers Jetpack_Widget_Conditions::filter_widget
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
}
