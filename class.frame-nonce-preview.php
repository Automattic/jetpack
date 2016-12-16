<?php

/**
 * Allows viewing posts on the frontend when the user is not logged in.
 */
class Jetpack_Frame_Nonce_Preview {
	static $instance = null;

	/**
	 * Returns the single instance of the Jetpack_Frame_Nonce_Preview object
	 *
	 * @since 4.3.0
	 *
	 * @return Jetpack_Frame_Nonce_Preview
	 **/
	public static function get_instance() {
		if ( ! is_null( self::$instance ) ) {
			return self::$instance;
		}

		return self::$instance = new Jetpack_Frame_Nonce_Preview();
	}

	function __construct() {
		if ( isset( $_GET['frame-nonce'] ) && ! is_admin() ) {
			add_filter( 'pre_get_posts', array( $this, 'maybe_display_post' ) );
		}
	}

	/**
	 * Verify that frame nonce exists, and if so, validate the nonce by calling WP.com.
	 *
	 * @since 4.3.0
	 *
	 * @return bool
	 */
	public function is_frame_nonce_valid() {
		if ( empty( $_GET[ 'frame-nonce' ] ) ) {
			return false;
		}

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.verifyFrameNonce', sanitize_key( $_GET['frame-nonce'] ) );

		if ( $xml->isError() ) {
			return false;
		}

		return (bool) $xml->getResponse();
	}

	/**
	 * Conditionally add a hook on posts_results if this is the main query, a preview, and singular.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_Query $query
	 *
	 * @return WP_Query
	 */
	public function maybe_display_post( $query ) {
		if (
			$query->is_main_query() &&
			$query->is_preview() &&
			$query->is_singular()
		) {
			add_filter( 'posts_results', array( $this, 'set_post_to_publish' ), 10, 2 );
		}

		return $query;
	}

	/**
	 * Conditionally set the first post to 'publish' if the frame nonce is valid and there is a post.
	 *
	 * @since 4.3.0
	 *
	 * @param array $posts
	 *
	 * @return array
	 */
	public function set_post_to_publish( $posts ) {
		remove_filter( 'posts_results', array( $this, 'set_post_to_publish' ), 10, 2 );

		if ( empty( $posts ) || is_user_logged_in() || ! $this->is_frame_nonce_valid() ) {
			return $posts;
		}

		$posts[0]->post_status = 'publish';

		// Disable comments and pings for this post.
		add_filter( 'comments_open', '__return_false' );
		add_filter( 'pings_open', '__return_false' );

		return $posts;
	}
}

Jetpack_Frame_Nonce_Preview::get_instance();
