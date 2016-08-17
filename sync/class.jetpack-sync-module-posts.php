<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';

class Jetpack_Sync_Module_Posts extends Jetpack_Sync_Module {

	public function name() {
		return 'posts';
	}

	public function set_defaults() {
	}

	public function init_listeners( $callable ) {
		add_action( 'wp_insert_post', $callable, 10, 3 );
		add_action( 'deleted_post', $callable, 10 );
		add_action( 'jetpack_publicize_post', $callable );
		add_filter( 'jetpack_sync_before_enqueue_wp_insert_post', array( $this, 'filter_blacklisted_post_types' ) );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_posts', $callable ); // also sends post meta
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_wp_insert_post', array( $this, 'expand_wp_insert_post' ) );

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_posts', array( $this, 'expand_post_ids' ) );
	}

	public function enqueue_full_sync_actions( $config ) {
		global $wpdb;

		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_posts', $wpdb->posts, 'ID', $this->get_where_sql( $config ) );
	}

	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT count(*) FROM $wpdb->posts WHERE " . $this->get_where_sql( $config );
		$count = $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	private function get_where_sql( $config ) {
		$where_sql = Jetpack_Sync_Settings::get_blacklisted_post_types_sql();

		// config is a list of post IDs to sync
		if ( is_array( $config ) ) {
			$where_sql   .= ' AND ID IN (' . implode( ',', array_map( 'intval', $config ) ) . ')';
		}

		return $where_sql;
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

	function filter_blacklisted_post_types( $args ) {
		$post = $args[1];

		if ( in_array( $post->post_type, Jetpack_Sync_Settings::get_setting( 'post_types_blacklist' ) ) ) {
			return false;
		}

		return $args;
	}

	// Expands wp_insert_post to include filtered content
	function filter_post_content_and_add_links( $post_object ) {
		global $post;
		$post = $post_object;
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
		 * @param boolean false prevent post data from being synced to WordPress.com
		 * @param mixed $post WP_POST object
		 */
		if ( apply_filters( 'jetpack_sync_prevent_sending_post_data', false, $post ) ) {
			// We only send the bare necessary object to be able to create a checksum.
			$blocked_post                    = new stdClass();
			$blocked_post->ID                = $post->ID;
			$blocked_post->post_modified     = $post->post_modified;
			$blocked_post->post_modified_gmt = $post->post_modified_gmt;
			$blocked_post->post_status       = 'jetpack_sync_blocked';

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
		$post->dont_email_post_to_subs = Jetpack::is_module_active( 'subscriptions' ) ?
				get_post_meta( $post->ID, '_jetpack_dont_email_post_to_subs', true ) :
				true; // Don't email subscription if the subscription module is not active.

		return $post;
	}

	public function expand_post_ids( $args ) {
		$post_ids = $args[0];

		$posts = array_filter( array_map( array( 'WP_Post', 'get_instance' ), $post_ids ) );
		$posts = array_map( array( $this, 'filter_post_content_and_add_links' ), $posts );

		return array(
			$posts,
			$this->get_metadata( $post_ids, 'post' ),
			$this->get_term_relationships( $post_ids ),
		);
	}
}
