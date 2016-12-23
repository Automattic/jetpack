<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';

class Jetpack_Sync_Module_Posts extends Jetpack_Sync_Module {

	private $just_published = array();

	public function name() {
		return 'posts';
	}

	public function get_object_by_id( $object_type, $id ) {
		if ( $object_type === 'post' && $post = get_post( intval( $id ) ) ) {
			return $this->filter_post_content_and_add_links( $post );
		}

		return false;
	}

	public function set_defaults() {
	}

	public function init_listeners( $callable ) {
		add_action( 'wp_insert_post', $callable, 10, 3 );
		add_action( 'wp_insert_post', array( $this, 'send_published'), 11, 3 );
		add_action( 'deleted_post', $callable, 10 );
		add_action( 'jetpack_publicize_post', $callable );
		add_action( 'jetpack_published_post', $callable, 10, 2 );
		add_action( 'transition_post_status', array( $this, 'save_published' ), 10, 3 );
		add_filter( 'jetpack_sync_before_enqueue_wp_insert_post', array( $this, 'filter_blacklisted_post_types' ) );

		// listen for meta changes
		$this->init_listeners_for_meta_type( 'post', $callable );
		$this->init_meta_whitelist_handler( 'post', array( $this, 'filter_meta' ) );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_posts', $callable ); // also sends post meta
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_wp_insert_post', array( $this, 'expand_wp_insert_post' ) );

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_posts', array( $this, 'expand_post_ids' ) );
	}

	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		global $wpdb;

		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_posts', $wpdb->posts, 'ID', $this->get_where_sql( $config ), $max_items_to_enqueue, $state );
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

	// Meta
	function filter_meta( $args ) {
		if ( $this->is_post_type_allowed( $args[1] ) && $this->is_whitelisted_post_meta( $args[2] ) ) {
			return $args;
		}

		return false;
	}

	function is_whitelisted_post_meta( $meta_key ) {
		// _wpas_skip_ is used by publicize
		return in_array( $meta_key, Jetpack_Sync_Settings::get_setting( 'post_meta_whitelist' ) ) || wp_startswith( $meta_key, '_wpas_skip_' );
	}

	function is_post_type_allowed( $post_id ) {
		$post = get_post( $post_id );
		return ! in_array( $post->post_type, Jetpack_Sync_Settings::get_setting( 'post_types_blacklist' ) );
	}

	function remove_embed() {
		global $wp_embed;
		remove_filter( 'the_content', array( $wp_embed, 'run_shortcode' ), 8 );
		// remove the embed shortcode since we would do the part later.
		remove_shortcode( 'embed' );
		// Attempts to embed all URLs in a post
		remove_filter( 'the_content', array( $wp_embed, 'autoembed' ), 8 );
	}

	function add_embed() {
		global $wp_embed;
		add_filter( 'the_content', array( $wp_embed, 'run_shortcode' ), 8 );
		// Shortcode placeholder for strip_shortcodes()
		add_shortcode( 'embed', '__return_false' );
		// Attempts to embed all URLs in a post
		add_filter( 'the_content', array( $wp_embed, 'autoembed' ), 8 );
	}

	// Expands wp_insert_post to include filtered content
	function filter_post_content_and_add_links( $post_object ) {
		global $post, $shortcode_tags;
		$post = $post_object;

		// return non existant post 
		$post_type = get_post_type_object( $post->post_type );
		if ( empty( $post_type) || ! is_object( $post_type ) ) {
			$non_existant_post                    = new stdClass();
			$non_existant_post->ID                = $post->ID;
			$non_existant_post->post_modified     = $post->post_modified;
			$non_existant_post->post_modified_gmt = $post->post_modified_gmt;
			$non_existant_post->post_status       = 'jetpack_sync_non_registered_post_type';
			
			return $non_existant_post;
		}
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

		// lets not do oembed just yet.
		$this->remove_embed();

		if ( 0 < strlen( $post->post_password ) ) {
			$post->post_password = 'auto-' . wp_generate_password( 10, false );
		}

		/**
		 * Filter prevents some shortcodes from expanding.
		 *
		 * Since we can can expand some type of shortcode better on the .com side and make the
		 * expansion more relevant to contexts. For example [galleries] and subscription emails
		 *
		 * @since 4.5.0
		 *
		 * @param array of shortcode tags to remove.
		 */
		$shortcodes_to_remove = apply_filters( 'jetpack_sync_do_not_expand_shortcodes', array( 'gallery', 'slideshow' ) );
		foreach ( $shortcodes_to_remove as $shortcode ) {
			if ( isset ( $shortcode_tags[ $shortcode ] )  ) {
				$shortcodes_and_callbacks_to_remove[ $shortcode ] =  $shortcode_tags[ $shortcode ];
			}
		}

		array_map( 'remove_shortcode' , array_keys( $shortcodes_and_callbacks_to_remove ) );

		/** This filter is already documented in core. wp-includes/post-template.php */
		if ( Jetpack_Sync_Settings::get_setting( 'render_filtered_content' ) && $post_type->public  ) {
			$post->post_content_filtered   = apply_filters( 'the_content', $post->post_content );
			$post->post_excerpt_filtered   = apply_filters( 'the_excerpt', $post->post_excerpt );
		}

		foreach ( $shortcodes_and_callbacks_to_remove as $shortcode => $callback ) {
			add_shortcode( $shortcode, $callback );
		}

		$this->add_embed();

		if ( has_post_thumbnail( $post->ID ) ) {
			$image_attributes = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'full' );
			if ( is_array( $image_attributes ) && isset( $image_attributes[0] ) ) {
				$post->featured_image = $image_attributes[0];
			}
		}

		$post->permalink               = get_permalink( $post->ID );
		$post->shortlink               = wp_get_shortlink( $post->ID );

		return $post;
	}

	public function save_published( $new_status, $old_status, $post ) {
		if ( 'publish' === $new_status && 'publish' !== $old_status ) {
			$this->just_published[] = $post->ID;
		}
	}

	public function send_published( $post_ID, $post, $update ) {
		// Post revisions cause race conditions where this send_published add the action before the actual post gets synced
		if ( wp_is_post_autosave( $post ) || wp_is_post_revision( $post ) ) {
			return;
		}

		if ( ! empty( $this->just_published ) && in_array( $post_ID, $this->just_published ) ) {
			$published = array_reverse( array_unique( $this->just_published ) );
			
			// Pre 4.7 WP does not have run though send_published for every save_published call
			// So lets clear out any just_published that we recorded 
			foreach ( $published as $just_published_post_ID ) {
				if ( $post_ID !== $just_published_post_ID ) {
					$post = get_post( $just_published_post_ID );
				}

				/**
				 * Filter that is used to add to the post flags ( meta data ) when a post gets published
				 *
				 * @since 4.4.0
				 *
				 * @param mixed array post flags that are added to the post
				 * @param mixed $post WP_POST object
				 */
				$flags = apply_filters( 'jetpack_published_post_flags', array(), $post );

				/**
				 * Action that gets synced when a post type gets published.
				 *
				 * @since 4.4.0
				 *
				 * @param int post_id
				 * @param mixed array post flags that are added to the post
				 */
				do_action( 'jetpack_published_post', $just_published_post_ID, $flags );
			}
			$this->just_published = array();
		}
	}

	public function expand_post_ids( $args ) {
		$post_ids = $args[0];

		$posts = array_filter( array_map( array( 'WP_Post', 'get_instance' ), $post_ids ) );
		$posts = array_map( array( $this, 'filter_post_content_and_add_links' ), $posts );
		$posts = array_values( $posts ); // reindex in case posts were deleted

		return array(
			$posts,
			$this->get_metadata( $post_ids, 'post', Jetpack_Sync_Settings::get_setting( 'post_meta_whitelist' ) ),
			$this->get_term_relationships( $post_ids ),
		);
	}
}
