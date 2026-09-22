<?php
/**
 * Tests for the Settings > Sharing screen registration.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/class-sharing-service.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';

/**
 * The screen exists whichever modules are active. That is the guarantee this
 * class was written for, and the one the old per-module registration could not
 * make: with sharedaddy, likes and comment-likes all off, there was no screen.
 *
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page
 */
#[CoversClass( Settings_Page::class )]
class Settings_Page_Test extends BaseTestCase {

	use Section_Environment;

	/**
	 * Start every case from a site with no theme, no blocks and no modules.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
	}

	/**
	 * Reset the module list and the menu globals between cases.
	 */
	public function tear_down() {
		global $submenu, $_registered_pages;

		$_GET = array();

		$this->tear_down_site();
		Constants::clear_constants();
		delete_option( 'sharing-services' );
		delete_option( 'disabled_likes' );
		delete_option( 'disabled_reblogs' );

		Jetpack_Options::delete_option( 'active_modules' );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'pre_admin_screen_sharing' );
		remove_all_actions( 'sharing_global_options' );

		$submenu           = array();
		$_registered_pages = array();

		parent::tear_down();
	}

	/**
	 * A user with the capability the screen registers against.
	 */
	private function create_user( string $role ): int {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'sharing_settings_' . $role,
				'user_pass'  => 'password',
				'user_email' => $role . '@example.com',
				'role'       => $role,
			)
		);

		$this->assertIsInt( $user_id );

		return $user_id;
	}

	/**
	 * Registers the submenu itself, rather than asserting that `init()` hooked
	 * the callback it unconditionally hooks: the tautology this replaces could
	 * not have failed for any module state.
	 *
	 * The slug is asserted as a literal because it is a URL other code builds
	 * by hand: `Services_Config` redirects to `page=sharing` after a services
	 * save, and `jetpack_likes_configuration_url()` points the module list here.
	 * Comparing against the constant would follow a rename that broke both.
	 */
	public function test_registers_the_menu_with_no_module_active(): void {
		global $submenu;

		Jetpack_Options::update_option( 'active_modules', array() );
		wp_set_current_user( $this->create_user( 'administrator' ) );

		Settings_Page::register_menu();

		$slugs = wp_list_pluck( $submenu['options-general.php'] ?? array(), 2 );

		$this->assertContains( 'sharing', $slugs );
	}

	/**
	 * Registering unconditionally must not mean registering for everyone.
	 */
	public function test_does_not_register_for_users_without_the_capability(): void {
		global $submenu;

		wp_set_current_user( $this->create_user( 'subscriber' ) );

		Settings_Page::register_menu();

		$slugs = wp_list_pluck( $submenu['options-general.php'] ?? array(), 2 );

		$this->assertNotContains( Settings_Page::SLUG, $slugs );
	}

	/**
	 * Render the screen and hand back its markup.
	 *
	 * With no module active and no connection, both feature sections take their
	 * off variants, which is what keeps this renderable without the plugin's
	 * `Sharing_Service` behind the services table.
	 */
	private function render_screen(): string {
		// The sections mint the nonces that authorise every save, so they render
		// only for the capability the submenu registers against.
		wp_set_current_user( $this->create_user( 'administrator' ) );

		ob_start();
		Settings_Page::render();

		return (string) ob_get_clean();
	}

	/**
	 * A user who cannot save must not be handed the nonces that authorise saving,
	 * even if something registers this screen against a weaker capability.
	 */
	public function test_renders_no_sections_for_a_user_without_the_capability(): void {
		wp_set_current_user( $this->create_user( 'subscriber' ) );

		ob_start();
		Settings_Page::render();
		$html = (string) ob_get_clean();

		$this->assertStringContainsString( 'Sharing Settings', $html );
		$this->assertStringNotContainsString( 'wp_nonce', $html );
		$this->assertStringNotContainsString( 'Like buttons', $html );
	}

	/**
	 * Third parties hang their own markup on this, and it is the one hook that
	 * fires from the top of the screen rather than from a section. Nothing in
	 * this package consumes it, so only a test keeps it from being dropped.
	 */
	public function test_fires_the_hook_third_parties_extend_the_screen_from(): void {
		add_action(
			'pre_admin_screen_sharing',
			static function () {
				echo '<p id="third-party-notice"></p>';
			}
		);

		$this->assertStringContainsString( 'third-party-notice', $this->render_screen() );
	}

	/**
	 * The confirmation is the only feedback a save gives, and the handler asks
	 * for it with the query argument it redirects back with.
	 */
	public function test_confirms_a_save_the_handler_redirected_back_from(): void {
		$_GET['update'] = 'saved';

		$this->assertStringContainsString( 'Settings have been saved', $this->render_screen() );
	}

	/**
	 * A plain visit is not a save, so it must not claim one happened.
	 */
	public function test_does_not_confirm_a_save_on_a_plain_visit(): void {
		$this->assertStringNotContainsString( 'Settings have been saved', $this->render_screen() );
	}

	/**
	 * Sections are ruled off from one another, but a section that declines to
	 * render must not leave a rule with nothing after it. Here the two feature
	 * sections render and the extras section does not, so there is exactly one.
	 */
	public function test_rules_off_between_sections_but_not_after_the_last(): void {
		$this->assertSame( 1, substr_count( $this->render_screen(), '<hr />' ) );
	}

	/**
	 * Hook a field onto `sharing_global_options`, as Twitter Cards does.
	 */
	private function given_extra_field(): void {
		add_action(
			'sharing_global_options',
			static function () {
				echo '<tr id="third-party-field"></tr>';
			}
		);
	}

	/**
	 * Leave the site with every sharing service removed.
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

	/**
	 * Once both features moved to their blocks, placement governs nothing left on
	 * the page. Fields like the Twitter Site Tag stay: the Sharing Buttons block reads it.
	 */
	public function test_leaves_the_block_prompts_and_the_extras_once_simple_switched_both_off(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_block_theme();
		$this->given_block( 'jetpack/sharing-buttons' );
		$this->given_block( 'jetpack/like' );
		$this->given_no_services();
		update_option( 'disabled_likes', 1 );
		update_option( 'disabled_reblogs', 1 );
		$this->given_extra_field();

		$html = $this->render_screen();

		$this->assertStringNotContainsString( 'id="' . Placement_Section::ANCHOR . '"', $html );
		$this->assertStringNotContainsString( 'sharing_save_services', $html );
		$this->assertStringNotContainsString( 'name="wpl_default"', $html );
		$this->assertSame( 1, substr_count( $html, 'third-party-field' ) );
		$this->assertStringContainsString( 'value="save-extras"', $html );
	}

	/**
	 * Fields hung off the services list move to the extras section when that list goes,
	 * even with the module still running.
	 */
	public function test_moves_third_party_fields_out_of_a_hidden_services_list(): void {
		$this->given_block_theme();
		$this->given_block( 'jetpack/sharing-buttons' );
		$this->given_connection( true );
		$this->given_modules( array( 'sharedaddy' ) );
		$this->given_no_services();
		$this->given_extra_field();

		$html = $this->render_screen();

		$this->assertStringNotContainsString( 'sharing_save_services', $html );
		$this->assertSame( 1, substr_count( $html, 'third-party-field' ) );
		$this->assertStringContainsString( 'value="save-extras"', $html );
	}
}
