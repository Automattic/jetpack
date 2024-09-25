<?php
/**
 * Comments sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;

/**
 * Class to handle sync for comments.
 */
class Comments extends Module {
	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'comments';
	}

	/**
	 * The id field in the database.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function id_field() {
		return 'comment_ID';
	}

	/**
	 * The table name.
	 *
	 * @access public
	 *
	 * @return string
	 * @deprecated since 3.11.0 Use table() instead.
	 */
	public function table_name() {
		_deprecated_function( __METHOD__, '3.11.0', 'Automattic\\Jetpack\\Sync\\Comments->table' );
		return 'comments';
	}

	/**
	 * The table in the database with the prefix.
	 *
	 * @access public
	 *
	 * @return string|bool
	 */
	public function table() {
		global $wpdb;
		return $wpdb->comments;
	}

	/**
	 * Retrieve a comment by its ID.
	 *
	 * @access public
	 *
	 * @param string $object_type Type of the sync object.
	 * @param int    $id          ID of the sync object.
	 * @return \WP_Comment|bool Filtered \WP_Comment object, or false if the object is not a comment.
	 */
	public function get_object_by_id( $object_type, $id ) {
		$comment_id = (int) $id;
		if ( 'comment' === $object_type ) {
			$comment = get_comment( $comment_id );
			if ( $comment ) {
				return $this->filter_comment( $comment );
			}
		}

		return false;
	}

	/**
	 * Initialize comments action listeners.
	 * Also responsible for initializing comment meta listeners.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_listeners( $callable ) {
		add_action( 'wp_insert_comment', $callable, 10, 2 );
		add_action( 'deleted_comment', $callable );
		add_action( 'trashed_comment', $callable );
		add_action( 'spammed_comment', $callable );
		add_action( 'trashed_post_comments', $callable, 10, 2 );
		add_action( 'untrash_post_comments', $callable );
		add_action( 'comment_approved_to_unapproved', $callable );
		add_action( 'comment_unapproved_to_approved', $callable );
		add_action( 'jetpack_modified_comment_contents', $callable, 10, 2 );
		add_action( 'untrashed_comment', $callable, 10, 2 );
		add_action( 'unspammed_comment', $callable, 10, 2 );
		add_filter( 'wp_update_comment_data', array( $this, 'handle_comment_contents_modification' ), 10, 3 );

		// comment actions.
		add_filter( 'jetpack_sync_before_enqueue_wp_insert_comment', array( $this, 'filter_jetpack_sync_before_enqueue_wp_insert_comment' ) );
		add_filter( 'jetpack_sync_before_enqueue_deleted_comment', array( $this, 'only_allow_white_listed_comment_types' ) );
		add_filter( 'jetpack_sync_before_enqueue_trashed_comment', array( $this, 'only_allow_white_listed_comment_types' ) );
		add_filter( 'jetpack_sync_before_enqueue_untrashed_comment', array( $this, 'only_allow_white_listed_comment_types' ) );
		add_filter( 'jetpack_sync_before_enqueue_spammed_comment', array( $this, 'only_allow_white_listed_comment_types' ) );
		add_filter( 'jetpack_sync_before_enqueue_unspammed_comment', array( $this, 'only_allow_white_listed_comment_types' ) );

		// comment status transitions.
		add_filter( 'jetpack_sync_before_enqueue_comment_approved_to_unapproved', array( $this, 'only_allow_white_listed_comment_type_transitions' ) );
		add_filter( 'jetpack_sync_before_enqueue_comment_unapproved_to_approved', array( $this, 'only_allow_white_listed_comment_type_transitions' ) );

		// Post Actions.
		add_filter( 'jetpack_sync_before_enqueue_trashed_post_comments', array( $this, 'filter_blacklisted_post_types' ) );
		add_filter( 'jetpack_sync_before_enqueue_untrash_post_comments', array( $this, 'filter_blacklisted_post_types' ) );

		/**
		 * Even though it's messy, we implement these hooks because
		 * the edit_comment hook doesn't include the data
		 * so this saves us a DB read for every comment event.
		 */
		foreach ( $this->get_whitelisted_comment_types() as $comment_type ) {
			foreach ( array( 'unapproved', 'approved' ) as $comment_status ) {
				$comment_action_name = "comment_{$comment_status}_{$comment_type}";
				add_action( $comment_action_name, $callable, 10, 2 );
				add_filter(
					'jetpack_sync_before_enqueue_' . $comment_action_name,
					array(
						$this,
						'expand_wp_insert_comment',
					)
				);
			}
		}

		// Listen for meta changes.
		$this->init_listeners_for_meta_type( 'comment', $callable );
		$this->init_meta_whitelist_handler( 'comment', array( $this, 'filter_meta' ) );
	}

	/**
	 * Handler for any comment content updates.
	 *
	 * @access public
	 *
	 * @param array $new_comment              The new, processed comment data.
	 * @param array $old_comment              The old, unslashed comment data.
	 * @param array $new_comment_with_slashes The new, raw comment data.
	 * @return array The new, processed comment data.
	 */
	public function handle_comment_contents_modification( $new_comment, $old_comment, $new_comment_with_slashes ) {
		$changes        = array();
		$content_fields = array(
			'comment_author',
			'comment_author_email',
			'comment_author_url',
			'comment_content',
		);
		foreach ( $content_fields as $field ) {
			if ( $new_comment_with_slashes[ $field ] !== $old_comment[ $field ] ) {
				$changes[ $field ] = array( $new_comment[ $field ], $old_comment[ $field ] );
			}
		}

		if ( ! empty( $changes ) ) {
			/**
			 * Signals to the sync listener that this comment's contents were modified and a sync action
			 * reflecting the change(s) to the content should be sent
			 *
			 * @since 1.6.3
			 * @since-jetpack 4.9.0
			 *
			 * @param int $new_comment['comment_ID'] ID of comment whose content was modified
			 * @param mixed $changes Array of changed comment fields with before and after values
			 */
			do_action( 'jetpack_modified_comment_contents', $new_comment['comment_ID'], $changes );
		}
		return $new_comment;
	}

	/**
	 * Initialize comments action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_comments', $callable ); // Also send comments meta.
	}

	/**
	 * Gets a filtered list of comment types that sync can hook into.
	 *
	 * @access public
	 *
	 * @return array Defaults to [ '', 'trackback', 'pingback' ].
	 */
	public function get_whitelisted_comment_types() {
		/**
		 * Comment types present in this list will sync their status changes to WordPress.com.
		 *
		 * @since 1.6.3
		 * @since-jetpack 7.6.0
		 *
		 * @param array A list of comment types.
		 */
		return apply_filters(
			'jetpack_sync_whitelisted_comment_types',
			array( '', 'comment', 'trackback', 'pingback', 'review' )
		);
	}

	/**
	 * Prevents any comment types that are not in the whitelist from being enqueued and sent to WordPress.com.
	 *
	 * @param array $args Arguments passed to wp_insert_comment, deleted_comment, spammed_comment, etc.
	 *
	 * @return bool or array $args Arguments passed to wp_insert_comment, deleted_comment, spammed_comment, etc.
	 */
	public function only_allow_white_listed_comment_types( $args ) {
		$comment = false;

		if ( isset( $args[1] ) ) {
			// comment object is available.
			$comment = $args[1];
		} elseif ( is_numeric( $args[0] ) ) {
			// comment_id is available.
			$comment = get_comment( $args[0] );
		}

		if (
			isset( $comment->comment_type )
			&& ! in_array( $comment->comment_type, $this->get_whitelisted_comment_types(), true )
		) {
			return false;
		}

		return $args;
	}

	/**
	 * Filter all blacklisted post types.
	 *
	 * @param array $args Hook arguments.
	 * @return array|false Hook arguments, or false if the post type is a blacklisted one.
	 */
	public function filter_blacklisted_post_types( $args ) {
		$post_id      = $args[0];
		$posts_module = Modules::get_module( 'posts' );
		'@phan-var Posts $posts_module';

		if ( false !== $posts_module && ! $posts_module->is_post_type_allowed( $post_id ) ) {
			return false;
		}

		return $args;
	}

	/**
	 * Prevents any comment types that are not in the whitelist from being enqueued and sent to WordPress.com.
	 *
	 * @param array $args Arguments passed to wp_{old_status}_to_{new_status}.
	 *
	 * @return bool or array $args Arguments passed to wp_{old_status}_to_{new_status}
	 */
	public function only_allow_white_listed_comment_type_transitions( $args ) {
		$comment = $args[0];

		if ( ! in_array( $comment->comment_type, $this->get_whitelisted_comment_types(), true ) ) {
			return false;
		}

		return $args;
	}

	/**
	 * Prevents any comment types that are not in the whitelist from being enqueued and sent to WordPress.com.
	 * Also expands comment data before being enqueued.
	 *
	 * @param array $args Arguments passed to wp_insert_comment.
	 *
	 * @return false or array $args Arguments passed to wp_insert_comment or false if the comment type is a blacklisted one.
	 */
	public function filter_jetpack_sync_before_enqueue_wp_insert_comment( $args ) {
		if ( false === $this->only_allow_white_listed_comment_types( $args ) ) {
			return false;
		}

		return $this->expand_wp_insert_comment( $args );
	}

	/**
	 * Whether a comment type is allowed.
	 * A comment type is allowed if it's present in the comment type whitelist.
	 *
	 * @param int $comment_id ID of the comment.
	 * @return boolean Whether the comment type is allowed.
	 */
	public function is_comment_type_allowed( $comment_id ) {
		$comment = get_comment( $comment_id );

		if ( isset( $comment->comment_type ) ) {
			return in_array( $comment->comment_type, $this->get_whitelisted_comment_types(), true );
		}
		return false;
	}

	/**
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		// Full sync.
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_comments', array( $this, 'expand_comment_ids' ) );
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
		if ( is_array( $config ) ) {
			return 'comment_ID IN (' . implode( ',', array_map( 'intval', $config ) ) . ')';
		}

		return '1=1';
	}

	/**
	 * Expand the comment status change before the data is serialized and sent to the server.
	 *
	 * @access public
	 * @todo This is not used currently - let's implement it.
	 *
	 * @param array $args The hook parameters.
	 * @return array The expanded hook parameters.
	 */
	public function expand_wp_comment_status_change( $args ) {
		return array( $args[0], $this->filter_comment( $args[1] ) );
	}

	/**
	 * Expand the comment creation before the data is added to the Sync queue.
	 *
	 * @access public
	 *
	 * @param array $args The hook parameters.
	 * @return array The expanded hook parameters.
	 */
	public function expand_wp_insert_comment( $args ) {
		return array( $args[0], $this->filter_comment( $args[1] ) );
	}

	/**
	 * Filter a comment object to the fields we need.
	 *
	 * @access public
	 *
	 * @param \WP_Comment $comment The unfiltered comment object.
	 * @return \WP_Comment Filtered comment object.
	 */
	public function filter_comment( $comment ) {
		/**
		 * Filters whether to prevent sending comment data to .com
		 *
		 * Passing true to the filter will prevent the comment data from being sent
		 * to the WordPress.com.
		 * Instead we pass data that will still enable us to do a checksum against the
		 * Jetpacks data but will prevent us from displaying the data on in the API as well as
		 * other services.
		 *
		 * @since 1.6.3
		 * @since-jetpack 4.2.0
		 *
		 * @param boolean false prevent post data from bing synced to WordPress.com
		 * @param mixed $comment WP_COMMENT object
		 */
		if ( apply_filters( 'jetpack_sync_prevent_sending_comment_data', false, $comment ) ) {
			$blocked_comment                   = new \stdClass();
			$blocked_comment->comment_ID       = $comment->comment_ID;
			$blocked_comment->comment_date     = $comment->comment_date;
			$blocked_comment->comment_date_gmt = $comment->comment_date_gmt;
			$blocked_comment->comment_approved = 'jetpack_sync_blocked';
			return $blocked_comment;
		}

		return $comment;
	}

	/**
	 * Whether a certain comment meta key is whitelisted for sync.
	 *
	 * @access public
	 *
	 * @param string $meta_key Comment meta key.
	 * @return boolean Whether the meta key is whitelisted.
	 */
	public function is_whitelisted_comment_meta( $meta_key ) {
		return in_array( $meta_key, Settings::get_setting( 'comment_meta_whitelist' ), true );
	}

	/**
	 * Handler for filtering out non-whitelisted comment meta.
	 *
	 * @access public
	 *
	 * @param array $args Hook args.
	 * @return array|boolean False if not whitelisted, the original hook args otherwise.
	 */
	public function filter_meta( $args ) {
		if ( $this->is_comment_type_allowed( $args[1] ) && $this->is_whitelisted_comment_meta( $args[2] ) ) {
			return $args;
		}

		return false;
	}

	/**
	 * Expand the comment IDs to comment objects and meta before being serialized and sent to the server.
	 *
	 * @access public
	 *
	 * @param array $args The hook parameters.
	 * @return array The expanded hook parameters.
	 */
	public function expand_comment_ids( $args ) {
		list( $comment_ids, $previous_interval_end ) = $args;
		$comments                                    = get_comments(
			array(
				'include_unapproved' => true,
				'comment__in'        => $comment_ids,
				'orderby'            => 'comment_ID',
				'order'              => 'DESC',
			)
		);

		return array(
			$comments,
			$this->get_metadata( $comment_ids, 'comment', Settings::get_setting( 'comment_meta_whitelist' ) ),
			$previous_interval_end,
		);
	}
}
