<?php
/**
 * Puts a site into the states the Settings > Sharing sections branch on.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use Jetpack_Options;
use ReflectionProperty;

/**
 * Drives `Environment` through the real WordPress APIs it reads, so the section
 * tests exercise the same lookups the screen does rather than stubs of them.
 */
trait Section_Environment {

	/**
	 * Blocks registered by `given_block()`, to unregister afterwards.
	 *
	 * @var string[]
	 */
	private $registered_blocks = array();

	/**
	 * Make the fixture themes available and clear what the last case memoised.
	 */
	protected function set_up_site(): void {
		register_theme_directory( __DIR__ . '/../fixtures/themes' );
		$this->forget_single_template_editor_url();
		Status_Cache::clear();
	}

	/**
	 * Undo everything `given_*()` set, including state held outside the database.
	 */
	protected function tear_down_site(): void {
		foreach ( $this->registered_blocks as $name ) {
			unregister_block_type( $name );
		}
		$this->registered_blocks = array();

		remove_filter( 'stylesheet', array( $this, 'pin_stylesheet' ) );
		remove_filter( 'template', array( $this, 'pin_stylesheet' ) );
		$this->given_connection( false );
		remove_all_filters( 'jetpack_get_available_standalone_modules' );
		wp_clean_themes_cache();

		Jetpack_Options::delete_option( 'active_modules' );
		Status_Cache::clear();
		$this->forget_single_template_editor_url();
	}

	/**
	 * Activate a theme that ships `templates/single.html`, which is what makes
	 * `wp_is_block_theme()` true and gives `single_template_editor_url()` a target.
	 * Without this the site runs the suite's default, which is neither.
	 */
	protected function given_block_theme(): void {
		add_filter( 'stylesheet', array( $this, 'pin_stylesheet' ) );
		add_filter( 'template', array( $this, 'pin_stylesheet' ) );
		wp_clean_themes_cache();
	}

	/**
	 * Slug of the fixture theme, used as both stylesheet and template.
	 */
	public function pin_stylesheet(): string {
		return 'block-theme';
	}

	/**
	 * Register a block, as the Jetpack plugin does on `init`.
	 *
	 * @param string $name Fully qualified block name.
	 */
	protected function given_block( string $name ): void {
		register_block_type( $name );

		$this->registered_blocks[] = $name;
	}

	/**
	 * Mark modules active. `Modules::get_active()` intersects with
	 * `get_available()`, which without a Jetpack plugin to read module headers
	 * from is empty, so the slugs have to be offered as available too.
	 *
	 * @param string[] $modules Module slugs.
	 */
	protected function given_modules( array $modules ): void {
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_modules' ) );
		Jetpack_Options::update_option( 'active_modules', $modules );
	}

	/**
	 * Report every module this package branches on as available.
	 *
	 * @return string[]
	 */
	public function offer_modules(): array {
		return array( 'sharedaddy', 'likes', 'comment-likes' );
	}

	/**
	 * Give the site a WordPress.com connection, or take it away.
	 *
	 * `Manager::is_connected()` wants a blog ID and a blog token, and memoises
	 * the answer in a static, so the memo is dropped along with the options.
	 *
	 * @param bool $connected Whether the site should hold a connection.
	 */
	protected function given_connection( bool $connected ): void {
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
	 * Clear `Environment::$single_template_editor_url`, which otherwise leaks the first
	 * case's answer into the rest.
	 */
	private function forget_single_template_editor_url(): void {
		$property = new ReflectionProperty( Environment::class, 'single_template_editor_url' );
		// setAccessible() is a no-op as of PHP 8.1 and deprecated in 8.5; only needed on older versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}
}
