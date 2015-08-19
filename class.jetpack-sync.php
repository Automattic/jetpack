<?php

/**
 * Request that a piece of data on this WordPress install be synced back to the
 * Jetpack server for remote processing/notifications/etc
 */
class Jetpack_Sync {
	// What modules want to sync what content
	public $sync_conditions = array( 'posts' => array(), 'comments' => array() );

	// We keep track of all the options registered for sync so that we can sync them all if needed
	public $sync_options = array();

	public $sync_constants = array();

	// Keep trac of status transitions, which we wouldn't always know about on the Jetpack Servers but are important when deciding what to do with the sync.
	public $post_transitions = array();
	public $comment_transitions = array();

	// Objects to sync
	public $sync = array();

	function __construct() {
		// WP Cron action.  Only used on upgrade
		add_action( 'jetpack_sync_all_registered_options', array( $this, 'sync_all_registered_options' ) );
		add_action( 'jetpack_heartbeat',  array( $this, 'sync_all_registered_options' ) );

		// Sync constants on heartbeat and plugin upgrade and connects
		add_action( 'jetpack_sync_all_registered_options', array( $this, 'sync_all_constants' ) );
		add_action( 'jetpack_heartbeat',  array( $this, 'sync_all_constants' ) );

		add_action( 'jetpack_activate_module', array( $this, 'sync_module_constants' ), 10, 1 );
	}

/* Static Methods for Modules */

	/**
	 * @param string $file __FILE__
	 * @param array settings:
	 * 	post_types => array( post_type slugs   ): The post types to sync.  Default: post, page
	 *	post_stati => array( post_status slugs ): The post stati to sync.  Default: publish
	 */
	static function sync_posts( $file, array $settings = null ) {
		if ( is_network_admin() ) return;
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
		if ( is_network_admin() ) return;
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
		if ( is_network_admin() ) return;
		$jetpack = Jetpack::init();
		$args = func_get_args();
		return call_user_func_array( array( $jetpack->sync, 'options' ), $args );
	}
	/**
	 * @param string $file __FILE__
	 * @param string $option, Option name to sync
	 * @param string $option ...
	 */
	static function sync_constant( $file, $constant ) {
		if ( is_network_admin() ) return;
		$jetpack = Jetpack::init();
		$args = func_get_args();
		return call_user_func_array( array( $jetpack->sync, 'constant' ), $args );
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
			if ( function_exists( 'ignore_user_abort' ) ) {
				ignore_user_abort( true );
			}
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
			'is_multisite' => is_multisite(),
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

		// Don't sync anything from a staging site.
		if ( Jetpack::is_development_mode() || Jetpack::jetpack_is_staging_site() ) {
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
					$sync_data['option'][ $option ] = array( 'value' => get_option( $option ) );
				}
				break;

			case 'constant' :
				foreach( $sync_operations as $constant => $settings ) {
					$sync_data['constant'][ $constant ] = array( 'value' => $this->get_constant( $constant ) );
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
		$cache_cleared = false;

		foreach ( $module_conditions as $module => $conditions ) {
			if ( !in_array( $post->post_type, $conditions['post_types'] ) ) {
				continue;
			}

			$deleted_post = in_array( $new_status, $delete_stati );

			if ( $deleted_post ) {
				$delete_on_behalf_of[] = $module;
			} else {
				if ( ! $cache_cleared ) {
					// inefficient to clear cache more than once
					clean_post_cache( $post->ID );
					$cache_cleared = true;
				}
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
			$post['post_is_public'] = Jetpack_Options::get_option( 'public' );
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
			'dont_email_post_to_subs' => get_post_meta( $post_obj->ID, '_jetpack_dont_email_post_to_subs', true ),
		);

		if ( $fid = get_post_thumbnail_id( $id ) ) {
			$feature = wp_get_attachment_image_src( $fid, 'large' );
			if ( ! empty( $feature[0] ) ) {
				$post['extra']['featured_image'] = $feature[0];
			}

			$attachment = get_post( $fid );
			if ( ! empty( $attachment ) ) {
				$metadata = wp_get_attachment_metadata( $fid );

				$post['extra']['post_thumbnail'] = array(
					'ID'        => (int) $fid,
					'URL'       => (string) wp_get_attachment_url( $fid ),
					'guid'      => (string) $attachment->guid,
					'mime_type' => (string) $attachment->post_mime_type,
					'width'     => (int) isset( $metadata['width'] ) ? $metadata['width'] : 0,
					'height'    => (int) isset( $metadata['height'] ) ? $metadata['height'] : 0,
				);

				if ( isset( $metadata['duration'] ) ) {
					$post['extra']['post_thumbnail'] = (int) $metadata['duration'];
				}

				/**
				 * Filters the Post Thumbnail information returned for a specific post.
				 *
				 * @since 3.3.0
				 *
				 * @param array $post['extra']['post_thumbnail'] {
				 * 	Array of details about the Post Thumbnail.
				 *	@param int ID Post Thumbnail ID.
				 *	@param string URL Post thumbnail URL.
				 *	@param string guid Post thumbnail guid.
				 *	@param string mime_type Post thumbnail mime type.
				 *	@param int width Post thumbnail width.
				 *	@param int height Post thumbnail height.
				 * }
				 */
				$post['extra']['post_thumbnail'] = (object) apply_filters( 'get_attachment', $post['extra']['post_thumbnail'] );
			}
		}

		$post['permalink'] = get_permalink( $post_obj->ID );
		$post['shortlink'] = wp_get_shortlink( $post_obj->ID );
		/**
		 * Allow modules to send extra info on the sync post process.
		 *
		 * @since 2.8.0
		 *
		 * @param array $args Array of custom data to attach to a post.
		 * @param Object $post_obj Object returned by get_post() for a given post ID.
		 */
		$post['module_custom_data'] = apply_filters( 'jetpack_sync_post_module_custom_data', array(), $post_obj );
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
			add_action( 'shutdown', array( $this, 'register_all_options' ), 8 );
		} else {
			wp_schedule_single_event( time(), 'jetpack_sync_all_registered_options', array( $this->sync_options ) );
		}
	}

	/**
	 * All the options that are defined in modules as well as class.jetpack.php will get synced.
	 * Registers all options to be synced.
	 */
	function register_all_options() {
		$all_registered_options = array_unique( call_user_func_array( 'array_merge', $this->sync_options ) );
		foreach ( $all_registered_options as $option ) {
			$this->added_option_action( $option );
		}
	}

/* Constants Sync */

	function sync_all_constants() {
		// list of contants to sync needed by Jetpack
		$constants = array(
			'EMPTY_TRASH_DAYS',
			'WP_POST_REVISIONS',
			'UPDATER_DISABLED',
			'AUTOMATIC_UPDATER_DISABLED',
			'ABSPATH',
			'WP_CONTENT_DIR',
			'FS_METHOD',
			'DISALLOW_FILE_EDIT',
			'DISALLOW_FILE_MODS',
			'WP_AUTO_UPDATE_CORE',
			'AUTOMATIC_UPDATER_DISABLED',
			'WP_HTTP_BLOCK_EXTERNAL',
			'WP_ACCESSIBLE_HOSTS',
			);

		// add the constant to sync.
		foreach( $constants as $contant ) {
			$this->register_constant( $contant );
		}

		add_action( 'shutdown', array( $this, 'register_all_module_constants' ), 8 );

	}

	function register_all_module_constants() {
		// also add the contstants from each module to be synced.
		foreach( $this->sync_constants as $module ) {
			foreach( $module as $constant ) {
				$this->register_constant( $constant );
			}
		}
	}

	/**
	 * Sync constants required by the module that was just activated.
 	 * If you add Jetpack_Sync::sync_constant( __FILE__, 'HELLO_WORLD' );
	 * to the module it will start syncing the constant after the constant has been updated.
	 *
	 * This function gets called on module activation.
	 */
	function sync_module_constants( $module ) {

		if ( isset( $this->sync_constants[ $module ] ) && is_array( $this->sync_constants[ $module ] ) ) {
			// also add the contstants from each module to be synced.
			foreach( $this->sync_constants[ $module ] as $constant ) {
				$this->register_constant(  $constant );
			}
		}
	}

	public function reindex_needed() {
		return ( $this->_get_post_count_local() != $this->_get_post_count_cloud() );
	}

	public function reindex_trigger() {
		$response = array( 'status' => 'ERROR' );

		// Force a privacy check
		Jetpack::check_privacy( JETPACK__PLUGIN_FILE );

		Jetpack::load_xml_rpc_client();
		$client = new Jetpack_IXR_Client( array(
			'user_id' => JETPACK_MASTER_USER,
		) );

		$client->query( 'jetpack.reindexTrigger' );

		if ( !$client->isError() ) {
			$response = $client->getResponse();
			Jetpack_Options::update_option( 'sync_bulk_reindexing', true );
		}

		return $response;
	}

	public function reindex_status() {
		$response = array( 'status' => 'ERROR' );

		// Assume reindexing is done if it was not triggered in the first place
		if ( false === Jetpack_Options::get_option( 'sync_bulk_reindexing' ) ) {
			return array( 'status' => 'DONE' );
		}

		Jetpack::load_xml_rpc_client();
		$client = new Jetpack_IXR_Client( array(
			'user_id' => JETPACK_MASTER_USER,
		) );

		$client->query( 'jetpack.reindexStatus' );

		if ( !$client->isError() ) {
			$response = $client->getResponse();
			if ( 'DONE' == $response['status'] ) {
				Jetpack_Options::delete_option( 'sync_bulk_reindexing' );
			}
		}

		return $response;
	}

	public function reindex_ui() {
		$strings = json_encode( array(
			'WAITING' => array(
				'action' => __( 'Refresh Status', 'jetpack' ),
				'status' => __( 'Indexing request queued and waiting&hellip;', 'jetpack' ),
			),
			'INDEXING' => array(
				'action' => __( 'Refresh Status', 'jetpack' ),
				'status' => __( 'Indexing posts', 'jetpack' ),
			),
			'DONE' => array(
				'action' => __( 'Reindex Posts', 'jetpack' ),
				'status' => __( 'Posts indexed.', 'jetpack' ),
			),
			'ERROR' => array(
				'action' => __( 'Refresh Status', 'jetpack' ),
				'status' => __( 'Status unknown.', 'jetpack' ),
			),
			'ERROR:LARGE' => array(
				'action' => __( 'Refresh Status', 'jetpack' ),
				'status' => __( 'This site is too large, please contact Jetpack support to sync.', 'jetpack' ),
			),
		) );

		wp_enqueue_script(
			'jetpack_sync_reindex_control',
			plugins_url( '_inc/jquery.jetpack-sync.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery' ),
			JETPACK__VERSION
		);

		$template = <<<EOT
			<p class="jetpack_sync_reindex_control" id="jetpack_sync_reindex_control" data-strings="%s">
				<input type="submit" class="jetpack_sync_reindex_control_action button" value="%s" disabled />
				<span class="jetpack_sync_reindex_control_status">&hellip;</span>
			</p>
EOT;

		return sprintf(
			$template,
			esc_attr( $strings ),
			esc_attr__( 'Refresh Status', 'jetpack' )
		);
	}

	private function _get_post_count_local() {
		global $wpdb;
		return (int) $wpdb->get_var(
			"SELECT count(*)
				FROM {$wpdb->posts}
				WHERE post_status = 'publish' AND post_password = ''"
		);
	}

	private function _get_post_count_cloud() {
		$blog_id = Jetpack::init()->get_option( 'id' );

		$body = array(
			'size' => 1,
		);

		$response = wp_remote_post(
			"https://public-api.wordpress.com/rest/v1/sites/$blog_id/search",
			array(
				'timeout' => 10,
				'user-agent' => 'jetpack_related_posts',
				'sslverify' => true,
				'body' => $body,
			)
		);

		if ( is_wp_error( $response ) ) {
			return 0;
		}

		$results = json_decode( wp_remote_retrieve_body( $response ), true );

		return (int) $results['results']['total'];
	}

	/**
	 * Sometimes we need to fake options to be able to sync data with .com
	 * This is a helper function. That will make it easier to do just that.
	 *
	 * It will make sure that the options are synced when do_action( 'jetpack_sync_all_registered_options' );
	 *
	 * Which should happen everytime we update Jetpack to a new version or daily by Jetpack_Heartbeat.
	 *
	 * $callback is a function that is passed into a filter that returns the value of the option.
	 * This value should never be false. Since we want to short circuit the get_option function
	 * to return the value of the our callback.
	 *
	 * You can also trigger an update when a something else changes by calling the
	 * do_action( 'add_option_jetpack_' . $option, 'jetpack_'.$option, $callback_function );
	 * on the action that should that would trigger the update.
	 *
	 *
	 * @param  string $option   Option will always be prefixed with Jetpack and be saved on .com side
	 * @param  string or array  $callback
	 */
	function mock_option( $option , $callback ) {

		add_filter( 'pre_option_jetpack_'. $option, $callback );
		// This shouldn't happen but if it does we return the same as before.
		add_filter( 'option_jetpack_'. $option, $callback );
		// Instead of passing a file we just pass in a string.
		$this->options( 'mock-option' , 'jetpack_' . $option );

	}
	/**
	 * Sometimes you need to sync constants to .com
	 * Using the function will allow you to do just that.
	 *
	 * @param  'string' $constant Constants defined in code.
	 *
	 */
	function register_constant( $constant ) {
		$this->register( 'constant', $constant );
	}
	/**
	 * Simular to $this->options() function.
	 * Add the constant to be synced to .com when we activate the module.
	 * As well as on heartbeat and plugin upgrade and connection to .com.
	 *
	 * @param string $file
	 * @param string $constant
	 */
	function constant( $file, $constant ) {
		$constants = func_get_args();
		$file = array_shift( $constants );

		$module_slug = Jetpack::get_module_slug( $file );

		if ( ! isset( $this->sync_constants[ $module_slug ] ) ) {
			$this->sync_constants[ $module_slug ] = array();
		}

		foreach ( $constants as $constant ) {
			$this->sync_constants[ $module_slug ][] = $constant;
		}
	}

	/**
	 * Helper function to return the constants value.
	 *
	 * @param  string $constant
	 * @return value of the constant or null if the constant is set to false or doesn't exits.
	 */
	static function get_constant( $constant ) {
		if ( defined( $constant ) ) {
			return constant( $constant );
		}

		return null;
	}
}
