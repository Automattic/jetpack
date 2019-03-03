<?php
/**
 * Module Name: Related posts
 * Module Description: Keep visitors engaged on your blog by highlighting relevant and new content at the bottom of each published post.
 * Jumpstart Description: Keep visitors engaged on your blog by highlighting relevant and new content at the bottom of each published post.
 * First Introduced: 2.9
 * Sort Order: 29
 * Recommendation Order: 9
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Recommended
 * Feature: Engagement, Jumpstart
 * Additional Search Queries: related, jetpack related posts, related posts for wordpress, related posts, popular posts, popular, related content, related post, contextual, context, contextual related posts, related articles, similar posts, easy related posts, related page, simple related posts, free related posts, related thumbnails, similar, engagement, yet another related posts plugin
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
	 */
	private function __construct() {
		add_action( 'jetpack_module_loaded_related-posts', array( $this, 'action_on_load' ) );
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

		// Load Customizer controls.
		if ( class_exists( 'WP_Customize_Manager' ) ) {
			require_once 'related-posts/class.related-posts-customize.php';
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
