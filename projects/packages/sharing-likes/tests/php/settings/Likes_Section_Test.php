<?php
/**
 * Tests for the Like buttons section of Settings > Sharing.
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
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Likes_Section
 */
#[CoversClass( Likes_Section::class )]
class Likes_Section_Test extends BaseTestCase {

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

		parent::tear_down();
	}

	/**
	 * Render the section and hand back its markup.
	 */
	private function render(): string {
		ob_start();
		Likes_Section::render();

		return (string) ob_get_clean();
	}

	/**
	 * The Jetpack dashboard drops the module toggle once the block is a route
	 * this site can take, so this screen does not offer one either.
	 */
	public function test_offers_no_way_back_where_the_block_is_the_route(): void {
		$this->given_block_theme();
		$this->given_block( 'jetpack/like' );
		$this->given_connection( true );
		$this->given_modules( array() );

		$markup = $this->render();

		$this->assertStringContainsString( 'site-editor.php', $markup );
		$this->assertStringNotContainsString( 'activate-likes', $markup );
	}

	/**
	 * Comment Likes has no block equivalent, so a site running it is never sent
	 * down the block route -- and the module that serves it stays switchable.
	 */
	public function test_offers_the_way_back_where_the_block_is_not(): void {
		$this->given_connection( true );
		$this->given_modules( array() );

		$markup = $this->render();

		$this->assertStringContainsString( 'name="jetpack_sharing_action" value="activate-likes"', $markup );

		preg_match( '/name="_wpnonce" value="([^"]+)"/', $markup, $matches );

		$this->assertNotEmpty( $matches, 'The form carries no nonce.' );
		$this->assertSame( 1, wp_verify_nonce( $matches[1], Likes_Section::NONCE_ACTION ) );
	}

	/**
	 * Simple has no Comment Likes module to keep switchable, so the gate that
	 * holds the block route back for it elsewhere does not apply there: a block
	 * theme gets the nudge, and only the Site Editor link, since there is no
	 * module to switch off either.
	 */
	public function test_nudges_toward_the_block_on_simple_despite_comment_likes(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_block_theme();
		$this->given_block( 'jetpack/like' );

		$markup = $this->render();

		$this->assertStringContainsString( 'Use the Like block', $markup );
		$this->assertStringContainsString( 'site-editor.php', $markup );
		$this->assertStringNotContainsString( 'switch-to-block-likes', $markup );
		$this->assertStringContainsString( 'name="wpl_default"', $markup );
		$this->assertStringContainsString( 'name="jetpack_comment_likes_enabled"', $markup );
	}

	/**
	 * Likes declare `Requires Connection: Yes`, so there is nothing to offer
	 * until the site is connected, block route or not.
	 */
	public function test_offers_nothing_where_likes_cannot_render_at_all(): void {
		$this->given_connection( false );
		$this->given_modules( array() );

		$markup = $this->render();

		$this->assertStringNotContainsString( 'activate-likes', $markup );
		$this->assertStringContainsString( 'Like buttons need a connection to WordPress.com', $markup );
	}
}
