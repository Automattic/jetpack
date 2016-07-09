<?php

class Jetpack_Sync_Module_Posts extends Jetpack_Sync_Module {

	public function name() {
		return 'posts';
	}

	public function set_defaults() {}

	public function init_listeners( $callable ) {
		add_action( 'wp_insert_post', $callable, 10, 3 );
		add_action( 'deleted_post', $callable, 10 );
		add_action( 'jetpack_publicize_post', $callable );

		// full sync
		add_action( 'jetpack_full_sync_posts', $callable ); // also sends post meta
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_wp_insert_post', array( $this, 'expand_wp_insert_post' ) );

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_posts', array( $this, 'expand_post_ids' ) );
	}

	public function enqueue_full_sync_actions() {
		global $wpdb;

		$post_type_sql = Jetpack_Sync_Defaults::get_blacklisted_post_types_sql();
		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_posts', $wpdb->posts, 'ID', $post_type_sql );
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_posts' );
	}

	/**
	 * Process content before send
	 */

	function expand_wp_insert_post( $args ) {
		return array( $args[0], $this->filter_post_content_and_add_links( $args[1] ), $args[2] );
	}

	// Expands wp_insert_post to include filtered content
	function filter_post_content_and_add_links( $post ) {

		/**
		 * Filters whether to prevent sending post data to .com
		 *
		 * Passing true to the filter will prevent the post data from being sent
		 * to the WordPress.com.
		 * Instead we pass data that will still enable us to do a checksum against the
		 * Jetpacks data but will prevent us from displaying the data on in the API as well as
		 * other services.
		 * @since 4.2.0
		 *
		 * @param boolean false prevent post data from bing sycned to WordPress.com
		 * @param mixed $post WP_POST object
		 */
		if ( apply_filters( 'jetpack_sync_prevent_sending_post_data', false, $post ) ) {
			// We only send the bare necessery object to be able to create a checksum.
			$blocked_post = new stdClass();
			$blocked_post->ID = $post->ID;
			$blocked_post->post_modified = $post->post_modified;
			$blocked_post->post_modified_gmt = $post->post_modified_gmt;
			$blocked_post->post_status = 'jetpack_sync_blocked';
			return $blocked_post;
		}

		if ( 0 < strlen( $post->post_password ) ) {
			$post->post_password = 'auto-' . wp_generate_password( 10, false );
		}
		/** This filter is already documented in core. wp-includes/post-template.php */
		$post->post_content_filtered   = apply_filters( 'the_content', $post->post_content );
		$post->post_excerpt_filtered   = apply_filters( 'the_content', $post->post_excerpt );
		$post->permalink               = get_permalink( $post->ID );
		$post->shortlink               = wp_get_shortlink( $post->ID );
		$post->dont_email_post_to_subs = get_post_meta( $post->ID, '_jetpack_dont_email_post_to_subs', true );

		return $post;
	}

	public function expand_post_ids( $args ) {
		$post_ids = $args[0];

		$posts = array_map( array( 'WP_Post', 'get_instance' ), $post_ids );
		$posts = array_map( array( $this, 'filter_post_content_and_add_links' ), $posts );

		return array(
			$posts,
			$this->get_metadata( $post_ids, 'post' ),
			$this->get_term_relationships( $post_ids )
		);
	}
}
