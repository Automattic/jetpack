<?php
/**
 * Handles sitemap sticker functionality for WordPress.com hosting.
 *
 * @package wpcomsh
 */

/**
 * Class WPCOMSH_Sitemap_Sticker_Handlers
 *
 * Manages sitemap behavior based on blog stickers and site configuration.
 */
class WPCOMSH_Sitemap_Sticker_Handlers {

	/**
	 * Initialize sitemap sticker handlers.
	 */
	public static function init() {
		add_filter( 'jetpack_sitemap_suspend_cache_addition', array( __CLASS__, 'handle_cache_suspension' ), 10, 1 );
		add_filter( 'jetpack_sitemap_use_xmlwriter', '__return_true', 10, 1 ); // Remove once Atomic has updated Jetpack.
	}

	/**
	 * Handle sitemap cache suspension based on stickers.
	 *
	 * @param mixed $suspend_cache_addition Current suspension state.
	 * @return bool Whether to suspend cache addition.
	 */
	public static function handle_cache_suspension( $suspend_cache_addition ) {
		return self::check_sticker_activation( 'jetpack-sitemaps-suspend-cache-addition', $suspend_cache_addition );
	}

	/**
	 * Check if a blog sticker is active and should override the default behavior.
	 *
	 * @param string $sticker_name The sticker name to check.
	 * @param mixed  $default_value The default value to return if sticker is not active.
	 * @return mixed True if sticker is active, original value otherwise.
	 */
	private static function check_sticker_activation( $sticker_name, $default_value ) {
		if ( function_exists( 'has_blog_sticker' ) && has_blog_sticker( $sticker_name, Jetpack_Options::get_option( 'id' ) ) ) {
			return true;
		}

		if ( function_exists( 'wpcomsh_is_site_sticker_active' ) && wpcomsh_is_site_sticker_active( $sticker_name ) ) {
			return true;
		}

		return $default_value;
	}
}

// Initialize the handlers
WPCOMSH_Sitemap_Sticker_Handlers::init();
