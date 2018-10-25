<?php
/**
 * Does setup for Publicize in Gutenberg
 *
 * Enqueues UI resources and completes REST setup for enabling
 * Publicize in Gutenberg.
 *
 * @package Jetpack
 * @subpackage Publicize
 * @since 5.9.1
 */

/**
 * Class to set up Gutenberg editor support.
 *
 * @since 5.9.1
 */
class Publicize_REST_API {

	/**
	 * Instance of Publicize used to access data gathering utility methods.
	 *
	 * @since 5.9.1
	 * @var Publicize $publicize Instance of Jetpack Publicize class.
	 */
	private $publicize;

	/**
	 * Constructor for Publicize_REST_API
	 *
	 * Set up hooks to extend legacy Publicize behavior.
	 *
	 * @since 5.9.1
	 */
	public function __construct( $publicize ) {
		// Do edit page specific setup.
		// Priority 20 to make sure these scripts are enqueued after Gutenberg blocks,
		// which are also added to the `admin_enqueue_scripts` hook.
		add_action( 'admin_enqueue_scripts', array( $this, 'post_page_enqueue' ), 20 );

		$this->publicize = $publicize;
	}

	/**
	 * Retrieve current list of connected social accounts.
	 *
	 * Gets current list of connected accounts and send them as
	 * JSON encoded data.
	 *
	 * @see Publicize_Base::get_publicize_conns_test_results()
	 *
	 * @since 5.9.1
	 *
	 * @param WP_REST_Request $request Request instance from REST call.
	 *
	 * @return string JSON encoded connection list data.
	 */
	public function rest_get_publicize_connections() {
		return $this->publicize->get_publicize_conns_test_results();
	}

	/**
	 * Retrieve current list of connected social accounts for a given post.
	 *
	 * Gets current list of connected accounts and send them as
	 * JSON encoded data.
	 *
	 * @see Publicize::get_filtered_connection_data()
	 *
	 * @since 5.9.1
	 *
	 * @param WP_REST_Request $request Request instance from REST call.
	 *
	 * @return string JSON encoded connection list data.
	 */
	public function rest_get_publicize_connections_for_post( $request ) {
		$post_id = $request['post_id'];
		return $this->publicize->get_filtered_connection_data( $post_id );
	}

	/**
	 * Retrieve full list of available Publicize connection services
	 * send them as JSON encoded data.
	 *
	 * @see Publicize::get_available_service_data()
	 *
	 * @since 6.7.0
	 *
	 * @return string JSON encoded connection services data.
	 */
	public function rest_get_publicize_available_services() {
		/**
		 * We need this because Publicize::get_available_service_data() uses `Jetpack_Keyring_Service_Helper`
		 * and `Jetpack_Keyring_Service_Helper` relies on `menu_page_url()`.
		 *
		 * We also need add_submenu_page(), as the URLs for connecting each service
		 * rely on the `sharing` menu subpage being present.
		 */
		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );

		// The `sharing` submenu page must exist for service connect URLs to be correct.
		add_submenu_page( 'options-general.php', '', '', 'manage_options', 'sharing', '__return_empty_string' );

		return $this->publicize->get_available_service_data();
	}

	/**
	 * Check user capability for getting Publicize connection list from endpoint.
	 *
	 * @since 5.9.1
	 *
	 * @return boolean True if current user has 'publish_post' capability.
	 */
	public function rest_connections_permission_callback() {
		return current_user_can( 'publish_posts' );
	}

	/**
	 * Check post id validity for Publicize connection list REST endpoint.
	 *
	 * @since 5.9.1
	 *
	 * @param mixed $param post_id parameter from REST call.
	 *
	 * @return boolean True if post_id is valid integer
	 */
	public function rest_connections_validate_post_id( $param ) {
		return is_int( $param );
	}

	/**
	 * Enqueue scripts when they are needed for the edit page
	 *
	 * Enqueues necessary scripts for edit page for Gutenberg
	 * editor only.
	 *
	 * @since 5.9.1
	 *
	 * @param string $hook Current page url.
	 */
	public function post_page_enqueue( $hook ) {
		if ( ( 'post-new.php' === $hook || 'post.php' === $hook ) && ! isset( $_GET['classic-editor'] ) ) { // Input var okay.
			wp_enqueue_style( 'social-logos', null, array( 'genericons' ) );
		}
	}
}
