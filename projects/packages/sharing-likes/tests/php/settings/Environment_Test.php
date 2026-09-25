<?php
/**
 * Tests for the site state Settings > Sharing branches on.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionProperty;
use WorDBless\BaseTestCase;
use WP_Block_Template;

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Environment
 */
#[CoversClass( Environment::class )]
class Environment_Test extends BaseTestCase {

	/**
	 * Drop the memoised URL, which otherwise leaks the first case's answer into the rest.
	 */
	public function set_up() {
		parent::set_up();

		$this->forget_single_template_editor_url();
		// `Status` memoises offline mode across instances, so a case that read it leaks into the next.
		Status_Cache::clear();
		add_filter( 'stylesheet', array( $this, 'pin_stylesheet' ) );
	}

	/**
	 * Release the stylesheet, and leave nothing memoised for the next class.
	 */
	public function tear_down() {
		remove_filter( 'stylesheet', array( $this, 'pin_stylesheet' ) );
		remove_all_filters( 'pre_get_block_template' );
		remove_all_filters( 'get_block_template' );
		$this->given_connection( false );
		remove_all_filters( 'jetpack_get_available_standalone_modules' );
		$this->forget_single_template_editor_url();

		Constants::clear_constants();
		Status_Cache::clear();
		Jetpack_Options::delete_option( 'active_modules' );

		parent::tear_down();
	}

	/**
	 * Report the module slugs as available. `Modules::get_active()` intersects
	 * with `get_available()`, which without a Jetpack plugin to read module
	 * headers from is empty, so nothing counts as active until this is hooked.
	 *
	 * @return string[]
	 */
	public function offer_modules(): array {
		return array( 'sharedaddy', 'likes', 'comment-likes' );
	}

	/**
	 * Put the site in the state the sections branch on.
	 *
	 * @param string[] $modules   Modules to mark active.
	 * @param bool     $connected Whether the site holds a WordPress.com connection.
	 */
	private function given_site( array $modules, bool $connected ): void {
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_modules' ) );
		Jetpack_Options::update_option( 'active_modules', $modules );

		$this->given_connection( $connected );
	}

	/**
	 * Give the site a connection, or take it away. `Manager::is_connected()`
	 * wants a blog ID and a blog token, and memoises the answer in a static.
	 *
	 * @param bool $connected Whether the site should hold a connection.
	 */
	private function given_connection( bool $connected ): void {
		if ( $connected ) {
			Jetpack_Options::update_option( 'id', 12345 );
			Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		} else {
			Jetpack_Options::delete_option( 'id' );
			Jetpack_Options::delete_option( 'blog_token' );
		}

		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Clear `Environment::$single_template_editor_url`.
	 */
	private function forget_single_template_editor_url(): void {
		$property = new ReflectionProperty( Environment::class, 'single_template_editor_url' );
		// setAccessible() is a no-op as of PHP 8.1 and deprecated in 8.5; only needed on older versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Stylesheet used in place of whichever theme the suite activated.
	 */
	public function pin_stylesheet(): string {
		return 'twentytwentyfour';
	}

	/**
	 * Stand in for a theme that ships the template.
	 *
	 * @return WP_Block_Template
	 */
	public function supply_template() {
		return new WP_Block_Template();
	}

	/**
	 * The URL is a contract with the Site Editor router, so this asserts the
	 * encoded form rather than the parsed parameters: `p` opens the template,
	 * `path` would only open the template list.
	 */
	public function test_links_to_the_active_theme_single_template(): void {
		add_filter( 'pre_get_block_template', array( $this, 'supply_template' ) );

		$this->assertSame(
			admin_url( 'site-editor.php' ) . '?p=%2Fwp_template%2Ftwentytwentyfour%2F%2Fsingle&canvas=edit',
			Environment::single_template_editor_url()
		);
	}

	/**
	 * A block theme shipping only `index.html` has nowhere to send anyone, and
	 * callers read the empty string as "offer no Site Editor link".
	 *
	 * Returning null from `pre_get_block_template` does not short-circuit the
	 * lookup, so a WordPress that ships the pinned theme would resolve the
	 * template regardless; the post-lookup filter is the one that can empty it.
	 */
	public function test_is_empty_when_the_theme_has_no_single_template(): void {
		add_filter( 'get_block_template', '__return_null' );

		$this->assertSame( '', Environment::single_template_editor_url() );
	}

	/**
	 * `Modules::get_active()` never filters on connection, so a disconnected
	 * site still answers true to `is_active( 'likes' )` while being unable to
	 * render a Like button: the widget is keyed on the blog ID a connection
	 * provides. Reading the module alone would offer settings that do nothing.
	 */
	public function test_likes_are_unsupported_on_a_disconnected_site_that_still_lists_the_modules(): void {
		$this->given_site( array( 'likes', 'comment-likes' ), false );

		$this->assertFalse( Environment::likes_supported() );
		$this->assertFalse( Environment::likes_module_running() );
		$this->assertFalse( Environment::comment_likes_module_running() );
		$this->assertFalse( Environment::likes_settings_in_use() );
	}

	/**
	 * Comment Likes is gated the same way, and it is the reason the Likes
	 * settings can be in use with the Likes module off.
	 */
	public function test_comment_likes_alone_keeps_the_likes_settings_in_use(): void {
		$this->given_site( array( 'comment-likes' ), true );

		$this->assertFalse( Environment::likes_module_running() );
		$this->assertTrue( Environment::comment_likes_module_running() );
		$this->assertTrue( Environment::likes_settings_in_use() );
	}

	/**
	 * Every module counts as active on Simple, so the option is the only switch there.
	 */
	public function test_comment_likes_follow_the_option_on_simple(): void {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertFalse( Environment::comment_likes_enabled() );

		update_option( 'jetpack_comment_likes_enabled', 1 );
		$enabled = Environment::comment_likes_enabled();
		delete_option( 'jetpack_comment_likes_enabled' );

		$this->assertTrue( $enabled );
	}

	/**
	 * The module never reads Simple's option, so a stray copy of it must not tick the box.
	 */
	public function test_comment_likes_follow_the_module_off_wpcom(): void {
		update_option( 'jetpack_comment_likes_enabled', 1 );
		$this->given_site( array( 'likes' ), true );
		$without_module = Environment::comment_likes_enabled();

		$this->given_site( array( 'likes', 'comment-likes' ), true );
		$with_module = Environment::comment_likes_enabled();
		delete_option( 'jetpack_comment_likes_enabled' );

		$this->assertFalse( $without_module );
		$this->assertTrue( $with_module );
	}

	/**
	 * Simple's Comment Likes read only their own option, whatever the modules say.
	 */
	public function test_comment_likes_follow_the_likes_settings_off_wpcom_only(): void {
		$this->given_site( array( 'comment-likes' ), true );
		$jetpack = Environment::comment_likes_follow_likes_settings();

		Constants::set_constant( 'IS_WPCOM', true );
		$simple = Environment::comment_likes_follow_likes_settings();

		$this->assertTrue( $jetpack );
		$this->assertFalse( $simple );
	}

	/**
	 * With both Likes modules off, nothing reads the Likes settings, which is
	 * what takes the section to its off variant.
	 */
	public function test_likes_settings_are_unused_when_neither_likes_module_runs(): void {
		$this->given_site( array( 'sharedaddy' ), true );

		$this->assertTrue( Environment::sharing_module_running() );
		$this->assertFalse( Environment::likes_settings_in_use() );
	}

	/**
	 * With the module off and no wpcom platform loading sharedaddy for us,
	 * nothing produces sharing buttons, which is what takes the section to its
	 * off variant and hides the shared placement controls.
	 */
	public function test_sharing_does_not_run_when_the_module_is_off(): void {
		$this->given_site( array( 'likes' ), true );

		$this->assertFalse( Environment::sharing_module_running() );
	}

	/**
	 * Sharing needs no connection, but `Jetpack::load_modules()` loads nothing
	 * on a site that is neither connected nor offline, so the active module
	 * renders no buttons there and the section must not offer to configure them.
	 */
	public function test_sharing_does_not_run_on_a_disconnected_site_that_still_lists_the_module(): void {
		$this->given_site( array( 'sharedaddy' ), false );

		$this->assertFalse( Environment::sharing_module_running() );
	}

	/**
	 * Offline mode is the route by which a disconnected site still loads the module.
	 */
	public function test_sharing_keeps_running_offline(): void {
		$this->given_site( array( 'sharedaddy' ), false );
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$sharing_running = Environment::sharing_module_running();

		remove_filter( 'jetpack_offline_mode', '__return_true' );

		$this->assertTrue( $sharing_running );
	}

	/**
	 * Simple has no modules: both features load unconditionally there, so every
	 * lookup has to answer yes whatever `active_modules` holds.
	 */
	public function test_simple_sites_report_both_features_live_with_no_modules(): void {
		$this->given_site( array(), false );
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertTrue( Environment::sharing_module_running() );
		$this->assertTrue( Environment::likes_supported() );
		$this->assertTrue( Environment::likes_module_running() );
		$this->assertTrue( Environment::legacy_sharing_supported() );
	}

	/**
	 * `Modules::activate()` refuses on a site that is neither connected nor
	 * offline, so the off variant must not offer a button that cannot work.
	 */
	public function test_legacy_sharing_is_unsupported_while_disconnected_and_online(): void {
		$this->given_site( array(), false );

		$this->assertFalse( Environment::legacy_sharing_supported() );
	}

	/**
	 * Offline mode is the other route `Modules::activate()` accepts.
	 */
	public function test_legacy_sharing_is_supported_in_offline_mode(): void {
		$this->given_site( array(), false );
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$supported = Environment::legacy_sharing_supported();

		remove_filter( 'jetpack_offline_mode', '__return_true' );

		$this->assertTrue( $supported );
	}

	/**
	 * A connected site can activate, which is the common case behind the button.
	 */
	public function test_legacy_sharing_is_supported_on_a_connected_site(): void {
		$this->given_site( array(), true );

		$this->assertTrue( Environment::legacy_sharing_supported() );
	}
}
