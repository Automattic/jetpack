<?php
/**
 * Tests for the Comment Likes section of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/trait-section-environment.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Comment_Likes_Section
 */
#[CoversClass( Comment_Likes_Section::class )]
class Comment_Likes_Section_Test extends BaseTestCase {

	use Section_Environment;

	/**
	 * Start every case from a site with no theme, no blocks and no modules.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
	}

	/**
	 * Leave nothing pinned for the next case.
	 */
	public function tear_down() {
		$this->tear_down_site();
		Constants::clear_constants();
		delete_option( 'jetpack_comment_likes_enabled' );
		delete_option( 'sharing-options' );
		delete_option( 'disabled_likes' );
		delete_option( 'disabled_reblogs' );
		ob_start();
		Settings_Form::render();
		ob_end_clean();

		parent::tear_down();
	}

	/**
	 * Render the section on a connected site running the given modules.
	 *
	 * @param string[] $modules Active modules.
	 */
	private function render_with( array $modules ): string {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'post', 'page' ) ) ) );
		$this->given_connection( true );
		$this->given_modules( $modules );

		ob_start();
		Comment_Likes_Section::render();

		return (string) ob_get_clean();
	}

	/**
	 * The Comment Likes checkbox in the markup, which must post as its own section.
	 *
	 * @param string $markup Rendered section.
	 */
	private function checkbox( string $markup ): string {
		$this->assertStringContainsString( '<h2>Comment Likes</h2>', $markup );
		$this->assertStringContainsString( 'value="' . Settings_Form::SECTION_COMMENT_LIKES . '"', $markup );
		$this->assertSame( 1, preg_match( '/<input[^>]*name="jetpack_comment_likes_enabled"[^>]*>/', $markup, $matches ) );

		return $matches[0];
	}

	/**
	 * With Like buttons on, the default they share lives in the Like buttons section.
	 */
	public function test_says_where_they_appear_alongside_like_buttons(): void {
		$markup = $this->render_with( array( 'likes', 'comment-likes' ) );

		$this->assertStringContainsString( 'checked', $this->checkbox( $markup ) );
		$this->assertStringContainsString( 'Comment Likes currently appear on comments on: Posts, Pages.', $markup );
		$this->assertStringContainsString( 'href="#' . Placement_Section::ANCHOR . '"', $markup );
		$this->assertStringNotContainsString( 'name="wpl_default"', $markup );
	}

	/**
	 * Comment Likes still read the sitewide default once Like buttons are off, so
	 * it stays on screen here, saved through the Likes section's own handler.
	 */
	public function test_keeps_the_default_they_read_once_like_buttons_are_off(): void {
		$markup = $this->render_with( array( 'comment-likes' ) );

		$this->assertStringContainsString( 'checked', $this->checkbox( $markup ) );
		$this->assertStringContainsString( 'Comment Likes currently appear on comments on: Posts, Pages.', $markup );
		$this->assertStringContainsString( 'name="wpl_default"', $markup );
		$this->assertStringContainsString( 'Comment Likes are', $markup );
		$this->assertStringContainsString( 'value="' . Settings_Form::SECTION_LIKES . '"', $markup );
	}

	/**
	 * A Like buttons module switched off through its settings shows no options, so the default moves here.
	 */
	public function test_keeps_the_default_once_the_like_buttons_are_switched_off(): void {
		update_option( 'disabled_likes', 1 );
		update_option( 'disabled_reblogs', 1 );
		$this->given_block_theme();
		$this->given_block( 'jetpack/like' );

		$markup = $this->render_with( array( 'likes', 'comment-likes' ) );

		$this->assertStringContainsString( 'name="wpl_default"', $markup );
	}

	/**
	 * Nothing reads the Likes settings with both modules off, so only the switch is left.
	 */
	public function test_offers_only_the_switch_with_both_likes_modules_off(): void {
		$markup = $this->render_with( array() );

		$this->assertStringNotContainsString( 'checked', $this->checkbox( $markup ) );
		$this->assertStringNotContainsString( 'currently appear', $markup );
		$this->assertStringNotContainsString( 'name="wpl_default"', $markup );
	}

	/**
	 * Simple's Comment Likes read neither placement nor the sitewide default.
	 */
	public function test_offers_only_the_switch_on_simple(): void {
		Constants::set_constant( 'IS_WPCOM', true );

		$markup = $this->render_with( array() );

		$this->assertStringNotContainsString( 'checked', $this->checkbox( $markup ) );
		$this->assertStringNotContainsString( 'currently appear', $markup );
		$this->assertStringNotContainsString( 'name="wpl_default"', $markup );
	}

	public function test_ticks_the_box_from_the_option_on_simple(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		update_option( 'jetpack_comment_likes_enabled', 1 );

		$this->assertStringContainsString( 'checked', $this->checkbox( $this->render_with( array() ) ) );
	}

	/**
	 * The module requires a connection, and the Like buttons section already says so.
	 */
	public function test_renders_nothing_without_a_connection(): void {
		$this->given_modules( array( 'comment-likes' ) );

		ob_start();
		Comment_Likes_Section::render();

		$this->assertSame( '', (string) ob_get_clean() );
	}
}
