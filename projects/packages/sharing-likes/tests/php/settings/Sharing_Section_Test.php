<?php
/**
 * Tests for the Sharing buttons section of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/class-sharing-service.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section
 */
#[CoversClass( Sharing_Section::class )]
class Sharing_Section_Test extends BaseTestCase {

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
		delete_option( 'sharing-services' );
		ob_start();
		Settings_Form::render();
		ob_end_clean();

		parent::tear_down();
	}

	/**
	 * Render the section and hand back its markup.
	 */
	private function render(): string {
		ob_start();
		Sharing_Section::render();

		return (string) ob_get_clean();
	}

	/**
	 * Put the site one click past "Switch to the Sharing Buttons block".
	 */
	private function given_block_route_and_sharing_off(): void {
		$this->given_block_theme();
		$this->given_block( 'jetpack/sharing-buttons' );
		$this->given_connection( true );
		$this->given_modules( array() );
	}

	/**
	 * The Jetpack dashboard drops the module toggle once the block is a route
	 * this site can take, so this screen does not offer one either: a site that
	 * has moved to the block is not invited back to the legacy buttons.
	 */
	public function test_offers_no_way_back_where_the_block_is_the_route(): void {
		$this->given_block_route_and_sharing_off();

		$markup = $this->render();

		$this->assertStringContainsString( 'site-editor.php', $markup );
		$this->assertStringNotContainsString( 'activate-sharing', $markup );
	}

	/**
	 * Without a block route nothing else on the site produces sharing buttons,
	 * so this is the one place the module can be switched back on. The nonce is
	 * verified rather than matched as a string, because a section signing with
	 * an action the handler does not check would be rejected on submit.
	 */
	public function test_offers_the_way_back_where_the_block_is_not(): void {
		$this->given_connection( true );
		$this->given_modules( array() );

		$markup = $this->render();

		$this->assertStringContainsString( 'name="jetpack_sharing_action" value="activate-sharing"', $markup );

		preg_match( '/name="_wpnonce" value="([^"]+)"/', $markup, $matches );

		$this->assertNotEmpty( $matches, 'The form carries no nonce.' );
		$this->assertSame( 1, wp_verify_nonce( $matches[1], Sharing_Section::NONCE_ACTION ) );
	}

	/**
	 * `Modules::activate()` refuses on a site that is neither connected nor
	 * offline, so the form would do nothing. Say what is missing instead.
	 */
	public function test_explains_itself_where_no_module_can_be_activated(): void {
		$this->given_connection( false );
		$this->given_modules( array() );

		$markup = $this->render();

		$this->assertStringNotContainsString( 'activate-sharing', $markup );
		$this->assertStringContainsString( 'Connect your site to WordPress.com', $markup );
	}

	/**
	 * A disconnected site keeps the module in its active list while
	 * `Jetpack::load_modules()` loads nothing, so `Sharing_Service` never
	 * exists there. Reading the module alone rendered a heading over an empty
	 * body; the section has to take its off variant instead.
	 */
	public function test_takes_the_off_variant_where_the_module_is_listed_but_cannot_load(): void {
		$this->given_connection( false );
		$this->given_modules( array( 'sharedaddy' ) );

		$markup = $this->render();

		$this->assertStringContainsString( 'Sharing buttons are turned off for this site.', $markup );
		$this->assertStringNotContainsString( 'currently appear on', $markup );
	}

	/**
	 * Simple cannot deactivate the module, so the nudge carries the switch itself.
	 */
	public function test_offers_the_switch_on_simple(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_block_theme();
		$this->given_block( 'jetpack/sharing-buttons' );

		$markup = $this->render();

		$this->assertStringContainsString( 'name="jetpack_sharing_action" value="switch-to-block-sharing"', $markup );
		$this->assertStringContainsString( 'Change where they appear', $markup );
	}

	/**
	 * With every service removed nothing renders, so the section drops the
	 * services list and points at the Site Editor alone.
	 */
	public function test_sends_simple_to_the_site_editor_once_switched_off(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_no_services();
		$this->given_block_theme();
		$this->given_block( 'jetpack/sharing-buttons' );

		$markup = $this->render();

		$this->assertStringContainsString( 'site-editor.php', $markup );
		$this->assertStringNotContainsString( 'switch-to-block-sharing', $markup );
		$this->assertStringNotContainsString( 'Change where they appear', $markup );
		$this->assertStringNotContainsString( 'save_services', $markup );
	}

	/**
	 * The module can stay active with no services left, which renders nothing just the same.
	 */
	public function test_drops_the_services_list_where_the_module_runs_with_no_services(): void {
		$this->given_no_services();
		$this->given_block_route_and_sharing_off();
		$this->given_modules( array( 'sharedaddy' ) );

		$markup = $this->render();

		$this->assertStringContainsString( 'site-editor.php', $markup );
		$this->assertStringNotContainsString( 'save_services', $markup );
		$this->assertStringNotContainsString( 'activate-sharing', $markup );
	}

	/**
	 * Without a block to move to, the services list is the only way back.
	 */
	public function test_keeps_the_services_list_with_no_services_on_a_classic_theme(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_no_services();

		$markup = $this->render();

		$this->assertStringContainsString( 'save_services', $markup );
		$this->assertStringNotContainsString( 'site-editor.php', $markup );
	}

	/**
	 * Leave the site with every service removed.
	 */
	private function given_no_services(): void {
		update_option(
			'sharing-services',
			array(
				'visible' => array(),
				'hidden'  => array(),
			)
		);
	}
}
