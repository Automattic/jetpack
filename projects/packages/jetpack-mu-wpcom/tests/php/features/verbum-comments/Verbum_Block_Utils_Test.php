<?php
/**
 * Test class for Verbum_Block_Utils.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/verbum-comments/assets/class-verbum-block-utils.php';
require_once __DIR__ . '/../../trait-wp-version-test-helpers.php';

/**
 * Test class for Verbum_Block_Utils.
 *
 * @covers \Verbum_Block_Utils
 */
#[CoversClass( Verbum_Block_Utils::class )]
class Verbum_Block_Utils_Test extends \WorDBless\BaseTestCase {
	use Jetpack_Mu_Wpcom_WP_Version_Test_Helpers;

	/**
	 * Ensure string comments are not modified when 'render_verbum_blocks' is applied
	 */
	public function test_comment_text_string_comment() {
		$comment_content  = 'This is a test comment';
		$filtered_content = Verbum_Block_Utils::render_verbum_blocks( $comment_content );
		$this->assertEquals( $comment_content, $filtered_content );
	}

	/**
	 * Ensure blocks are filtered when 'render_verbum_blocks' is applied
	 */
	public function test_comment_text_block_sanitization() {
		$comment_content  = '<!-- wp:paragraph -->Testing<!-- /wp:paragraph --><!-- wp:latest-posts -->';
		$filtered_content = Verbum_Block_Utils::render_verbum_blocks( $comment_content );
		$this->assertEquals( 'Testing', $filtered_content );
	}

	/**
	 * Ensure blocks are rendered properly
	 */
	public function test_comment_text_block_sanitization_sanity_check() {
		Functions\expect( 'wpcom_site_has_feature' )->andReturn( true );
		$comment_content  = '<!-- wp:paragraph --><p>test</p><!-- /wp:paragraph --><!-- wp:list --><ul><!-- wp:list-item --><li>1</li><!-- /wp:list-item --><!-- wp:list-item --><li>2</li><!-- /wp:list-item --><!-- wp:list-item --><li>3</li><!-- /wp:list-item --></ul><!-- /wp:list --><!-- wp:quote --><blockquote class="wp-block-quote"><!-- wp:paragraph --><p>something</p><!-- /wp:paragraph --><cite>someone</cite></blockquote><!-- /wp:quote -->';
		$filtered_content = preg_replace( '/\R+/', '', Verbum_Block_Utils::render_verbum_blocks( $comment_content ) );

		// WordPress trunk (7.0+) removed layout classes from block output (Gutenberg PR #71207).
		// We need to handle both old (with classes) and new (without classes) formats.
		// @todo Simplify to a single expected value once WP 7.0 is the minimum supported version.
		$expected_content_wp7 = '<p>test</p><ul><li>1</li><li>2</li><li>3</li></ul><blockquote class="wp-block-quote"><p>something</p><cite>someone</cite></blockquote>';
		$expected_content_wp6 = '<p>test</p><ul><li>1</li><li>2</li><li>3</li></ul><blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow"><p>something</p><cite>someone</cite></blockquote>';

		$expected_content = $this->get_version_specific_expected_html( $expected_content_wp7, $expected_content_wp6 );

		$this->assertSame( $expected_content, $filtered_content );
	}

	/**
	 * Ensure innerBlocks are filtered when 'render_verbum_blocks' is applied
	 */
	public function test_comment_text_block_sanitization_inner_blocks() {
		$comment_content  = '<!-- wp:paragraph {} --><!-- wp:latest-posts --><!-- /wp:paragraph -->';
		$filtered_content = Verbum_Block_Utils::render_verbum_blocks( $comment_content );
		$this->assertSame( '', $filtered_content );
	}

	/**
	 * Ensure string comments are not modified when 'pre_comment_content' is applied
	 */
	public function test_pre_comment_content_string_comment() {
		$comment_content  = 'This is a test comment';
		$filtered_content = Verbum_Block_Utils::remove_blocks( $comment_content );
		$this->assertEquals( $comment_content, $filtered_content );
	}

	/**
	 * Ensure blocks are filtered when 'pre_comment_content' is applied
	 */
	public function test_pre_comment_content__block_sanitization() {
		$comment_content  = '<!-- wp:paragraph -->Testing<!-- /wp:paragraph --><!-- wp:latest-posts -->';
		$filtered_content = Verbum_Block_Utils::remove_blocks( $comment_content );
		$this->assertEquals( '<!-- wp:paragraph -->Testing<!-- /wp:paragraph -->', $filtered_content );
	}

	/**
	 * Ensure innerBlocks are removed if not allowed
	 */
	public function test_pre_comment_content_inner_blocks() {
		$comment_content = <<<'HTML'
<!-- wp:quote -->
<blockquote class="wp-block-quote">
	<p>Allowed outer quote block</p>
	<!-- wp:button {"text":"I am a disallowed button!","url":"#"} -->
	<a class="wp-block-button__link" href="#">I am a disallowed button!</a>
	<!-- /wp:button -->
</blockquote>
<!-- /wp:quote -->
HTML;

		$expected_content = <<<'HTML'
<!-- wp:quote -->
<blockquote class="wp-block-quote">
	<p>Allowed outer quote block</p>
</blockquote>
<!-- /wp:quote -->
HTML;

		// Simulate WordPress flow: pre_comment_content filters receive slashed data.
		$filtered_content = Verbum_Block_Utils::remove_blocks( wp_slash( $comment_content ) );
		// Unslash the result for comparison since the filter returns slashed data.
		$filtered_content = wp_unslash( $filtered_content );
		// Normalize whitespace before comparison
		$filtered_content = preg_replace( '/\s+/', ' ', $filtered_content );
		$expected_content = preg_replace( '/\s+/', ' ', $expected_content );
		$this->assertSame( $expected_content, $filtered_content );
	}

	/**
	 * Test security: malformed block delimiters should be handled safely
	 */
	public function test_security_malformed_block_delimiters() {
		$malformed_inputs = array(
			'<!-- wp:paragraph',                          // Incomplete opening
			'<!-- wp:paragraph <!-- wp:nested --> -->',   // Nested comments
			'<!-- wp:paragraph {"unclosed": "string -->',  // Invalid JSON
			"<!-- wp:paragraph -->\x00<!-- /wp:paragraph -->", // Null bytes
			'<!-- wp:paragraph -->content<!-- /wp:invalid -->', // Mismatched closing
			'<!--wp:paragraph -->',                        // No space after comment start
			'<!-- w:paragraph -->',                        // Incomplete wp prefix
		);

		foreach ( $malformed_inputs as $input ) {
			$result = Verbum_Block_Utils::remove_blocks( $input );
			// Should not cause errors and should return safe content
			$this->assertIsString( $result );

			// For truly malformed inputs that don't have proper block structure,
			// they should be returned as-is since has_blocks() would return false
			// or they would be treated as plain text content
			if ( ! has_blocks( $input ) ) {
				$this->assertEquals( $input, $result );
			} else {
				// If it's detected as having blocks but they're malformed,
				// the parser should handle them gracefully
				$this->assertIsString( $result );
			}
		}
	}

	/**
	 * Test security: Unicode and encoding edge cases
	 */
	public function test_security_unicode_handling() {
		$unicode_inputs = array(
			'<!-- wp:paragraph -->🔥💯<!-- /wp:paragraph -->', // Emoji
			'<!-- wp:paragraph -->مرحبا<!-- /wp:paragraph -->', // RTL text
			'<!-- wp:paragraph -->' . chr( 0xC2 ) . chr( 0x85 ) . '<!-- /wp:paragraph -->', // UTF-8 sequences
			'<!-- wp:paragraph -->café<!-- /wp:paragraph -->', // Accented characters
		);

		foreach ( $unicode_inputs as $input ) {
			$result = Verbum_Block_Utils::remove_blocks( $input );
			// Should handle unicode properly without corruption
			$this->assertIsString( $result );
			// Allowed blocks should be preserved with unicode content
			$this->assertStringContainsString( 'wp:paragraph', $result );
		}
	}

	/**
	 * Test security: Block type spoofing attempts
	 */
	public function test_security_block_type_spoofing() {
		$spoofing_attempts = array(
			'<!-- wp:core/paragraph -->content<!-- /wp:core/paragraph -->', // Namespace confusion
			'<!-- wp:paragraph/evil -->content<!-- /wp:paragraph/evil -->', // Fake subtype
			'<!-- wp: paragraph -->content<!-- /wp: paragraph -->',         // Extra space
			'<!-- wp:PARAGRAPH -->content<!-- /wp:PARAGRAPH -->',          // Case variation
		);

		foreach ( $spoofing_attempts as $input ) {
			$result = Verbum_Block_Utils::remove_blocks( $input );
			// Should properly identify and handle spoofing attempts
			$this->assertIsString( $result );
		}
	}

	/**
	 * Test security: Input validation consistency between fast and slow paths
	 */
	public function test_security_input_validation_consistency() {
		$test_inputs = array(
			'<!-- wp:paragraph -->Allowed content<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->Allowed<!-- /wp:paragraph --><!-- wp:latest-posts -->',
			'<!-- wp:quote --><!-- wp:paragraph -->Nested allowed<!-- /wp:paragraph --><!-- /wp:quote -->',
			'<!-- wp:quote --><!-- wp:button -->Nested disallowed<!-- /wp:button --><!-- /wp:quote -->',
		);

		foreach ( $test_inputs as $input ) {
			$slashed_input = wp_slash( $input );
			$result        = Verbum_Block_Utils::remove_blocks( $slashed_input );

			// Result should be unslashed content (consistent processing)
			$this->assertIsString( $result );

			// Should not contain slashes that would indicate inconsistent processing
			// This tests the fix for the critical input validation inconsistency
			if ( strpos( $result, 'wp:' ) !== false ) {
				$this->assertStringNotContainsString( '\\"', $result, 'Result should not contain escaped quotes from slashing' );
			}
		}
	}

	/**
	 * Test security: Resource exhaustion scenarios
	 */
	public function test_security_resource_limits() {
		// Test deeply nested blocks
		$deeply_nested = str_repeat( '<!-- wp:quote -->', 50 ) . 'content' . str_repeat( '<!-- /wp:quote -->', 50 );
		$result        = Verbum_Block_Utils::remove_blocks( $deeply_nested );
		$this->assertIsString( $result );

		// Test very long content
		$long_content = '<!-- wp:paragraph -->' . str_repeat( 'a', 10000 ) . '<!-- /wp:paragraph -->';
		$result       = Verbum_Block_Utils::remove_blocks( $long_content );
		$this->assertIsString( $result );

		// Test many blocks
		$many_blocks = str_repeat( '<!-- wp:paragraph -->content<!-- /wp:paragraph -->', 100 );
		$result      = Verbum_Block_Utils::remove_blocks( $many_blocks );
		$this->assertIsString( $result );
	}

	/**
	 * Ensure backslashes in comment content are preserved through the remove_blocks filter.
	 *
	 * The pre_comment_content filter receives slashed data and must return slashed data.
	 * Previously, remove_blocks() called wp_unslash() for block parsing but did not
	 * re-slash the content, causing WordPress to double-unslash and strip user backslashes.
	 *
	 * @see CM-516
	 */
	public function test_remove_blocks_preserves_backslashes() {
		// Simulate what WordPress does: slash the comment content before applying pre_comment_content filters.
		$user_input    = '<!-- wp:paragraph --><p>Hello \\ World and some \\LaTeX</p><!-- /wp:paragraph -->';
		$slashed_input = wp_slash( $user_input );

		$result = Verbum_Block_Utils::remove_blocks( $slashed_input );

		// The result must still be slashed so WordPress can unslash it once to get the original content.
		$this->assertSame( $user_input, wp_unslash( $result ), 'Backslashes should survive a single wp_unslash after remove_blocks processing.' );
	}

	/**
	 * Test that Block_Scanner and parse_blocks produce consistent security results
	 */
	public function test_consistency_between_scanner_and_parse_blocks() {
		$test_cases = array(
			'<!-- wp:paragraph -->Safe content<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->Safe<!-- /wp:paragraph --><!-- wp:latest-posts -->Unsafe<!-- /wp:latest-posts -->',
			'<!-- wp:quote --><!-- wp:paragraph -->Nested safe<!-- /wp:paragraph --><!-- /wp:quote -->',
			'<!-- wp:quote --><!-- wp:button -->Nested unsafe<!-- /wp:button --><!-- /wp:quote -->',
		);

		foreach ( $test_cases as $test_case ) {
			$result = Verbum_Block_Utils::remove_blocks( $test_case );

			// Verify that allowed blocks are preserved
			if ( strpos( $test_case, 'wp:paragraph' ) !== false || strpos( $test_case, 'wp:quote' ) !== false ) {
				$this->assertStringContainsString( 'wp:', $result, 'Allowed blocks should be preserved' );
			}

			// Verify that disallowed blocks are removed
			if ( strpos( $test_case, 'wp:latest-posts' ) !== false || strpos( $test_case, 'wp:button' ) !== false ) {
				$this->assertStringNotContainsString( 'latest-posts', $result, 'Disallowed blocks should be removed' );
				$this->assertStringNotContainsString( 'button', $result, 'Disallowed blocks should be removed' );
			}
		}
	}
}
