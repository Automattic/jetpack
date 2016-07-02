<?php
/**
 * Module Name: Related Posts
 * Module Description: Increase page views by showing related content to your visitors.
 * Jumpstart Description: Keep visitors engaged on your blog by highlighting relevant and new content at the bottom of each published post.
 * First Introduced: 2.9
 * Sort Order: 29
 * Recommendation Order: 9
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Recommended
 * Feature: Engagement, Jumpstart
 * Additional Search Queries: related, related posts
 */
class Jetpack_RelatedPosts_Module {
	/**
	 * Class variables
	 */
	private static $__instance = null;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_RelatedPosts_Module' ) )
			self::$__instance = new Jetpack_RelatedPosts_Module();

		return self::$__instance;
	}

	/**
	 * Register actions and filters
	 *
	 * @uses add_action, add_filter
	 * @return null
	 */
	private function __construct() {
		add_action( 'jetpack_module_loaded_related-posts', array( $this, 'action_on_load' ) );
		add_action( 'jetpack_activate_module_related-posts', array( $this, 'set_default_options' ) );
		add_action( 'jetpack_update_default_options_module_related-posts', array( __CLASS__, 'set_default_options' ) );
	}

	/**
	 * This action triggers when module is activated.
	 * It set the default option for this module.
	 *
	 * @uses Jetpack_Options::get_option, Jetpack_Options::update_option
	 */
	public static function set_default_options() {
		if ( false === Jetpack_Options::get_option( 'relatedposts' ) ) {
			Jetpack_Options::update_option( 'relatedposts', 0 );
		}
	}

	/**
	 * This action triggers if the module is in an active state, load related posts and options.
	 *
	 * @uses Jetpack_RelatedPosts::init, is_admin, Jetpack::enable_module_configurable, Jetpack::module_configuration_load, Jetpack_Sync::sync_posts
	 * @return null
	 */
	public function action_on_load() {
		require_once 'related-posts/jetpack-related-posts.php';
		Jetpack_RelatedPosts::init();

		if ( is_admin() ) {
			// Enable "Configure" button on module card
			Jetpack::enable_module_configurable( __FILE__ );
			Jetpack::module_configuration_load( __FILE__, array( $this, 'module_configuration_load' ) );
		}
	}

	/**
	 * Redirect configure button to Settings > Reading
	 *
	 * @uses wp_safe_redirect, admin_url
	 * @return null
	 */
	public function module_configuration_load() {
		wp_safe_redirect( admin_url( 'options-reading.php#jetpack_relatedposts' ) );
		exit;
	}

}

// Do it.
Jetpack_RelatedPosts_Module::instance();
