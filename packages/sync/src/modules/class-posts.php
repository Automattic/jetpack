<?php
/**
 * Posts sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Constants as Jetpack_Constants;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Sync\Settings;
use Automattic\Jetpack\Sync\Item;

/**
 * Class to handle sync for posts.
 */
class Posts extends Module {

	/**
	 * Action handler callable.
	 *
	 * @access private
	 *
	 * @var callable
	 */
	private $action_handler;

	/**
	 * Import end.
	 *
	 * @access private
	 *
	 * @todo This appears to be unused - let's remove it.
	 *
	 * @var boolean
	 */
	private $import_end = false;

	/**
	 * Default previous post state.
	 * Used for default previous post status.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const DEFAULT_PREVIOUS_STATE = 'new';

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'posts';
	}

	/**
	 * The table in the database.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function table_name() {
		return 'posts';
	}

	/**
	 * Retrieve a post by its ID.
	 *
	 * @access public
	 *
	 * @param string $object_type Type of the sync object.
	 * @param int    $id          ID of the sync object.
	 * @return \WP_Post|bool Filtered \WP_Post object, or false if the object is not a post.
	 */
	public function get_object_by_id( $object_type, $id ) {
		if ( 'post' === $object_type ) {
			$post = get_post( intval( $id ) );
			if ( $post ) {
				return $this->filter_post_content_and_add_links( $post );
			}
		}

		return false;
	}

	/**
	 * Initialize posts action listeners.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_listeners( $callable ) {
		$this->action_handler = $callable;

		// Our aim is to initialize `sync_items` as early as possible, so that other areas of the code base can know
		// that we are within a post-saving operation. `wp_insert_post_parent` happens early within the action stack.
		// And we can catch editpost actions early by hooking to `check_admin_referrer`.
		add_filter( 'wp_insert_post_parent', array( $this, 'maybe_initialize_post_sync_item' ), 10, 3 );
		add_action( 'check_admin_referer', array( $this, 'maybe_initialize_post_sync_item_referer' ), 10, 2 );

		add_action( 'wp_insert_post', array( $this, 'wp_insert_post' ), 11, 3 );
		add_action( 'jetpack_sync_save_post', $callable, 10, 4 );

		add_action( 'deleted_post', $callable, 10 );
		add_action( 'jetpack_published_post', $callable, 10, 2 );

		add_action( 'transition_post_status', array( $this, 'save_published' ), 10, 3 );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_sync_save_post', array( $this, 'filter_blacklisted_post_types' ) );

		// Listen for meta changes.
		$this->init_listeners_for_meta_type( 'post', $callable );
		$this->init_meta_whitelist_handler( 'post', array( $this, 'filter_meta' ) );

		add_action( 'jetpack_daily_akismet_meta_cleanup_before', array( $this, 'daily_akismet_meta_cleanup_before' ) );
		add_action( 'jetpack_daily_akismet_meta_cleanup_after', array( $this, 'daily_akismet_meta_cleanup_after' ) );
		add_action( 'jetpack_post_meta_batch_delete', $callable, 10, 2 );
	}

	/**
	 * Initalizes the post sync item early.
	 *
	 * @param int   $post_parent Post Parent ID.
	 * @param int   $post_ID Post ID.
	 * @param array $args an Array containing post data.
	 *
	 * @return mixed
	 */
	public function maybe_initialize_post_sync_item( $post_parent, $post_ID, $args ) {
		if ( $post_ID ) {
			$this->set_post_sync_item( $post_ID );
		} elseif ( ! $this->is_attachment( $args ) ) {
			$this->set_post_sync_item( 'new' );
		}
		return $post_parent;
	}

	/**
	 * Initalizes the post sync item early.
	 *
	 * @param string $action Not used.
	 * @param array  $result Used to check if it is not tull.
	 */
	public function maybe_initialize_post_sync_item_referer( $action, $result ) {
		if ( ! $this->is_valid_editpost_action( $result ) ) {
			return;
		}
		$post_ID = $this->get_post_id_from_post_request();
		if ( ! $post_ID ) {
			return;
		}
		$this->set_post_sync_item( $post_ID );
	}

	/**
	 * Sets the post sync item.
	 *
	 * @param int|string $post_ID Key under which to store the Sync Item on.
	 *
	 * @return Item
	 */
	private function set_post_sync_item( $post_ID ) {
		if ( $this->has_sync_item( $post_ID ) ) {
			return;
		}
		if ( $this->has_sync_item( 'new' ) && 'new' !== $post_ID ) {
			$this->sync_items[ $post_ID ] = $this->sync_items['new'];
			unset( $this->sync_items['new'] );
			return;
		}
		$this->sync_items[ $post_ID ] = new Item( 'save_post' );
	}

	/**
	 * Check if the post type is an attachment.
	 *
	 * @param array $args Post Arguments.
	 *
	 * @return bool
	 */
	private function is_attachment( $args ) {
		return ( isset( $args['post_type'] ) && 'attachment' === $args['post_type'] );
	}

	/**
	 * Checks if we already have a sync item with a particular post ID.
	 *
	 * @param string|int $post_ID Post Id.
	 *
	 * @return bool
	 */
	private function has_sync_item( $post_ID ) {
		return isset( $this->sync_items[ $post_ID ] );
	}

	/**
	 * Gets the post sync item.
	 *
	 * @param string|int $post_ID Post Id.
	 *
	 * @return Item
	 */
	private function get_post_sync_item( $post_ID ) {
		$this->set_post_sync_item( $post_ID );
		return $this->sync_items[ $post_ID ];
	}

	/**
	 * Checks if we area dealing with a valid post action.
	 *
	 * @param bool $result Result of the post edit action.
	 *
	 * @return bool
	 */
	private function is_valid_editpost_action( $result ) {
		if ( ! $result ) {
			return false;
		}
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] || ! isset( $_POST['action'] ) || ! isset( $_POST['post_ID'] ) ) {  // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return false;
		}
		if ( 'editpost' !== $_POST['action'] ) {  // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return false;
		}
		return true;
	}

	/**
	 * Gets the post ID from a post request.
	 *
	 * @return int|null Post Id.
	 */
	private function get_post_id_from_post_request() {
		if ( ! isset( $_POST['post_ID'] ) ) {  // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return null;
		}
		return (int) $_POST['post_ID'];  // phpcs:ignore WordPress.Security.NonceVerification.Missing
	}

	/**
	 * Before Akismet's daily cleanup of spam detection metadata.
	 *
	 * @access public
	 *
	 * @param array $feedback_ids IDs of feedback posts.
	 */
	public function daily_akismet_meta_cleanup_before( $feedback_ids ) {
		remove_action( 'deleted_post_meta', $this->action_handler );
		/**
		 * Used for syncing deletion of batch post meta
		 *
		 * @since 6.1.0
		 *
		 * @module sync
		 *
		 * @param array $feedback_ids feedback post IDs
		 * @param string $meta_key to be deleted
		 */
		do_action( 'jetpack_post_meta_batch_delete', $feedback_ids, '_feedback_akismet_values' );
	}

	/**
	 * After Akismet's daily cleanup of spam detection metadata.
	 *
	 * @access public
	 *
	 * @param array $feedback_ids IDs of feedback posts.
	 */
	public function daily_akismet_meta_cleanup_after( $feedback_ids ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		add_action( 'deleted_post_meta', $this->action_handler );
	}

	/**
	 * Initialize posts action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_posts', $callable ); // Also sends post meta.
	}

	/**
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_sync_save_post', array( $this, 'expand_jetpack_sync_save_post' ) );

		// Full sync.
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_posts', array( $this, 'expand_post_ids' ) );
	}

	/**
	 * Enqueue the posts actions for full sync.
	 *
	 * @access public
	 *
	 * @param array   $config               Full sync configuration for this sync module.
	 * @param int     $max_items_to_enqueue Maximum number of items to enqueue.
	 * @param boolean $state                True if full sync has finished enqueueing this module, false otherwise.
	 * @return array Number of actions enqueued, and next module state.
	 */
	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		global $wpdb;

		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_posts', $wpdb->posts, 'ID', $this->get_where_sql( $config ), $max_items_to_enqueue, $state );
	}

	/**
	 * Retrieve an estimated number of actions that will be enqueued.
	 *
	 * @access public
	 *
	 * @todo Use $wpdb->prepare for the SQL query.
	 *
	 * @param array $config Full sync configuration for this sync module.
	 * @return array Number of items yet to be enqueued.
	 */
	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT count(*) FROM $wpdb->posts WHERE " . $this->get_where_sql( $config );
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$count = $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	/**
	 * Retrieve the WHERE SQL clause based on the module config.
	 *
	 * @access public
	 *
	 * @param array $config Full sync configuration for this sync module.
	 * @return string WHERE SQL clause, or `null` if no comments are specified in the module config.
	 */
	public function get_where_sql( $config ) {
		$where_sql = Settings::get_blacklisted_post_types_sql();

		// Config is a list of post IDs to sync.
		if ( is_array( $config ) ) {
			$where_sql .= ' AND ID IN (' . implode( ',', array_map( 'intval', $config ) ) . ')';
		}

		return $where_sql;
	}

	/**
	 * Retrieve the actions that will be sent for this module during a full sync.
	 *
	 * @access public
	 *
	 * @return array Full sync actions of this module.
	 */
	public function get_full_sync_actions() {
		return array( 'jetpack_full_sync_posts' );
	}

	/**
	 * Process content before send.
	 *
	 * @param array $args Arguments of the `wp_insert_post` hook.
	 *
	 * @return array
	 */
	public function expand_jetpack_sync_save_post( $args ) {
		list( $post_id, $post, $update, $previous_state ) = $args;
		return array( $post_id, $this->filter_post_content_and_add_links( $post ), $update, $previous_state );
	}

	/**
	 * Filter all blacklisted post types.
	 *
	 * @param array $args Hook arguments.
	 * @return array|false Hook arguments, or false if the post type is a blacklisted one.
	 */
	public function filter_blacklisted_post_types( $args ) {
		$post = $args[1];

		if ( in_array( $post->post_type, Settings::get_setting( 'post_types_blacklist' ), true ) ) {
			return false;
		}

		return $args;
	}

	/**
	 * Filter all meta that is not blacklisted, or is stored for a disallowed post type.
	 *
	 * @param array $args Hook arguments.
	 * @return array|false Hook arguments, or false if meta was filtered.
	 */
	public function filter_meta( $args ) {
		if ( $this->is_post_type_allowed( $args[1] ) && $this->is_whitelisted_post_meta( $args[2] ) ) {
			return $args;
		}

		return false;
	}

	/**
	 * Whether a post meta key is whitelisted.
	 *
	 * @param string $meta_key Meta key.
	 * @return boolean Whether the post meta key is whitelisted.
	 */
	public function is_whitelisted_post_meta( $meta_key ) {
		// The _wpas_skip_ meta key is used by Publicize.
		return in_array( $meta_key, Settings::get_setting( 'post_meta_whitelist' ), true ) || wp_startswith( $meta_key, '_wpas_skip_' );
	}

	/**
	 * Whether a post type is allowed.
	 * A post type will be disallowed if it's present in the post type blacklist.
	 *
	 * @param int $post_id ID of the post.
	 * @return boolean Whether the post type is allowed.
	 */
	public function is_post_type_allowed( $post_id ) {
		$post = get_post( intval( $post_id ) );

		if ( isset( $post->post_type ) ) {
			return ! in_array( $post->post_type, Settings::get_setting( 'post_types_blacklist' ), true );
		}
		return false;
	}

	/**
	 * Remove the embed shortcode.
	 *
	 * @global $wp_embed
	 */
	public function remove_embed() {
		global $wp_embed;
		remove_filter( 'the_content', array( $wp_embed, 'run_shortcode' ), 8 );
		// remove the embed shortcode since we would do the part later.
		remove_shortcode( 'embed' );
		// Attempts to embed all URLs in a post.
		remove_filter( 'the_content', array( $wp_embed, 'autoembed' ), 8 );
	}

	/**
	 * Add the embed shortcode.
	 *
	 * @global $wp_embed
	 */
	public function add_embed() {
		global $wp_embed;
		add_filter( 'the_content', array( $wp_embed, 'run_shortcode' ), 8 );
		// Shortcode placeholder for strip_shortcodes().
		add_shortcode( 'embed', '__return_false' );
		// Attempts to embed all URLs in a post.
		add_filter( 'the_content', array( $wp_embed, 'autoembed' ), 8 );
	}

	/**
	 * Expands wp_insert_post to include filtered content
	 *
	 * @param \WP_Post $post_object Post object.
	 */
	public function filter_post_content_and_add_links( $post_object ) {
		global $post;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$post = $post_object;

		// Return non existant post.
		$post_type = get_post_type_object( $post->post_type );
		if ( empty( $post_type ) || ! is_object( $post_type ) ) {
			$non_existant_post                    = new \stdClass();
			$non_existant_post->ID                = $post->ID;
			$non_existant_post->post_modified     = $post->post_modified;
			$non_existant_post->post_modified_gmt = $post->post_modified_gmt;
			$non_existant_post->post_status       = 'jetpack_sync_non_registered_post_type';
			$non_existant_post->post_type         = $post->post_type;

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
		 *
		 * @since 4.2.0
		 *
		 * @param boolean false prevent post data from being synced to WordPress.com
		 * @param mixed $post \WP_Post object
		 */
		if ( apply_filters( 'jetpack_sync_prevent_sending_post_data', false, $post ) ) {
			// We only send the bare necessary object to be able to create a checksum.
			$blocked_post                    = new \stdClass();
			$blocked_post->ID                = $post->ID;
			$blocked_post->post_modified     = $post->post_modified;
			$blocked_post->post_modified_gmt = $post->post_modified_gmt;
			$blocked_post->post_status       = 'jetpack_sync_blocked';
			$blocked_post->post_type         = $post->post_type;

			return $blocked_post;
		}

		// lets not do oembed just yet.
		$this->remove_embed();

		if ( 0 < strlen( $post->post_password ) ) {
			$post->post_password = 'auto-' . wp_generate_password( 10, false );
		}

		/** This filter is already documented in core. wp-includes/post-template.php */
		if ( Settings::get_setting( 'render_filtered_content' ) && $post_type->public ) {
			global $shortcode_tags;
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
			$shortcodes_to_remove        = apply_filters(
				'jetpack_sync_do_not_expand_shortcodes',
				array(
					'gallery',
					'slideshow',
				)
			);
			$removed_shortcode_callbacks = array();
			foreach ( $shortcodes_to_remove as $shortcode ) {
				if ( isset( $shortcode_tags[ $shortcode ] ) ) {
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

	/**
	 * Handle transition from another post status to a published one.
	 *
	 * @param string   $new_status New post status.
	 * @param string   $old_status Old post status.
	 * @param \WP_Post $post       Post object.
	 */
	public function save_published( $new_status, $old_status, $post ) {
		$sync_item         = $this->get_post_sync_item( $post->ID );
		$is_just_published = 'publish' === $new_status && 'publish' !== $old_status;
		$sync_item->add_state_value( 'just_published', $is_just_published );
		$sync_item->add_state_value( 'previous_status', $old_status );
	}

	/**
	 * When publishing or updating a post, the Gutenberg editor sends two requests:
	 * 1. sent to WP REST API endpoint `wp-json/wp/v2/posts/$id`
	 * 2. sent to wp-admin/post.php `?post=$id&action=edit&classic-editor=1&meta_box=1`
	 *
	 * The 2nd request is to update post meta, which is not supported on WP REST API.
	 * When syncing post data, we will include if this was a meta box update.
	 *
	 * @todo Implement nonce verification.
	 *
	 * @return boolean Whether this is a Gutenberg meta box update.
	 */
	public function is_gutenberg_meta_box_update() {
		// phpcs:disable WordPress.Security.NonceVerification.Missing, WordPress.Security.NonceVerification.Recommended
		return (
			isset( $_POST['action'], $_GET['classic-editor'], $_GET['meta_box'] ) &&
			'editpost' === $_POST['action'] &&
			'1' === $_GET['classic-editor'] &&
			'1' === $_GET['meta_box']
			// phpcs:enable WordPress.Security.NonceVerification.Missing, WordPress.Security.NonceVerification.Recommended
		);
	}

	/**
	 * Handler for the wp_insert_post hook.
	 * Called upon creation of a new post.
	 *
	 * @param int      $post_ID Post ID.
	 * @param \WP_Post $post    Post object.
	 * @param boolean  $update  Whether this is an existing post being updated or not.
	 */
	public function wp_insert_post( $post_ID, $post = null, $update = null ) {
		if ( ! is_numeric( $post_ID ) || is_null( $post ) ) {
			return;
		}

		// Workaround for https://github.com/woocommerce/woocommerce/issues/18007.
		if ( $post && 'shop_order' === $post->post_type ) {
			$post = get_post( $post_ID );
		}

		$sync_item = $this->set_post_sync_item( $post_ID );

		if ( ! $sync_item->has_state( 'previous_status' ) ) {
			$sync_item->add_state_value( 'previous_status', self::DEFAULT_PREVIOUS_STATE );
		}

		$sync_item->add_state_value( 'is_auto_save', (bool) Jetpack_Constants::get_constant( 'DOING_AUTOSAVE' ) );
		$sync_item->add_state_value( 'is_gutenberg_meta_box_update', $this->is_gutenberg_meta_box_update() );
		/**
		 * Filter that is used to add to the post flags ( meta data ) when a post gets published
		 *
		 * @since 5.8.0
		 *
		 * @param int $post_ID the post ID
		 * @param mixed $post \WP_Post object
		 * @param bool  $update Whether this is an existing post being updated or not.
		 * @param mixed $state state
		 *
		 * @module sync
		 */
		do_action( 'jetpack_sync_save_post', $post_ID, $post, $update, $sync_item->get_state() );
		$sync_item->unset_state( 'previous_status' );
		$this->send_published( $post_ID, $post, $sync_item );
	}

	/**
	 * Send a published post for sync.
	 *
	 * @param int      $post_ID Post ID.
	 * @param \WP_Post $post    Post object.
	 * @param Item     $sync_item   Sync Item Object.
	 */
	public function send_published( $post_ID, $post, $sync_item ) {

		if ( ! $sync_item->is_state_value_true( 'just_published' ) ) {
			return;
		}

		// Post revisions cause race conditions where this send_published add the action before the actual post gets synced.
		if ( wp_is_post_autosave( $post ) || wp_is_post_revision( $post ) ) {
			return;
		}

		$post_flags = array(
			'post_type' => $post->post_type,
		);

		$author_user_object = get_user_by( 'id', $post->post_author );
		if ( $author_user_object ) {
			$roles                = new Roles();
			$post_flags['author'] = array(
				'id'              => $post->post_author,
				'wpcom_user_id'   => get_user_meta( $post->post_author, 'wpcom_user_id', true ),
				'display_name'    => $author_user_object->display_name,
				'email'           => $author_user_object->user_email,
				'translated_role' => $roles->translate_user_to_role( $author_user_object ),
			);
		}

		/**
		 * Filter that is used to add to the post flags ( meta data ) when a post gets published
		 *
		 * @since 4.4.0
		 *
		 * @param mixed array post flags that are added to the post
		 * @param mixed $post \WP_Post object
		 */
		$flags = apply_filters( 'jetpack_published_post_flags', $post_flags, $post );

		/**
		 * Action that gets synced when a post type gets published.
		 *
		 * @since 4.4.0
		 *
		 * @param int $post_ID
		 * @param mixed array $flags post flags that are added to the post
		 */
		do_action( 'jetpack_published_post', $post_ID, $flags );
		$sync_item->unset_state( 'just_published' );

		/**
		 * Send additional sync action for Activity Log when post is a Customizer publish
		 */
		if ( 'customize_changeset' === $post->post_type ) {
			$post_content = json_decode( $post->post_content, true );
			foreach ( $post_content as $key => $value ) {
				// Skip if it isn't a widget.
				if ( 'widget_' !== substr( $key, 0, strlen( 'widget_' ) ) ) {
					continue;
				}
				// Change key from "widget_archives[2]" to "archives-2".
				$key = str_replace( 'widget_', '', $key );
				$key = str_replace( '[', '-', $key );
				$key = str_replace( ']', '', $key );

				global $wp_registered_widgets;
				if ( isset( $wp_registered_widgets[ $key ] ) ) {
					$widget_data = array(
						'name'  => $wp_registered_widgets[ $key ]['name'],
						'id'    => $key,
						'title' => $value['value']['title'],
					);
					do_action( 'jetpack_widget_edited', $widget_data );
				}
			}
		}
	}

	/**
	 * Expand post IDs to post objects within a hook before they are serialized and sent to the server.
	 *
	 * @access public
	 *
	 * @param array $args The hook parameters.
	 * @return array $args The expanded hook parameters.
	 */
	public function expand_post_ids( $args ) {
		list( $post_ids, $previous_interval_end) = $args;

		$posts = array_filter( array_map( array( 'WP_Post', 'get_instance' ), $post_ids ) );
		$posts = array_map( array( $this, 'filter_post_content_and_add_links' ), $posts );
		$posts = array_values( $posts ); // Reindex in case posts were deleted.

		return array(
			$posts,
			$this->get_metadata( $post_ids, 'post', Settings::get_setting( 'post_meta_whitelist' ) ),
			$this->get_term_relationships( $post_ids ),
			$previous_interval_end,
		);
	}

	/**
	 * Gets a list of minimum and maximum object ids for each batch based on the given batch size.
	 *
	 * @access public
	 *
	 * @param int         $batch_size The batch size for objects.
	 * @param string|bool $where_sql  The sql where clause minus 'WHERE', or false if no where clause is needed.
	 *
	 * @return array|bool An array of min and max ids for each batch. FALSE if no table can be found.
	 */
	public function get_min_max_object_ids_for_batches( $batch_size, $where_sql = false ) {
		return parent::get_min_max_object_ids_for_batches( $batch_size, $this->get_where_sql( $where_sql ) );
	}
}
