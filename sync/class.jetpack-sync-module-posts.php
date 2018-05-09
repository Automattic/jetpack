<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-item.php';

class Jetpack_Sync_Module_Posts extends Jetpack_Sync_Module {

	private $action_handler;

	private $sync_items = array(); // TODO: add to parent class

	const DEFAULT_PREVIOUS_STATE = 'new';

	public function name() {
		return 'posts';
	}

	public function get_object_by_id( $object_type, $id ) {
		if ( $object_type === 'post' && $post = get_post( intval( $id ) ) ) {
			return $this->filter_post_content_and_add_links( $post );
		}

		return false;
	}

	public function init_listeners( $callable ) {
		$this->action_handler = $callable;

		// Core < 4.7 doesn't deal with nested wp_insert_post calls very well
		global $wp_version;
		$priority = version_compare( $wp_version, '4.7-alpha', '<' ) ? 0 : 11;
		// Our aim is to initialize `sync_items` as early as possible, so that other areas of the code base can know
		// that we are within a post-saving operation. `wp_insert_post_parent` happens early within the action stack.
		// And we can catch editpost actions early by hooking to `check_admin_referrer`.
		add_filter( 'wp_insert_post_parent', array( $this, 'maybe_initialize_post_sync_item' ), 10, 3 );
		add_action( 'check_admin_referer', array( $this, 'maybe_initialize_post_sync_item_referer' ), 10, 2 );

		add_action( 'deleted_post', $callable );

		add_action( 'wp_insert_post', array( $this, 'maybe_sync_save_post' ), $priority, 3 );
		add_action( 'jetpack_post_saved', $callable, 10, 1 );
		add_action( 'jetpack_post_published', $callable, 10, 1 );

		add_action( 'transition_post_status', array( $this, 'save_published' ), 10, 3 );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_post_saved', array( $this, 'filter_blacklisted_post_types' ) );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_post_published', array( $this, 'filter_blacklisted_post_types' ) );


		add_action( 'added_post_meta', array( $this, 'sync_post_meta' ), 10, 4 );
		add_action( 'updated_post_meta', array( $this, 'sync_post_meta' ), 10, 4 );
		add_action( 'deleted_post_meta', array( $this, 'sync_post_meta' ), 10, 4 );

		add_action( 'set_object_terms', array( $this, 'sync_object_terms' ), 10, 6 );

		// Batch Akismet meta cleanup
		add_action( 'jetpack_daily_akismet_meta_cleanup_before', array( $this, 'daily_akismet_meta_cleanup_before' ) );
		add_action( 'jetpack_daily_akismet_meta_cleanup_after', array( $this, 'daily_akismet_meta_cleanup_after' ) );
		add_action( 'jetpack_post_meta_batch_delete', $callable, 10, 2 );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_posts', $callable ); // also sends post meta
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_posts' );
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
			$where_sql .= ' AND ID IN (' . implode( ',', array_map( 'intval', $config ) ) . ')';
		}
		return $where_sql;
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_post_saved', array( $this, 'expand_jetpack_post_saved' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_post_published', array( $this, 'expand_jetpack_post_saved' ) );

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_posts', array( $this, 'expand_post_ids' ) );
	}

	public function daily_akismet_meta_cleanup_before( $feedback_ids ) {
		remove_action( 'deleted_post_meta', array( $this, 'sync_post_meta' ) );
		/**
		 * Used for syncing deletion of batch post meta
		 *
		 * @since 6.1.0
		 *
		 * @module sync
		 *
		 * $param array $feedback_ids feedback post IDs
		 * $param string $meta_key to be deleted
		 */
		do_action( 'jetpack_post_meta_batch_delete', $feedback_ids, '_feedback_akismet_values');
	}
	public function daily_akismet_meta_cleanup_after( $feedback_ids ) {
		add_action( 'deleted_post_meta', array( $this, 'sync_post_meta' ), 10, 4 );
	}

	public function maybe_initialize_post_sync_item( $post_parent, $post_ID, $args ) {
		if ( $post_ID ) {
			$this->set_post_sync_item( $post_ID );
		} else if ( ! $this->is_attachment( $args ) ) {
			$this->set_post_sync_item( 'new' );
		}
		return $post_parent;
	}

	public function maybe_initialize_post_sync_item_referer( $action, $result ) {
		if ( ! $this->is_valid_editpost_action( $result )  ) {
			return;
		}
		$post_ID = $this->get_post_id_from_post_request();
		if ( ! $post_ID ) {
			return;
		}
		$this->set_post_sync_item( $post_ID );
	}

	private function is_attachment( $args ) {
		return ( isset( $args['post_type'] ) && 'attachment' === $args['post_type'] );
	}

	private function set_post_sync_item( $post_ID ) {
		if ( $this->has_sync_item( $post_ID ) ) {
			return;
		}
		if ( $this->has_sync_item( 'new' ) && 'new' !== $post_ID ) {
			$this->sync_items[ $post_ID ] = $this->sync_items['new'];
			unset( $this->sync_items['new'] );
			return;
		}
		$this->sync_items[ $post_ID ] = new Jetpack_Sync_Item( 'save_post' );
	}

	private function get_post_sync_item( $post_ID ) {
		$this->set_post_sync_item( $post_ID );
		return $this->sync_items[ $post_ID ];
	}

	private function has_sync_item( $post_id ) {
		return isset( $this->sync_items[ $post_id ] );
	}

	public function is_valid_editpost_action( $result ) {
		if ( ! $result ) {
			return false;
		}
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] || ! isset( $_POST['action'] ) || ! isset( $_POST['post_ID'] ) ) {
			return false;
		}
		if ( 'editpost' !== $_POST['action'] ) {
			return false;
		}
		return true;
	}

	private function get_post_id_from_post_request() {
		if ( ! isset( $_POST['post_ID' ] )  ) {
			return null;
		}
		return (int) $_POST['post_ID' ];
	}

	public function maybe_sync_save_post( $post_ID, $post = null, $update = null ) {
		if ( ! is_numeric( $post_ID ) || is_null( $post ) ) {
			return;
		}
		if ( $this->is_revision( $post ) ) {
			$this->process_revision( $post, $post_ID ); // todo: better name
			return;
		}
		// workaround for https://github.com/woocommerce/woocommerce/issues/18007
		if ( $post && 'shop_order' === $post->post_type ) {
			$post = get_post( $post_ID );
		}

		$sync_item = $this->get_post_sync_item( $post_ID );
		if ( ! $sync_item->state_isset( 'previous_status' ) ) {
			$sync_item->set_state_value( 'previous_status', self::DEFAULT_PREVIOUS_STATE );
		}
		$sync_item->set_state_value( 'is_auto_save', (bool) Jetpack_Constants::get_constant( 'DOING_AUTOSAVE' ) );
		$sync_item->set_state_value( 'update', $update );
		$author_user_object = get_user_by( 'id', $post->post_author );
		if ( $author_user_object ) {
			$sync_item->set_state_value( 'author',  array(
				'id'              => $post->post_author,
				'wpcom_user_id'   => get_user_meta( $post->post_author, 'wpcom_user_id', true ),
				'display_name'    => $author_user_object->display_name,
				'email'           => $author_user_object->user_email,
				'translated_role' => Jetpack::translate_user_to_role( $author_user_object ),
			) );
		}
		$sync_item->set_object( $post );
		if ( $sync_item->is_state_value_true( 'is_just_published' ) ) {
			$this->send_published( $sync_item );
		} else {
			/**
			 * Action that gets synced when a post type gets saved
			 *
			 * @since 6.2.0
			 *
			 * @param array Sync Item Payload [ 'object' => post object, 'terms' => related terms, 'state' => additional info about the post ]
			 */
			do_action( 'jetpack_post_saved', $sync_item->get_payload() );
		}
		unset( $this->sync_items[ $post_ID ] );
	}

	public function send_published( $sync_item ) {
		$post = $sync_item->get_object();
		// Post revisions cause race conditions where this send_published add the action before the actual post gets synced
		if ( wp_is_post_autosave( $post ) || wp_is_post_revision( $post ) ) {
			return;
		}
		/**
		 * Filter that is used to add to the post state when a post gets published
		 *
		 * @since 4.4.0
		 *
		 * @param mixed array Post state
		 * @param mixed $post WP_POST object
		 */
		$sync_item_state = apply_filters( 'jetpack_published_post_flags', $sync_item->get_state(), $post );
		$sync_item->set_state( $sync_item_state );
		/**
		 * Action that gets synced when a post type gets published.
		 *
		 * @since 6.2.0
		 *
		 * @param mixed $sync_item  object
		 */
		do_action( 'jetpack_post_published', $sync_item->get_payload() );
	}

	public function save_published( $new_status, $old_status, $post ) {
		$sync_item = $this->get_post_sync_item( $post->ID );
		$is_just_published = 'publish' === $new_status && 'publish' !== $old_status;
		$sync_item->set_state_value( 'is_just_published', $is_just_published );
		$sync_item->set_state_value( 'previous_status', $old_status );
	}

	private function is_revision( $post ) {
		return ( wp_is_post_revision( $post ) && $this->is_saving_post( $post->post_parent ) );
	}

	private function process_revision( $post, $post_ID ) {
		$post = (array) $post;
		unset( $post['post_content'] );
		unset( $post['post_title'] );
		unset( $post['post_excerpt'] );
		$sync_item = $this->sync_items[ $post['post_parent'] ];
		$sync_item->set_state_value( 'revision', $post );
		unset( $this->sync_items[ $post_ID ] );
	}

	public function filter_blacklisted_post_types( $args ) {
		$post = $args[0]['object'];
		if ( in_array( $post->post_type, Jetpack_Sync_Settings::get_setting( 'post_types_blacklist' ) ) ) {
			return false;
		}
		return $args;
	}

	public function sync_post_meta( $meta_id, $post_id, $meta_key, $_meta_value ) {
		if ( ! $this->is_post_type_allowed( $post_id ) || ! $this->is_whitelisted_post_meta( $meta_key ) ) {
			return;
		}

		if ( ! $this->is_saving_post( $post_id ) ) {
			call_user_func_array( $this->action_handler, func_get_args() );
			return;
		}
		// current_action() is 'added_post_meta', 'updated_post_meta' or 'deleted_post_meta'
		$sync_item = new Jetpack_Sync_Item( current_action(),
			array( $meta_id, $post_id, $meta_key, $_meta_value )
		);
		$this->add_sync_item( $post_id, $sync_item );
	}

	public function is_saving_post( $post_ID ) {
		return $this->has_sync_item( $post_ID ) || $this->has_sync_item( 'new' );
	}

	private function is_post_type_allowed( $post_id ) {
		$post = get_post( intval( $post_id ) );
		if ( $post->post_type ) {
			return ! in_array( $post->post_type, Jetpack_Sync_Settings::get_setting( 'post_types_blacklist' ) );
		}
		return false;
	}

	private function is_whitelisted_post_meta( $meta_key ) {
		// _wpas_skip_ is used by publicize
		return in_array( $meta_key, Jetpack_Sync_Settings::get_setting( 'post_meta_whitelist' ) ) || wp_startswith( $meta_key, '_wpas_skip_' );
	}

	public function sync_object_terms( $post_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids ) {
		if ( ! $this->is_saving_post( $post_id ) ) {
			return;
		}
		$sync_item = new Jetpack_Sync_Item( 'set_object_terms',
			array( $post_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids )
		);
		$this->add_sync_item( $post_id, $sync_item );
	}

	public function add_sync_item( $post_id, $sync_item ) {
		if ( $this->has_sync_item( 'new' ) && ! $this->has_sync_item( $post_id ) ) {
			$this->sync_items[ $post_id ] = $this->sync_items['new'];
			unset( $this->sync_items['new'] );
		}
		$this->sync_items[ $post_id ]->add_sync_item( $sync_item );
	}

	/**
	 * Process content before send
	 *
	 * @param array $args sync_post_saved arguments
	 *
	 * @return array
	 */
	public function expand_jetpack_post_saved( $args ) {
		$args[0]['object'] = $this->filter_post_content_and_add_links( $args[0]['object'] );
		return $args;
	}

	// Expands wp_insert_post to include filtered content
	public function filter_post_content_and_add_links( $post_object ) {
		global $post;
		$post = $post_object;
		// return non existant post
		$post_type = get_post_type_object( $post->post_type );
		if ( empty( $post_type ) || ! is_object( $post_type ) ) {
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

		/** This filter is already documented in core. wp-includes/post-template.php */
		if ( Jetpack_Sync_Settings::get_setting( 'render_filtered_content' ) && $post_type->public ) {
			global $shortcode_tags;
			/**
			 * Filter prevents some shortcodes from expanding.
			 *
			 * Since we can can expand some type of shortcode better on the .com side and make the
			 * expansion more relevant to contexts. For example [galleries] and subscription emails
			 *
			 * @since 4.5.0
			 *
			 * @param array - of shortcode tags to remove.
			 */
			$shortcodes_to_remove        = apply_filters( 'jetpack_sync_do_not_expand_shortcodes', array(
				'gallery',
				'slideshow'
			) );
			$removed_shortcode_callbacks = array();
			foreach ( $shortcodes_to_remove as $shortcode ) {
				if ( isset ( $shortcode_tags[ $shortcode ] ) ) {
					$removed_shortcode_callbacks[ $shortcode ] = $shortcode_tags[ $shortcode ];
				}
			}
			array_map( 'remove_shortcode', array_keys( $removed_shortcode_callbacks ) );
			$post->post_content_filtered = apply_filters( 'the_content', $post->post_content );
			$post->post_excerpt_filtered = apply_filters( 'the_excerpt', $post->post_excerpt );
			foreach ( $removed_shortcode_callbacks as $shortcode => $callback ) {
				add_shortcode( $shortcode, $callback );
			}
		}

		$this->add_embed();
		if ( has_post_thumbnail( $post->ID ) ) {
			$image_attributes = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'full' );
			if ( is_array( $image_attributes ) && isset( $image_attributes[0] ) ) {
				$post->featured_image = $image_attributes[0];
			}
		}
		$post->permalink = get_permalink( $post->ID );
		$post->shortlink = wp_get_shortlink( $post->ID );
		if ( function_exists( 'amp_get_permalink' ) ) {
			$post->amp_permalink = amp_get_permalink( $post->ID );
		}
		return $post;
	}

	private function remove_embed() {
		global $wp_embed;
		remove_filter( 'the_content', array( $wp_embed, 'run_shortcode' ), 8 );
		// remove the embed shortcode since we would do the part later.
		remove_shortcode( 'embed' );
		// Attempts to embed all URLs in a post
		remove_filter( 'the_content', array( $wp_embed, 'autoembed' ), 8 );

	}

	private function add_embed() {
		global $wp_embed;
		add_filter( 'the_content', array( $wp_embed, 'run_shortcode' ), 8 );
		// Shortcode placeholder for strip_shortcodes()
		add_shortcode( 'embed', '__return_false' );
		// Attempts to embed all URLs in a post
		add_filter( 'the_content', array( $wp_embed, 'autoembed' ), 8 );
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
