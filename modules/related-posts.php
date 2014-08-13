<?php
/**
 * Module Name: Related Posts
 * Module Description: Display links to your related content under posts and pages.
 * First Introduced: 2.9
 * Sort Order: 29
 * Requires Connection: Yes
 * Auto Activate: No
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
		add_action( 'jetpack_activate_module_related-posts', array( $this, 'action_on_activate' ) );
	}

	/**
	 * This action triggers when module is activated.
	 *
	 * @uses self::_get_post_count_local, self::_get_post_count_cloud, Jetpack::init, Jetpack::sync_reindex_trigger
	 * @return null
	 */
	public function action_on_activate() {
		// Trigger reindex if we have a post count mismatch
		if ( $this->_get_post_count_local() != $this->_get_post_count_cloud() ) {
			Jetpack::init()->sync->reindex_trigger();
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

			// Sync new posts
			Jetpack_Sync::sync_posts( __FILE__ );
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

	private function _get_post_count_local() {
		global $wpdb;
		return (int) $wpdb->get_var(
			"SELECT count(*)
				FROM {$wpdb->posts}
				WHERE post_status = 'publish' AND post_password = ''"
		);
	}

	private function _get_post_count_cloud() {
		$blog_id = Jetpack::init()->get_option( 'id' );

		$body = array(
			'size' => 1,
		);

		$response = wp_remote_post(
			"https://public-api.wordpress.com/rest/v1/sites/$blog_id/search",
			array(
				'timeout' => 10,
				'user-agent' => 'jetpack_related_posts',
				'sslverify' => true,
				'body' => $body,
			)
		);

		if ( is_wp_error( $response ) ) {
			return 0;
		}

		$results = json_decode( wp_remote_retrieve_body( $response ), true );

		return (int) $results['results']['total'];
	}
}

// Do it.
Jetpack_RelatedPosts_Module::instance();
