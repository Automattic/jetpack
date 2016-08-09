<?php
/**
 * Public Post Preview
 *
 * Allows viewing posts on the frontend when the user is not logged in.
 */
class Jetpack_Public_Post_Preview {
	static $instance = null;
	static $query_var = 'jetpack_public_post_preview';

	/**
	 * Returns the single instance of the Jetpack_Public_Post_Preview object
	 *
	 * @since 4.4.0
	 *
	 * @return Jetpack_Public_Post_Preview
	 **/
	public static function get_instance() {
		if ( ! is_null( self::$instance ) ) {
			return self::$instance;
		}

		return self::$instance = new Jetpack_Public_Post_Preview();
	}

	function __construct() {
		if ( ! is_admin() ) {
			add_filter( 'pre_get_posts', array( $this, 'maybe_display_post' ) );
		}
	}

	public function draft_key_valid() {
		return true;
	}

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

	public function set_post_to_publish( $posts ) {
		remove_filter( 'posts_results', array( $this, 'set_post_to_publish' ), 10, 2 );

		if ( empty( $posts ) ) {
			return $posts;
		}

		$posts[0]->post_status = 'publish';

		// Disable comments and pings for this post.
		add_filter( 'comments_open', '__return_false' );
		add_filter( 'pings_open', '__return_false' );

		return $posts;
	}
}

Jetpack_Public_Post_Preview::get_instance();