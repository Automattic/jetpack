<?php
/**
 * Tests for the section hosting settings other features add to Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Extras_Section
 */
#[CoversClass( Extras_Section::class )]
class Extras_Section_Test extends BaseTestCase {

	/**
	 * Leave nothing hooked for the next case.
	 */
	public function tear_down() {
		remove_all_actions( 'sharing_global_options' );

		parent::tear_down();
	}

	/**
	 * Render the section and hand back its markup.
	 */
	private function render(): string {
		ob_start();
		Extras_Section::render();

		return trim( (string) ob_get_clean() );
	}

	/**
	 * Print a field, standing in for a consumer like Twitter Cards.
	 */
	public function print_field(): void {
		echo '<tr><th>Site tag</th><td><input name="jetpack-twitter-cards-site-tag" /></td></tr>';
	}

	/**
	 * Nothing hooked means no section: an empty table under a heading, with a
	 * Save button that saves nothing, is worse than no section at all.
	 */
	public function test_renders_nothing_when_no_one_hooked_anything(): void {
		$this->assertSame( '', $this->render() );
	}

	/**
	 * With Sharing off this is the only thing firing `sharing_global_options`,
	 * so consumers gated on something other than the Sharing module — Twitter
	 * Cards is the live case — keep their settings reachable.
	 */
	public function test_renders_the_fields_a_consumer_hooked(): void {
		add_action( 'sharing_global_options', array( $this, 'print_field' ) );

		$this->assertStringContainsString( 'jetpack-twitter-cards-site-tag', $this->render() );
	}

	/**
	 * The fields are useless without a form the handler accepts. The nonce is
	 * verified rather than matched as a string, because a section signing with
	 * an action the handler does not check is the failure worth catching: the
	 * save would be rejected with the fields still on screen.
	 */
	public function test_posts_back_to_the_extras_save_action(): void {
		add_action( 'sharing_global_options', array( $this, 'print_field' ) );

		$markup = $this->render();

		$this->assertStringContainsString( 'name="jetpack_sharing_action" value="save-extras"', $markup );

		preg_match( '/name="_wpnonce" value="([^"]+)"/', $markup, $matches );

		$this->assertNotEmpty( $matches, 'The form carries no nonce.' );
		$this->assertSame( 1, wp_verify_nonce( $matches[1], Extras_Section::NONCE_ACTION ) );
	}
}
