<?php

/**
 * Request that a piece of data on this WordPress install be synced back to the
 * Jetpack server for remote processing/notifications/etc
 */
class Jetpack_Sync {
	// What modules want to sync what content
	var $sync_conditions = array( 'posts' => array(), 'comments' => array() );

	// We keep track of all the options registered for sync so that we can sync them all if needed
	var $sync_options = array();

	// Keep trac of status transitions, which we wouldn't always know about on the Jetpack Servers but are important when deciding what to do with the sync.
	var $post_transitions = array();
	var $comment_transitions = array();

	// Objects to sync
	var $sync = array();

	function __construct() {
		// WP Cron action.  Only used on upgrade
		add_action( 'jetpack_sync_all_registered_options', array( $this, 'sync_all_registered_options' ) );
	}

/* Static Methods for Modules */

	/**
	 * @param string $file __FILE__
	 * @param array settings:
	 * 	post_types => array( post_type slugs   ): The post types to sync.  Default: post, page
	 *	post_stati => array( post_status slugs ): The post stati to sync.  Default: publish
	 */
	static function sync_posts( $file, array $settings = null ) {
		$jetpack = Jetpack::init();
		$args = func_get_args();
		return call_user_func_array( array( $jetpack->sync, 'posts' ), $args );
	}

	/**
	 * @param string $file __FILE__
	 * @param array settings:
	 * 	post_types    => array( post_type slugs      ): The post types to sync.     Default: post, page
	 *	post_stati    => array( post_status slugs    ): The post stati to sync.     Default: publish
	 *	comment_types => array( comment_type slugs   ): The comment types to sync.  Default: '', comment, trackback, pingback
	 * 	comment_stati => array( comment_status slugs ): The comment stati to sync.  Default: approved
	 */
	static function sync_comments( $file, array $settings = null ) {
		$jetpack = Jetpack::init();
		$args = func_get_args();
		return call_user_func_array( array( $jetpack->sync, 'comments' ), $args );
	}

	/**
	 * @param string $file __FILE__
	 * @param string $option, Option name to sync
	 * @param string $option ...
	 */
	static function sync_options( $file, $option /*, $option, ... */ ) {
		$jetpack = Jetpack::init();
		$args = func_get_args();
		return call_user_func_array( array( $jetpack->sync, 'options' ), $args );
	}

/* Internal Methods */

	/**
	 * Create a sync object/request
	 *
	 * @param string $object Type of object to sync -- [ post | comment | option ]
	 * @param int $id Unique identifier
	 * @param array $settings
	 */
	function register( $object, $id = false, array $settings = null ) {
		// Since we've registered something for sync, hook it up to execute on shutdown if we haven't already
		if ( !$this->sync ) {
			ignore_user_abort( true );
			add_action( 'shutdown', array( $this, 'sync' ), 9 ); // Right before async XML-RPC
		}

		$defaults = array(
			'on_behalf_of' => array(), // What modules want this data
		);
		$settings = wp_parse_args( $settings, $defaults );

		if ( !isset( $this->sync[$object] ) ) {
			$this->sync[$object] = array();
		}

		// Store the settings for this object
		if (
			// First time for this object
			!isset( $this->sync[$object][$id] )
		) {
			// Easy: store the current settings
			$this->sync[$object][$id] = $settings;
		} else {
			// Not as easy:  we have to manually merge the settings from previous runs for this object with the settings for this run

			$this->sync[$object][$id]['on_behalf_of'] = array_unique( array_merge( $this->sync[$object][$id]['on_behalf_of'], $settings['on_behalf_of'] ) );
		}

		$delete_prefix = 'delete_';
		if ( 0 === strpos( $object, $delete_prefix ) ) {
			$unset_object = substr( $object, strlen( $delete_prefix ) );
		} else {
			$unset_object = "{$delete_prefix}{$object}";
		}

		// Ensure post ... delete_post yields a delete operation
		// Ensure delete_post ... post yields a sync post operation
		// Ensure update_option() ... delete_option() ends up as a delete
		// Ensure delete_option() ... update_option() ends up as an update
		// Etc.
		unset( $this->sync[$unset_object][$id] );

		return true;
	}

	function get_common_sync_data() {
		$available_modules = Jetpack::get_available_modules();
		$active_modules = Jetpack::get_active_modules();
		$modules = array();
		foreach ( $available_modules as $available_module ) {
			$modules[$available_module] = in_array( $available_module, $active_modules );
		}
		$modules['vaultpress'] = class_exists( 'VaultPress' ) || function_exists( 'vaultpress_contact_service' );

		$sync_data = array(
			'modules' => $modules,
			'version' => JETPACK__VERSION,
		);

		return $sync_data;
	}

	/**
	 * Set up all the data and queue it for the outgoing XML-RPC request
	 */
	function sync() {
		if ( !$this->sync ) {
			return false;
		}

		$sync_data = $this->get_common_sync_data();

		$wp_importing = defined( 'WP_IMPORTING' ) && WP_IMPORTING;

		foreach ( $this->sync as $sync_operation_type => $sync_operations ) {
			switch ( $sync_operation_type ) {
			case 'post':
				if ( $wp_importing ) {
					break;
				}

				$global_post = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
				$GLOBALS['post'] = null;
				foreach ( $sync_operations as $post_id => $settings ) {
					$sync_data['post'][$post_id] = $this->get_post( $post_id );
					if ( isset( $this->post_transitions[$post_id] ) ) {
						$sync_data['post'][$post_id]['transitions'] = $this->post_transitions[$post_id];
					} else {
						$sync_data['post'][$post_id]['transitions'] = array( false, false );
					}
					$sync_data['post'][$post_id]['on_behalf_of'] = $settings['on_behalf_of'];
				}
				$GLOBALS['post'] = $global_post;
				unset( $global_post );
				break;
			case 'comment':
				if ( $wp_importing ) {
					break;
				}

				$global_comment = isset( $GLOBALS['comment'] ) ? $GLOBALS['comment'] : null;
				unset( $GLOBALS['comment'] );
				foreach ( $sync_operations as $comment_id => $settings ) {
					$sync_data['comment'][$comment_id] = $this->get_comment( $comment_id );
					if ( isset( $this->comment_transitions[$comment_id] ) ) {
						$sync_data['comment'][$comment_id]['transitions'] = $this->comment_transitions[$comment_id];
					} else {
						$sync_data['comment'][$comment_id]['transitions'] = array( false, false );
					}
					$sync_data['comment'][$comment_id]['on_behalf_of'] = $settings['on_behalf_of'];
				}
				$GLOBALS['comment'] = $global_comment;
				unset( $global_comment );
				break;
			case 'option' :
				foreach ( $sync_operations as $option => $settings ) {
					$sync_data['option'][$option] = array( 'value' => get_option( $option ) );
				}
				break;

			case 'delete_post':
			case 'delete_comment':
				foreach ( $sync_operations as $object_id => $settings ) {
					$sync_data[$sync_operation_type][$object_id] = array( 'on_behalf_of' => $settings['on_behalf_of'] );
				}
				break;
			case 'delete_option' :
				foreach ( $sync_operations as $object_id => $settings ) {
					$sync_data[$sync_operation_type][$object_id] = true;
				}
				break;
			}
		}

		Jetpack::xmlrpc_async_call( 'jetpack.syncContent', $sync_data );
	}

	/**
	 * Format and return content data from a direct xmlrpc request for it.
	 *
	 * @param array $content_ids: array( 'posts' => array of ids, 'comments' => array of ids, 'options' => array of options )
	 */
	function get_content( $content_ids ) {
		$sync_data = $this->get_common_sync_data();

		if ( isset( $content_ids['posts'] ) ) {
			foreach ( $content_ids['posts'] as $id ) {
				$sync_data['post'][$id] = $this->get_post( $id );
			}
		}

		if ( isset( $content_ids['comments'] ) ) {
			foreach ( $content_ids['comments'] as $id ) {
				$sync_data['comment'][$id] = $this->get_post( $id );
			}
		}

		if ( isset( $content_ids['options'] ) ) {
			foreach ( $content_ids['options'] as $option ) {
				$sync_data['option'][$option] = array( 'value' => get_option( $option ) );
			}
		}

		return $sync_data;
	}

	/**
	 * Helper method for registering a post for sync
	 *
	 * @param int $id wp_posts.ID
	 * @param array $settings Sync data
	 */
	function register_post( $id, array $settings = null ) {
		$id = (int) $id;
		if ( !$id ) {
			return false;
		}

		$post = get_post( $id );
		if ( !$post ) {
			return false;
		}

		$settings = wp_parse_args( $settings, array(
			'on_behalf_of' => array(),
		) );

		return $this->register( 'post', $id, $settings );
	}

	/**
	 * Helper method for registering a comment for sync
	 *
	 * @param int $id wp_comments.comment_ID
	 * @param array $settings Sync data
	 */
	function register_comment( $id, array $settings = null ) {
		$id = (int) $id;
		if ( !$id ) {
			return false;
		}

		$comment = get_comment( $id );
		if ( !$comment || empty( $comment->comment_post_ID ) ) {
			return false;
		}

		$post = get_post( $comment->comment_post_ID );
		if ( !$post ) {
			return false;
		}

		$settings = wp_parse_args( $settings, array(
			'on_behalf_of' => array(),
		) );

		return $this->register( 'comment', $id, $settings );
	}

/* Posts Sync */

	function posts( $file, array $settings = null ) {
		$module_slug = Jetpack::get_module_slug( $file );

		$defaults = array(
			'post_types' => array( 'post', 'page' ),
			'post_stati' => array( 'publish' ),
		);

		$this->sync_conditions['posts'][$module_slug] = wp_parse_args( $settings, $defaults );

		add_action( 'transition_post_status', array( $this, 'transition_post_status_action' ), 10, 3 );
		add_action( 'delete_post', array( $this, 'delete_post_action' ) );
	}

	function delete_post_action( $post_id ) {
		$post = get_post( $post_id );
		if ( !$post ) {
			return $this->register( 'delete_post', (int) $post_id );
		}

		$this->transition_post_status_action( 'delete', $post->post_status, $post );
	}

	function transition_post_status_action( $new_status, $old_status, $post ) {
		$sync = $this->get_post_sync_operation( $new_status, $old_status, $post, $this->sync_conditions['posts'] );
		if ( !$sync ) {
			// No module wants to sync this post
			return false;
		}

		// Track post transitions
		if ( isset( $this->post_transitions[$post->ID] ) ) {
			// status changed more than once - keep tha most recent $new_status
			$this->post_transitions[$post->ID][0] = $new_status;
		} else {
			$this->post_transitions[$post->ID] = array( $new_status, $old_status );
		}

		$operation = $sync['operation'];
		unset( $sync['operation'] );

		switch ( $operation ) {
		case 'delete' :
			return $this->register( 'delete_post', (int) $post->ID, $sync );
		case 'submit' :
			return $this->register_post( (int) $post->ID, $sync );
		}
	}

	function get_post_sync_operation( $new_status, $old_status, $post, $module_conditions ) {
		$delete_on_behalf_of = array();
		$submit_on_behalf_of = array();
		$delete_stati = array( 'delete' );

		foreach ( $module_conditions as $module => $conditions ) {
			if ( !in_array( $post->post_type, $conditions['post_types'] ) ) {
				continue;
			}

			$deleted_post = in_array( $new_status, $delete_stati );

			if ( $deleted_post ) {
				$delete_on_behalf_of[] = $module;
			} else {
				clean_post_cache( $post->ID );
				$new_status = get_post_status( $post->ID ); // Inherited status is resolved here
			}

			$old_status_in_stati = in_array( $old_status, $conditions['post_stati'] );
			$new_status_in_stati = in_array( $new_status, $conditions['post_stati'] );

			if ( $old_status_in_stati && !$new_status_in_stati ) {
				// Jetpack no longer needs the post
				if ( !$deleted_post ) {
					$delete_on_behalf_of[] = $module;
				} // else, we've already flagged it above
				continue;
			}

			if ( !$new_status_in_stati ) {
				continue;
			}

			// At this point, we know we want to sync the post, not delete it
			$submit_on_behalf_of[] = $module;
		}

		if ( !empty( $submit_on_behalf_of ) ) {
			return array( 'operation' => 'submit', 'on_behalf_of' => $submit_on_behalf_of );
		}

		if ( !empty( $delete_on_behalf_of ) ) {
			return array( 'operation' => 'delete', 'on_behalf_of' => $delete_on_behalf_of );
		}

		return false;
	}

	/**
	 * Get a post and associated data in the standard JP format.
	 * Cannot be called statically
	 *
	 * @param int $id Post ID
	 * @return Array containing full post details
	 */
	function get_post( $id ) {
		$post_obj = get_post( $id );
		if ( !$post_obj )
			return false;

		if ( is_callable( $post_obj, 'to_array' ) ) {
			// WP >= 3.5
			$post = $post_obj->to_array();
		} else {
			// WP < 3.5
			$post = get_object_vars( $post_obj );
		}

		if ( 0 < strlen( $post['post_password'] ) ) {
			$post['post_password'] = 'auto-' . wp_generate_password( 10, false ); // We don't want the real password.  Just pass something random.
		}

		// local optimizations
		unset(
			$post['filter'],
			$post['ancestors'],
			$post['post_content_filtered'],
			$post['to_ping'],
			$post['pinged']
		);

		if ( $this->is_post_public( $post ) ) {
			$post['post_is_public'] = Jetpack::get_option( 'public' );
		} else {
			//obscure content
			$post['post_content'] = '';
			$post['post_excerpt'] = '';
			$post['post_is_public'] = false;
		}
		$post_type_obj = get_post_type_object( $post['post_type'] );
		$post['post_is_excluded_from_search'] = $post_type_obj->exclude_from_search;

		$post['tax'] = array();
		$taxonomies = get_object_taxonomies( $post_obj );
		foreach ( $taxonomies as $taxonomy ) {
			$terms = get_object_term_cache( $post_obj->ID, $taxonomy );
			if ( empty( $terms ) )
				$terms = wp_get_object_terms( $post_obj->ID, $taxonomy );
			$term_names = array();
			foreach ( $terms as $term ) {
				$term_names[] = $term->name;
			}
			$post['tax'][$taxonomy] = $term_names;
		}

		$meta = get_post_meta( $post_obj->ID, false );
		$post['meta'] = array();
		foreach ( $meta as $key => $value ) {
			$post['meta'][$key] = array_map( 'maybe_unserialize', $value );
		}

		$post['extra'] = array(
			'author' => get_the_author_meta( 'display_name', $post_obj->post_author ),
			'author_email' => get_the_author_meta( 'email', $post_obj->post_author ),
		);

		if ( $fid = get_post_thumbnail_id( $id ) ) {
			$feature = wp_get_attachment_image_src( $fid, 'large' );
			if ( !empty( $feature[0] ) )
				$post['extra']['featured_image'] = $feature[0];
		}

		$post['permalink'] = get_permalink( $post_obj->ID );
		$post['shortlink'] = wp_get_shortlink( $post_obj->ID );
		return $post;
	}

	/**
	 * Decide whether a post/page/attachment is visible to the public.
	 *
	 * @param array $post
	 * @return bool
	 */
	function is_post_public( $post ) {
		if ( !is_array( $post ) ) {
			$post = (array) $post;
		}

		if ( 0 < strlen( $post['post_password'] ) )
			return false;
		if ( ! in_array( $post['post_type'], get_post_types( array( 'public' => true ) ) ) )
			return false;
		$post_status = get_post_status( $post['ID'] ); // Inherited status is resolved here.
		if ( ! in_array( $post_status, get_post_stati( array( 'public' => true ) ) ) )
			return false;
		return true;
	}

/* Comments Sync */

	function comments( $file, array $settings = null ) {
		$module_slug = Jetpack::get_module_slug( $file );

		$defaults = array(
			'post_types' => array( 'post', 'page' ),                            // For what post types will we sync comments?
			'post_stati' => array( 'publish' ),                                 // For what post stati will we sync comments?
			'comment_types' => array( '', 'comment', 'trackback', 'pingback' ), // What comment types will we sync?
			'comment_stati' => array( 'approved' ),                             // What comment stati will we sync?
		);

		$settings = wp_parse_args( $settings, $defaults );

		$this->sync_conditions['comments'][$module_slug] = $settings;

		add_action( 'wp_insert_comment',         array( $this, 'wp_insert_comment_action' ),         10, 2 );
		add_action( 'transition_comment_status', array( $this, 'transition_comment_status_action' ), 10, 3 );
		add_action( 'edit_comment',              array( $this, 'edit_comment_action' ) );
	}

	/*
	 * This is really annoying.  If you edit a comment, but don't change the status, WordPress doesn't fire the transition_comment_status hook.
	 * That means we have to catch these comments on the edit_comment hook, but ignore comments on that hook when the transition_comment_status does fire.
	 */
	function edit_comment_action( $comment_id ) {
		$comment = get_comment( $comment_id );
		$new_status = $this->translate_comment_status( $comment->comment_approved );
		add_action( "comment_{$new_status}_{$comment->comment_type}", array( $this, 'transition_comment_status_for_comments_whose_status_does_not_change' ), 10, 2 );
	}

	function wp_insert_comment_action( $comment_id, $comment ) {
		$this->transition_comment_status_action( $comment->comment_approved, 'new', $comment );
	}

	function transition_comment_status_for_comments_whose_status_does_not_change( $comment_id, $comment ) {
		if ( isset( $this->comment_transitions[$comment_id] ) ) {
			return $this->transition_comment_status_action( $comment->comment_approved, $this->comment_transitions[$comment_id][1], $comment );
		}

		return $this->transition_comment_status_action( $comment->comment_approved, $comment->comment_approved, $comment );
	}

	function translate_comment_status( $status ) {
		switch ( (string) $status ) {
		case '0' :
		case 'hold' :
			return 'unapproved';
		case '1' :
		case 'approve' :
			return 'approved';
		}

		return $status;
	}

	function transition_comment_status_action( $new_status, $old_status, $comment ) {
		$post = get_post( $comment->comment_post_ID );
		if ( !$post ) {
			return false;
		}

		foreach ( array( 'new_status', 'old_status' ) as $_status ) {
			$$_status = $this->translate_comment_status( $$_status );
		}

		// Track comment transitions
		if ( isset( $this->comment_transitions[$comment->comment_ID] ) ) {
			// status changed more than once - keep tha most recent $new_status
			$this->comment_transitions[$comment->comment_ID][0] = $new_status;
		} else {
			$this->comment_transitions[$comment->comment_ID] = array( $new_status, $old_status );
		}

		$post_sync = $this->get_post_sync_operation( $post->post_status, '_jetpack_test_sync', $post, $this->sync_conditions['comments'] );

		if ( !$post_sync ) {
			// No module wants to sync this comment because its post doesn't match any sync conditions
			return false;
		}

		if ( 'delete' == $post_sync['operation'] ) {
			// Had we been looking at post sync operations (instead of comment sync operations),
			// this comment's post would have been deleted.  Don't sync the comment.
			return false;
		}

		$delete_on_behalf_of = array();
		$submit_on_behalf_of = array();
		$delete_stati = array( 'delete' );

		foreach ( $this->sync_conditions['comments'] as $module => $conditions ) {
			if ( !in_array( $comment->comment_type, $conditions['comment_types'] ) ) {
				continue;
			}

			$deleted_comment = in_array( $new_status, $delete_stati );

			if ( $deleted_comment ) {
				$delete_on_behalf_of[] = $module;
			}

			$old_status_in_stati = in_array( $old_status, $conditions['comment_stati'] );
			$new_status_in_stati = in_array( $new_status, $conditions['comment_stati'] );

			if ( $old_status_in_stati && !$new_status_in_stati ) {
				// Jetpack no longer needs the comment
				if ( !$deleted_comment ) {
					$delete_on_behalf_of[] = $module;
				} // else, we've already flagged it above
				continue;
			}

			if ( !$new_status_in_stati ) {
				continue;
			}

			// At this point, we know we want to sync the comment, not delete it
			$submit_on_behalf_of[] = $module;
		}

		if ( ! empty( $submit_on_behalf_of ) ) {
			$this->register_post( $comment->comment_post_ID, array( 'on_behalf_of' => $submit_on_behalf_of ) );
			return $this->register_comment( $comment->comment_ID, array( 'on_behalf_of' => $submit_on_behalf_of ) );
		}

		if ( !empty( $delete_on_behalf_of ) ) {
			return $this->register( 'delete_comment', $comment->comment_ID, array( 'on_behalf_of' => $delete_on_behalf_of ) );
		}

		return false;
	}

	/**
	 * Get a comment and associated data in the standard JP format.
	 * Cannot be called statically
	 *
	 * @param int $id Comment ID
	 * @return Array containing full comment details
	 */
	function get_comment( $id ) {
		$comment_obj = get_comment( $id );
		if ( !$comment_obj )
			return false;
		$comment = get_object_vars( $comment_obj );

		$meta = get_comment_meta( $id, false );
		$comment['meta'] = array();
		foreach ( $meta as $key => $value ) {
			$comment['meta'][$key] = array_map( 'maybe_unserialize', $value );
		}

		return $comment;
	}

/* Options Sync */

	/* Ah... so much simpler than Posts and Comments :) */
	function options( $file, $option /*, $option, ... */ ) {
		$options = func_get_args();
		$file = array_shift( $options );

		$module_slug = Jetpack::get_module_slug( $file );

		if ( !isset( $this->sync_options[$module_slug] ) ) {
			$this->sync_options[$module_slug] = array();
		}

		foreach ( $options as $option ) {
			$this->sync_options[$module_slug][] = $option;
			add_action( "delete_option_{$option}", array( $this, 'deleted_option_action' ) );
			add_action( "update_option_{$option}", array( $this, 'updated_option_action' ) );
			add_action( "add_option_{$option}",    array( $this, 'added_option_action'   ) );
		}

		$this->sync_options[$module_slug] = array_unique( $this->sync_options[$module_slug] );
	}

	function deleted_option_action( $option ) {
		$this->register( 'delete_option', $option );
	}

	function updated_option_action( $old_value ) {
		// The value of $option isn't passed to the filter
		// Calculate it
		$option = current_filter();
		$prefix = 'update_option_';
		if ( 0 !== strpos( $option, $prefix ) ) {
			return;
		}
		$option = substr( $option, strlen( $prefix ) );

		$this->added_option_action( $option );
	}

	function added_option_action( $option ) {
		$this->register( 'option', $option );
	}

	function sync_all_module_options( $module_slug ) {
		if ( empty( $this->sync_options[$module_slug] ) ) {
			return;
		}

		foreach ( $this->sync_options[$module_slug] as $option ) {
			$this->added_option_action( $option );
		}
	}

	function sync_all_registered_options( $options = array() ) {
		if ( 'jetpack_sync_all_registered_options' == current_filter() ) {
			$all_registered_options = array_unique( call_user_func_array( 'array_merge', $this->sync_options ) );
			foreach ( $all_registered_options as $option ) {
				$this->added_option_action( $option );
			}
		} else {
			wp_schedule_single_event( time(), 'jetpack_sync_all_registered_options', array( $this->sync_options ) );
		}
	}
}
