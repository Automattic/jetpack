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

require_once __DIR__ . '/../lib/class-jetpack-likes-settings.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Extras_Section
 */
#[CoversClass( Extras_Section::class )]
class Extras_Section_Test extends BaseTestCase {

	use Section_Environment;

	/**
	 * This section only exists where the services list is hidden, which is what a
	 * site with no connection and no modules gives us.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
		$this->given_connection( false );
	}

	/**
	 * Leave nothing hooked for the next case.
	 */
	public function tear_down() {
		$this->tear_down_site();
		remove_all_actions( 'sharing_global_options' );
		remove_all_filters( 'jetpack_disable_twitter_cards' );
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
		Extras_Section::render();

		return trim( (string) ob_get_clean() );
	}

	/**
	 * Print a field, standing in for a third-party consumer.
	 */
	public function print_field(): void {
		echo '<tr><th>Third party</th><td><input name="third-party-field" /></td></tr>';
	}

	/**
	 * Nothing to show means no section: an empty table under a heading, with a
	 * Save button that saves nothing, is worse than no section at all.
	 */
	public function test_renders_nothing_when_nothing_wants_to_be_on_it(): void {
		add_filter( 'jetpack_disable_twitter_cards', '__return_true' );

		$this->assertSame( '', $this->render() );
	}

	/**
	 * The Site Tag still feeds the Sharing Buttons block with Sharing off, so it
	 * stays reachable, and "Disable CSS and JS", which only affects legacy buttons, does not.
	 */
	public function test_renders_the_site_tag_without_the_legacy_resources_setting(): void {
		$markup = $this->render();

		$this->assertStringContainsString( 'name="jetpack-twitter-cards-site-tag"', $markup );
		$this->assertStringNotContainsString( 'disable_resources', $markup );
	}

	/**
	 * With Sharing off this is the only thing firing `sharing_global_options`,
	 * so third-party consumers keep their settings reachable.
	 */
	public function test_renders_the_fields_a_consumer_hooked(): void {
		add_filter( 'jetpack_disable_twitter_cards', '__return_true' );
		add_action( 'sharing_global_options', array( $this, 'print_field' ) );

		$this->assertStringContainsString( 'third-party-field', $this->render() );
	}

	/**
	 * Third-party fields do not name the form, so they only save if the section attaches them.
	 */
	public function test_attaches_third_party_fields_to_the_page_form(): void {
		add_action( 'sharing_global_options', array( $this, 'print_field' ) );

		$markup = $this->render();

		$this->assertStringContainsString( '<input form="' . Settings_Form::ID . '" name="third-party-field"', $markup );
		$this->assertStringContainsString( 'value="' . Settings_Form::SECTION_EXTRAS . '"', $markup );
	}

	/**
	 * Simple hangs the legacy Likes options on the same action. The Likes section
	 * owns them, and a second set of the same radios would join the same form.
	 */
	public function test_leaves_out_the_legacy_likes_options_and_keeps_them_hooked(): void {
		$likes = new \Jetpack_Likes_Settings();
		add_action( 'sharing_global_options', array( $likes, 'admin_settings_init' ) );
		add_action( 'sharing_global_options', array( $this, 'print_field' ) );

		$markup = $this->render();

		$this->assertStringContainsString( 'third-party-field', $markup );
		$this->assertStringNotContainsString( 'legacy-likes-options', $markup );
		$this->assertSame( 10, has_action( 'sharing_global_options', array( $likes, 'admin_settings_init' ) ) );
	}

	/**
	 * With nothing else hooked, the legacy Likes options alone do not make a section.
	 */
	public function test_renders_nothing_when_only_the_legacy_likes_options_are_hooked(): void {
		add_filter( 'jetpack_disable_twitter_cards', '__return_true' );
		add_action( 'sharing_global_options', array( new \Jetpack_Likes_Settings(), 'admin_settings_init' ) );

		$this->assertSame( '', $this->render() );
	}
}
