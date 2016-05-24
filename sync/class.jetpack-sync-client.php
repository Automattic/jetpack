<?php
require_once dirname( __FILE__ ) . '/class.jetpack-sync-deflate-codec.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-functions.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-full.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-defaults.php';

class Jetpack_Sync_Client {

	const CONSTANTS_CHECKSUM_OPTION_NAME = 'jetpack_constants_sync_checksum';
	const CALLABLES_CHECKSUM_OPTION_NAME = 'jetpack_callables_sync_checksum';
	const SYNC_THROTTLE_OPTION_NAME = 'jetpack_sync_min_wait';
	const LAST_SYNC_TIME_OPTION_NAME = 'jetpack_last_sync_time';
	const CALLABLES_AWAIT_TRANSIENT_NAME = 'jetpack_sync_callables_await';
	const CONSTANTS_AWAIT_TRANSIENT_NAME = 'jetpack_sync_constants_await';

	private $checkout_memory_size;
	private $upload_max_bytes;
	private $upload_max_rows;
	private $sync_queue;
	private $full_sync_client;
	private $codec;
	private $options_whitelist;
	private $constants_whitelist;
	private $meta_types = array( 'post', 'comment' );
	private $callable_whitelist;
	private $network_options_whitelist;
	private $taxonomy_whitelist;
	private $is_multisite;

	// singleton functions
	private static $instance;

	public static function getInstance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	// this is necessary because you can't use "new" when you declare instance properties >:(
	protected function __construct() {
		$this->set_defaults();
		$this->init();
	}

	private function init() {

		$handler = array( $this, 'action_handler' );

		/**
		 * Most of the following hooks are sent to the same $handler
		 * for immediate serialization and queuing be sent to the server.
		 * The only exceptions are actions which need additional processing.
		 */

		// constants
		add_action( 'jetpack_sync_constant', $handler, 10, 2 );

		// callables
		add_action( 'jetpack_sync_callable', $handler, 10, 2 );

		// posts
		add_action( 'wp_insert_post', $handler, 10, 3 );
		add_action( 'deleted_post', $handler, 10 );
		add_filter( 'jetpack_sync_before_send_wp_insert_post', array( $this, 'expand_wp_insert_post' ) );

		add_action( 'jetpack_publicize_post', $handler );

		// attachments

		add_action( 'edit_attachment', array( $this, 'send_attachment_info' ) );
		// Once we don't have to support 4.3 we can start using add_action( 'attachment_updated', $handler, 10, 3 ); instead
		add_action( 'add_attachment', array( $this, 'send_attachment_info' ) );
		add_action( 'jetpack_sync_save_add_attachment', $handler, 10, 2 );

		// comments
		add_action( 'wp_insert_comment', $handler, 10, 2 );
		add_action( 'deleted_comment', $handler, 10 );
		add_action( 'trashed_comment', $handler, 10 );
		add_action( 'spammed_comment', $handler, 10 );

		// even though it's messy, we implement these hooks because 
		// the edit_comment hook doesn't include the data
		// so this saves us a DB read for every comment event
		foreach ( array( '', 'trackback', 'pingback' ) as $comment_type ) {
			foreach ( array( 'unapproved', 'approved' ) as $comment_status ) {
				add_action( "comment_{$comment_status}_{$comment_type}", $handler, 10, 2 );
			}
		}

		// options
		add_action( 'added_option', $handler, 10, 2 );
		add_action( 'updated_option', $handler, 10, 3 );
		add_action( 'deleted_option', $handler, 10, 1 );

		// Sync Core Icon: Detect changes in Core's Site Icon and make it syncable.
		add_action( 'add_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );
		add_action( 'update_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );
		add_action( 'delete_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );

		// wordpress version
		add_action( 'upgrader_process_complete', array( $this, 'send_wp_version' ), 10, 2 );
		add_action( 'jetpack_sync_wp_version', $handler );

		// themes
		add_action( 'switch_theme', array( $this, 'send_theme_info' ) );
		add_action( 'jetpack_sync_current_theme_support', $handler, 10 ); // custom hook, see meta-hooks below

		// post-meta, and in the future - other meta?
		foreach ( $this->meta_types as $meta_type ) {
			add_action( "added_{$meta_type}_meta", $handler, 10, 4 );
			add_action( "updated_{$meta_type}_meta", $handler, 10, 4 );
			add_action( "deleted_{$meta_type}_meta", $handler, 10, 4 );
		}

		// terms
		add_action( 'created_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'edited_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'jetpack_sync_save_term', $handler, 10, 4 );
		add_action( 'delete_term', $handler, 10, 4 );
		add_action( 'set_object_terms', $handler, 10, 6 );
		add_action( 'deleted_term_relationships', $handler, 10, 2 );

		// users
		add_action( 'user_register', array( $this, 'save_user_handler' ) );
		add_action( 'profile_update', array( $this, 'save_user_handler' ), 10, 2 );
		add_action( 'jetpack_sync_save_user', $handler, 10, 2 );
		add_action( 'deleted_user', $handler, 10, 2 );

		// user roles
		add_action( 'add_user_role', array( $this, 'save_user_role_handler' ), 10, 2 );
		add_action( 'set_user_role', array( $this, 'save_user_role_handler' ), 10, 3 );
		add_action( 'remove_user_role', array( $this, 'save_user_role_handler' ), 10, 2 );


		// user capabilities
		add_action( 'added_user_meta', array( $this, 'save_user_cap_handler' ), 10, 4 );
		add_action( 'updated_user_meta', array( $this, 'save_user_cap_handler' ), 10, 4 );
		add_action( 'deleted_user_meta', array( $this, 'save_user_cap_handler' ), 10, 4 );

		// themes
		add_action( 'set_site_transient_update_plugins', $handler, 10, 1 );
		add_action( 'set_site_transient_update_themes', $handler, 10, 1 );
		add_action( 'set_site_transient_update_core', $handler, 10, 1 );

		// multi site network options
		if ( $this->is_multisite ) {
			add_action( 'add_site_option', $handler, 10, 2 );
			add_action( 'update_site_option', $handler, 10, 3 );
			add_action( 'delete_site_option', $handler, 10, 1 );
		}

		// synthetic actions for full sync
		add_action( 'jetpack_full_sync_start', $handler );
		add_action( 'jetpack_full_sync_end', $handler );
		add_action( 'jetpack_full_sync_options', $handler );
		add_action( 'jetpack_full_sync_posts', $handler ); // also sends post meta
		add_action( 'jetpack_full_sync_comments', $handler ); // also send comments meta
		add_action( 'jetpack_full_sync_users', $handler );
		add_action( 'jetpack_full_sync_terms', $handler, 10, 2 );
		if ( is_multisite() ) {
			add_action( 'jetpack_full_sync_network_options', $handler );
		}


		// TODO: Callables, Constanst, Network Options, Users, Terms

		/**
		 * Sync all pending actions with server
		 */
		add_action( 'jetpack_sync_actions', array( $this, 'do_sync' ) );
	}

	// TODO: Refactor to use one set whitelist function, with one is_whitelisted.
	function set_options_whitelist( $options ) {
		$this->options_whitelist = $options;
	}

	function set_constants_whitelist( $constants ) {
		$this->constants_whitelist = $constants;
	}

	function get_callable_whitelist() {
		return $this->callable_whitelist;
	}

	function set_callable_whitelist( $callables ) {
		$this->callable_whitelist = $callables;
	}

	function set_network_options_whitelist( $options ) {
		$this->network_options_whitelist = $options;
	}

	function set_send_buffer_memory_size( $size ) {
		$this->checkout_memory_size = $size;
	}

	// in bytes
	function set_upload_max_bytes( $max_bytes ) {
		$this->upload_max_bytes = $max_bytes;
	}

	// in rows
	function set_upload_max_rows( $max_rows ) {
		$this->upload_max_rows = $max_rows;
	}

	// in seconds
	function set_min_sync_wait_time( $seconds ) {
		update_option( self::SYNC_THROTTLE_OPTION_NAME, $seconds, true );
	}

	function get_min_sync_wait_time() {
		return get_option( self::SYNC_THROTTLE_OPTION_NAME );
	}

	private function get_last_sync_time() {
		return (double) get_option( self::LAST_SYNC_TIME_OPTION_NAME );
	}

	private function set_last_sync_time() {
		return update_option( self::LAST_SYNC_TIME_OPTION_NAME, microtime( true ), true );
	}

	function set_taxonomy_whitelist( $taxonomies ) {
		$this->taxonomy_whitelist = $taxonomies;
	}

	function is_whitelisted_option( $option ) {
		return in_array( $option, $this->options_whitelist );
	}

	function is_whitelisted_network_option( $option ) {
		return $this->is_multisite && in_array( $option, $this->network_options_whitelist );
	}

	function set_codec( iJetpack_Sync_Codec $codec ) {
		$this->codec = $codec;
	}

	function set_full_sync_client( $full_sync_client ) {
		if ( $this->full_sync_client ) {
			remove_action( 'jetpack_sync_full', array( $this->full_sync_client, 'start' ) );
		}

		$this->full_sync_client = $full_sync_client;

		/**
		 * Sync all objects in the database with the server
		 */
		add_action( 'jetpack_sync_full', array( $this->full_sync_client, 'start' ) );
	}

	function get_full_sync_client() {
		return $this->full_sync_client;
	}

	function action_handler() {
		// TODO: it's really silly to have this function here - it should be
		// wherever we initialize the action listeners or we're just wasting cycles
		if ( Jetpack::is_development_mode() || Jetpack::is_staging_site() ) {
			return false;
		}

		$current_filter = current_filter();
		$args           = func_get_args();

		if ( $current_filter === 'wp_insert_post' && $args[1]->post_type === 'revision' ) {
			return;
		}

		if ( in_array( $current_filter, array( 'deleted_option', 'added_option', 'updated_option' ) )
		     &&
		     ! $this->is_whitelisted_option( $args[0] )
		) {
			return;
		}

		if ( in_array( $current_filter, array( 'delete_site_option', 'add_site_option', 'update_site_option' ) )
		     &&
		     ! $this->is_whitelisted_network_option( $args[0] )
		) {
			return;
		}

		// don't sync private meta
		if ( preg_match( '/^(added|updated|deleted)_.*_meta$/', $current_filter )
		     && $args[2][0] === '_'
		     && ! in_array( $args[2], Jetpack_Sync_Defaults::$default_whitelist_meta_keys )
		) {
			return;
		}

		$this->sync_queue->add( array(
			$current_filter,
			$args,
			get_current_user_id(),
			microtime( true )
		) );
	}

	function send_theme_info() {
		global $_wp_theme_features;

		$theme_support = array();

		foreach ( Jetpack_Sync_Defaults::$default_theme_support_whitelist as $theme_feature ) {
			$has_support = current_theme_supports( $theme_feature );
			if ( $has_support ) {
				$theme_support[ $theme_feature ] = $_wp_theme_features[ $theme_feature ];
			}

		}

		/**
		 * Fires when the client needs to sync theme support info
		 * Only sends theme support attributes whitelisted in Jetpack_Sync_Defaults::$default_theme_support_whitelist
		 * 
		 * @since 4.1.0
		 *
		 * @param object the theme support hash
		 */
		do_action( 'jetpack_sync_current_theme_support', $theme_support );
	}

	function send_wp_version( $update, $meta_data ) {
		if ( 'update' === $meta_data['action'] && 'core' === $meta_data['type'] ) {
			global $wp_version;

			/**
			 * Fires when the client needs to sync WordPress version
			 * 
			 * @since 4.1.0
			 *
			 * @param string The WordPress version number
			 */
			do_action( 'jetpack_sync_wp_version', $wp_version );
		}
	}

	function save_term_handler( $term_id, $tt_id, $taxonomy ) {
		if ( class_exists( 'WP_Term' ) ) {
			$term_object = WP_Term::get_instance( $term_id, $taxonomy );
		} else {
			$term_object = get_term_by( 'id', $term_id, $taxonomy );
		}

		/**
		 * Fires when the client needs to sync a new term
		 * 
		 * @since 4.1.0
		 *
		 * @param object the Term object
		 */
		do_action( 'jetpack_sync_save_term', $term_object );
	}

	function send_attachment_info( $attachment_id ) {
		$attachment = get_post( $attachment_id );

		/**
		 * Fires when the client needs to sync an attachment for a post
		 * 
		 * @since 4.1.0
		 *
		 * @param int The attachment ID
		 * @param object The attachment
		 */
		do_action( 'jetpack_sync_save_add_attachment', $attachment_id, $attachment );
	}

	function save_user_handler( $user_id, $old_user_data = null ) {
		$user = $this->sanitize_user( get_user_by( 'id', $user_id ) );

		// Older versions of WP don't pass the old_user_data in ->data
		if ( isset( $old_user_data->data ) ) {
			$old_user = $old_user_data->data;
		} else {
			$old_user = $old_user_data;
		}

		if ( $old_user !== null ) {
			unset( $old_user->user_pass );
			if ( serialize( $old_user ) === serialize( $user->data ) ) {
				return;
			}
		}

		/**
		 * Fires when the client needs to sync an updated user
		 * 
		 * @since 4.1.0
		 *
		 * @param object The WP_User object
		 */
		do_action( 'jetpack_sync_save_user', $user );
	}

	function save_user_role_handler( $user_id, $role, $old_roles = null ) {
		$user = $this->sanitize_user( get_user_by( 'id', $user_id ) );

		/**
		 * Fires when the client needs to sync an updated user
		 * 
		 * @since 4.1.0
		 *
		 * @param object The WP_User object
		 */
		do_action( 'jetpack_sync_save_user', $user );
	}

	function save_user_cap_handler( $meta_id, $user_id, $meta_key, $capabilities ) {
		$user = $this->sanitize_user( get_user_by( 'id', $user_id ) );
		if ( $meta_key === $user->cap_key ) {
			/**
			 * Fires when the client needs to sync an updated user
			 * 
			 * @since 4.1.0
			 *
			 * @param object The WP_User object
			 */
			do_action( 'jetpack_sync_save_user', $user );
		}
	}

	public function sanitize_user( $user ) {
		unset( $user->data->user_pass );

		return $user;
	}


	function do_sync() {
		// don't sync if importing
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			$this->schedule_sync( "+1 minute" );

			return false;
		}

		// don't sync if we are throttled
		$sync_wait = $this->get_min_sync_wait_time();
		$last_sync = $this->get_last_sync_time();

		if ( $last_sync && $sync_wait && $last_sync + $sync_wait > microtime( true ) ) {
			return false;
		}

		$this->set_last_sync_time();
		$this->maybe_sync_constants();
		$this->maybe_sync_callables();

		if ( $this->sync_queue->size() === 0 ) {
			return false;
		}

		$buffer = $this->sync_queue->checkout_with_memory_limit( $this->checkout_memory_size, $this->upload_max_rows );

		if ( ! $buffer ) {
			// buffer has no items
			return false;
		}

		if ( is_wp_error( $buffer ) ) {
			// another buffer is currently sending
			return false;
		}

		$upload_size   = 0;
		$items_to_send = array();

		// we estimate the total encoded size as we go by encoding each item individually
		// this is expensive, but the only way to really know :/
		foreach ( $buffer->get_items() as $key => $item ) {

			/**
			 * Modify the data within an action before it is serialized and sent to the server
			 * For example, during full sync this expands Post ID's into full Post objects,
			 * so that we don't have to serialize the whole object into the queue.
			 * 
			 * @since 4.1.0
			 *
			 * @param array The action parameters
			 */
			$item[1] = apply_filters( "jetpack_sync_before_send_" . $item[0], $item[1] );

			$encoded_item = $this->codec->encode( $item );
			$upload_size += strlen( $encoded_item );

			if ( $upload_size > $this->upload_max_bytes && count( $items_to_send ) > 0 ) {
				break;
			}

			$items_to_send[ $key ] = $encoded_item;
		}

		/**
		 * Fires when data is ready to send to the server.
		 * Return false or WP_Error to abort the sync (e.g. if there's an error)
		 * The items will be automatically re-sent later
		 *
		 * @since 4.1
		 *
		 * @param array $data The action buffer
		 */
		$result = apply_filters( 'jetpack_sync_client_send_data', $items_to_send );

		if ( ! $result || is_wp_error( $result ) ) {
			// error_log("There was an error sending data:");
			// error_log(print_r($result, 1));
			$result = $this->sync_queue->checkin( $buffer );

			if ( is_wp_error( $result ) ) {
				error_log( "Error checking in buffer: " . $result->get_error_message() );
				$this->sync_queue->force_checkin();
			}
			// try again in 1 minute
			$this->schedule_sync( "+1 minute" );
		} else {

			// scan the sent data to see if a full sync started or finished
			if ( $this->buffer_includes_action( $buffer, 'jetpack_full_sync_start' ) ) {
				$this->full_sync_client->set_status_sending_started();
			}

			if ( $this->buffer_includes_action( $buffer, 'jetpack_full_sync_end' ) ) {
				$this->full_sync_client->set_status_sending_finished();
			}

			$this->sync_queue->close( $buffer, $result );
			// check if there are any more events in the buffer
			// if so, schedule a cron job to happen soon
			if ( $this->sync_queue->has_any_items() ) {
				$this->schedule_sync( "+1 minute" );
			}
		}
	}

	private function buffer_includes_action( $buffer, $action_name ) {
		foreach ( $buffer->get_items() as $item ) {
			if ( $item[0] === $action_name ) {
				return true;
			}
		}

		return false;
	}

	function expand_wp_insert_post( $args ) {
		// list( $post_ID, $post, $update ) = $args;
		return array( $args[0], $this->filter_post_content_and_add_links( $args[1] ), $args[2] );
	}

	// Expands wp_insert_post to include filtered content
	function filter_post_content_and_add_links( $post ) {
		if ( 0 < strlen( $post->post_password ) ) {
			$post->post_password = 'auto-' . wp_generate_password( 10, false );
		}
		/** This filter is already documented in core. wp-includes/post-template.php */
		$post->post_content_filtered = apply_filters( 'the_content', $post->post_content );
		$post->permalink             = get_permalink( $post->ID );
		$post->shortlink             = wp_get_shortlink( $post->ID );

		return $post;
	}

	private function schedule_sync( $when ) {
		wp_schedule_single_event( strtotime( $when ), 'jetpack_sync_actions' );
	}

	function force_sync_constants() {
		foreach ( $this->constants_whitelist as $name ) {
			delete_option( self::CONSTANTS_CHECKSUM_OPTION_NAME . "_$name" );
		}

		delete_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME );
		$this->maybe_sync_constants();
	}

	function force_sync_options() {
		/**
		 * Tells the client to sync all options to the server
		 *
		 * @since 4.1
		 *
		 * @param boolean Whether to expand options (should always be true)
		 */
		do_action( 'jetpack_full_sync_options', true );
	}

	function force_sync_network_options() {
		/**
		 * Tells the client to sync all network options to the server
		 *
		 * @since 4.1
		 *
		 * @param boolean Whether to expand options (should always be true)
		 */
		do_action( 'jetpack_full_sync_network_options', true );
	}

	private function maybe_sync_constants() {
		if ( get_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME ) ) {
			return;
		}

		$constants = $this->get_all_constants();
		if ( empty( $constants ) ) {
			return;
		}

		set_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME, microtime( true ), Jetpack_Sync_Defaults::$default_sync_constants_wait_time );

		// only send the constants that have changed
		foreach ( $constants as $name => $value ) {
			$checksum = $this->get_check_sum( $value );

			// explicitly not using Identical comparison as get_option returns a string
			if ( $checksum != get_option( self::CONSTANTS_CHECKSUM_OPTION_NAME . "_$name" ) ) {
				/**
				 * Tells the client to sync a constant to the server
				 *
				 * @since 4.1
				 *
				 * @param string The name of the constant
				 * @param mixed The value of the constant
				 */
				do_action( 'jetpack_sync_constant', $name, $value );
				update_option( self::CONSTANTS_CHECKSUM_OPTION_NAME . "_$name", $checksum );
			}
		}
	}

	private function get_all_constants() {
		return array_combine(
			$this->constants_whitelist,
			array_map( array( $this, 'get_constant' ), $this->constants_whitelist )
		);
	}

	private function get_constant( $constant ) {
		if ( defined( $constant ) ) {
			return constant( $constant );
		}

		return null;
	}

	public function force_sync_callables() {
		foreach ( $this->callable_whitelist as $name => $config ) {
			delete_option( self::CALLABLES_CHECKSUM_OPTION_NAME . "_$name" );
		}

		delete_transient( self::CALLABLES_AWAIT_TRANSIENT_NAME );
		$this->maybe_sync_callables();
	}

	private function maybe_sync_callables() {
		if ( get_transient( self::CALLABLES_AWAIT_TRANSIENT_NAME ) ) {
			return;
		}

		$callables = $this->get_all_callables();
		if ( empty( $callables ) ) {
			return;
		}

		set_transient( self::CALLABLES_AWAIT_TRANSIENT_NAME, microtime( true ), Jetpack_Sync_Defaults::$default_sync_callables_wait_time );

		// only send the callables that have changed
		foreach ( $callables as $name => $value ) {
			$checksum = $this->get_check_sum( $value );
			// explicitly not using Identical comparison as get_option returns a string
			if ( $checksum != get_option( self::CALLABLES_CHECKSUM_OPTION_NAME . "_$name" ) ) {
				/**
				 * Tells the client to sync a callable (aka function) to the server
				 *
				 * @since 4.1
				 *
				 * @param string The name of the callable
				 * @param mixed The value of the callable
				 */
				do_action( 'jetpack_sync_callable', $name, $value );
				update_option( self::CALLABLES_CHECKSUM_OPTION_NAME . "_$name", $checksum );
			}
		}
	}

	private function get_all_callables() {
		return array_combine(
			array_keys( $this->callable_whitelist ),
			array_map( array( $this, 'get_callable' ), array_values( $this->callable_whitelist ) )
		);
	}

	private function get_callable( $callable ) {
		return call_user_func( $callable );
	}

	// Is public so that we don't have to store so much data all the options twice.
	function get_all_options() {
		$options = array();
		foreach ( $this->options_whitelist as $option ) {
			$options[ $option ] = get_option( $option );
		}

		return $options;
	}

	function get_all_network_options() {
		$options = array();
		foreach ( $this->network_options_whitelist as $option ) {
			$options[ $option ] = get_site_option( $option );
		}

		return $options;
	}

	private function get_check_sum( $values ) {
		return crc32( json_encode( $values ) );
	}

	function jetpack_sync_core_icon() {
		if ( function_exists( 'get_site_icon_url' ) ) {
			$url = get_site_icon_url();
		} else {
			return;
		}

		require_once( JETPACK__PLUGIN_DIR . 'modules/site-icon/site-icon-functions.php' );
		// If there's a core icon, maybe update the option.  If not, fall back to Jetpack's.
		if ( ! empty( $url ) && $url !== jetpack_site_icon_url() ) {
			// This is the option that is synced with dotcom
			Jetpack_Options::update_option( 'site_icon_url', $url );
		} else if ( empty( $url ) && did_action( 'delete_option_site_icon' ) ) {
			Jetpack_Options::delete_option( 'site_icon_url' );
		}
	}

	function get_sync_queue() {
		return $this->sync_queue;
	}

	function reset_sync_queue() {
		$this->sync_queue->reset();
	}

	function set_defaults() {
		$this->sync_queue = new Jetpack_Sync_Queue( 'sync' );
		$this->set_send_buffer_memory_size( Jetpack_Sync_Defaults::$default_send_buffer_memory_size );
		$this->set_upload_max_bytes( Jetpack_Sync_Defaults::$default_upload_max_bytes );
		$this->set_upload_max_rows( Jetpack_Sync_Defaults::$default_upload_max_rows );

		if ( $this->get_min_sync_wait_time() === false ) {
			$this->set_min_sync_wait_time( Jetpack_Sync_Defaults::$default_sync_wait_time );
		}

		$this->set_full_sync_client( Jetpack_Sync_Full::getInstance() );
		$this->codec                     = new Jetpack_Sync_Deflate_Codec();
		$this->constants_whitelist       = Jetpack_Sync_Defaults::$default_constants_whitelist;
		$this->options_whitelist         = Jetpack_Sync_Defaults::$default_options_whitelist;
		$this->network_options_whitelist = Jetpack_Sync_Defaults::$default_network_options_whitelist;
		$this->taxonomy_whitelist        = Jetpack_Sync_Defaults::$default_taxonomy_whitelist;
		$this->is_multisite              = is_multisite();

		// theme mod varies from theme to theme.
		$this->options_whitelist[] = 'theme_mods_' . get_option( 'stylesheet' );
		if ( $this->is_multisite ) {
			$this->callable_whitelist = array_merge( Jetpack_Sync_Defaults::$default_callable_whitelist, Jetpack_Sync_Defaults::$default_multisite_callable_whitelist );
		} else {
			$this->callable_whitelist = Jetpack_Sync_Defaults::$default_callable_whitelist;
		}
	}

	function reset_data() {
		$this->reset_sync_queue();
	}
}
