<?php
require_once dirname( __FILE__ ) . '/class.jetpack-sync-deflate-codec.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-full.php';

class Jetpack_Sync_Client {
	static $default_options_whitelist = array( 'stylesheet', '/^theme_mods_.*$/' );
	static $default_constants_whitelist = array();
	static $default_callable_whitelist = array();
	static $default_network_options_whitelist = array();
	static $constants_checksum_option_name = 'jetpack_constants_sync_checksum';
	static $functions_checksum_option_name = 'jetpack_functions_sync_checksum';
	static $default_send_buffer_size = 20;
	static $default_taxonomy_whitelist = array();

	private $sync_queue;
	private $full_sync_client;
	private $codec;
	private $options_whitelist;
	private $constants_whitelist;
	private $meta_types = array( 'post' );
	private $callable_whitelist;
	private $network_options_whitelist;
	private $taxonomy_whitelist;

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
		$this->sync_queue = new Jetpack_Sync_Queue( 'sync', self::$default_send_buffer_size );
		$this->set_full_sync_client( new Jetpack_Sync_Full( $this->sync_queue ) );
		$this->codec                     = new Jetpack_Sync_Deflate_Codec();
		$this->constants_whitelist       = self::$default_constants_whitelist;
		$this->options_whitelist         = self::$default_options_whitelist;
		$this->callable_whitelist        = self::$default_callable_whitelist;
		$this->network_options_whitelist = self::$default_network_options_whitelist;
		$this->taxonomy_whitelist        = self::$default_taxonomy_whitelist;
		$this->is_multisite              = is_multisite();
		$this->init();
	}

	private function init() {

		$handler = array( $this, 'action_handler' );

		// constants
		add_action( 'jetpack_sync_current_constants', $handler, 10 );

		// functions
		add_action( 'jetpack_sync_current_callables', $handler, 10 );

		// posts
		add_action( 'wp_insert_post', $handler, 10, 3 );
		add_action( 'deleted_post', $handler, 10 );

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

		// themes
		add_action( 'switch_theme', array( $this, 'send_theme_info' ) );
		add_action( 'jetpack_sync_current_theme_support', $handler, 10 ); // custom hook, see meta-hooks below

		// post-meta, and in the future - other meta?
		foreach ( $this->meta_types as $meta_type ) {
			// we need to make sure we don't commit before we receive these,
			// because they're invoked after meta changes are saved to the DB
			add_action( "added_{$meta_type}_meta", $handler, 99, 4 );
			add_action( "updated_{$meta_type}_meta", $handler, 99, 4 );
			add_action( "deleted_{$meta_type}_meta", $handler, 99, 4 );
		}

		// synthetic actions for full sync
		add_action( 'jp_full_sync_start', $handler );
		add_action( 'jp_full_sync_posts', $handler );
		add_action( 'jp_full_sync_comments', $handler );
		add_action( 'jp_full_sync_option', $handler, 10, 2 );
		add_action( 'jp_full_sync_postmeta', $handler, 10, 2 );

		/**
		 * Other hooks - fire synthetic hooks for all the properties we need to sync,
		 * e.g. when a theme changes
		 */

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


		/**
		 * Sync all pending actions with server
		 */
		add_action( 'jetpack_sync_actions', array( $this, 'do_sync' ) );

		// terms
		add_action( 'created_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'edited_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'jetapack_sync_save_term', $handler, 10, 4 );
		add_action( 'delete_term', $handler, 10, 5 );


	}

	// TODO: Refactor to use one set whitelist function, with one is_whitelisted.
	function set_options_whitelist( $options ) {
		$this->options_whitelist = $options;
	}

	function set_constants_whitelist( $constants ) {
		$this->constants_whitelist = $constants;
	}

	function set_callable_whitelist( $functions ) {
		$this->callable_whitelist = $functions;
	}

	function set_network_options_whitelist( $options ) {
		$this->network_options_whitelist = $options;
	}

	function set_send_buffer_size( $size ) {
		$this->sync_queue->set_checkout_size( $size );
	}

	function set_taxonomy_whitelist( $taxonomies ) {
		$this->taxonomy_whitelist = $taxonomies;
	}

	function is_whitelisted_option( $option ) {
		foreach ( $this->options_whitelist as $whitelisted_option ) {
			if ( $whitelisted_option[0] === '/' && preg_match( $whitelisted_option, $option ) ) {
				return true;
			} elseif ( $whitelisted_option === $option ) {
				return true;
			}
		}

		return false;
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

		$this->sync_queue->add( array(
			$current_filter,
			$args
		) );
	}

	function send_theme_info() {
		global $_wp_theme_features;
		do_action( 'jetpack_sync_current_theme_support', $_wp_theme_features );
	}

	function save_term_handler( $term_id, $tt_id, $taxonomy ) {
		$term_object = WP_Term::get_instance( $term_id, $taxonomy );
		do_action( 'jetapack_sync_save_term', $term_id, $tt_id, $taxonomy, $term_object );
	}

	function do_sync() {
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			$this->schedule_sync( "+1 minute" );

			return false;
		}

		$this->maybe_sync_constants();
		$this->maybe_sync_callables();

		$buffer = $this->sync_queue->checkout();

		if ( ! $buffer ) {
			// buffer has no items
			return;
		}

		if ( is_wp_error( $buffer ) ) {
			error_log( "Error fetching buffer: " . $buffer->get_error_message() );

			return;
		}

		$data = $this->codec->encode( $buffer->get_items() );

		/**
		 * Fires when data is ready to send to the server.
		 * Return false or WP_Error to abort the sync (e.g. if there's an error)
		 * The items will be automatically re-sent later
		 *
		 * @since 4.1
		 *
		 * @param array $data The action buffer
		 */
		$result = apply_filters( 'jetpack_sync_client_send_data', $data );

		if ( ! $result || is_wp_error( $result ) ) {
			$this->sync_queue->checkin( $buffer );
			// try again in 1 minute
			$this->schedule_sync( "+1 minute" );
		} else {
			$this->sync_queue->close( $buffer );
			// check if there are any more events in the buffer
			// if so, schedule a cron job to happen soon
			if ( $this->sync_queue->has_any_items() ) {
				$this->schedule_sync( "+1 minute" );
			}
		}
	}


	private function schedule_sync( $when ) {
		wp_schedule_single_event( strtotime( $when ), 'jetpack_sync_actions' );
	}

	function force_sync_constants() {
		delete_option( self::$constants_checksum_option_name );
		$this->maybe_sync_constants();
	}

	private function maybe_sync_constants() {
		$constants = $this->get_all_constants();
		if ( empty( $constants ) ) {
			return;
		}
		$constants_check_sum = $this->get_check_sum( $constants );
		if ( $constants_check_sum !== get_option( self::$constants_checksum_option_name ) ) {
			do_action( 'jetpack_sync_current_constants', $constants );
			update_option( self::$constants_checksum_option_name, $constants_check_sum );
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
		delete_option( self::$functions_checksum_option_name );
		$this->maybe_sync_callables();
	}

	private function maybe_sync_callables() {
		$callables = $this->get_all_callables();
		if ( empty( $callables ) ) {
			return;
		}
		$callables_check_sum = $this->get_check_sum( $callables );

		if ( $callables_check_sum !== get_option( self::$functions_checksum_option_name ) ) {
			do_action( 'jetpack_sync_current_callables', $callables );
			update_option( self::$functions_checksum_option_name, $callables_check_sum );
		}
	}

	private function get_all_callables() {
		return array_combine(
			$this->callable_whitelist,
			array_map( array( $this, 'get_callable' ), $this->callable_whitelist )
		);
	}

	private function get_callable( $callable ) {
		return call_user_func( $callable );
	}

	private function get_check_sum( $values ) {
		return crc32( serialize( $values ) );
	}

	function get_actions() {
		// TODO: we should only send a bit at a time, flush_all sends everything
		return $this->sync_queue->flush_all();
	}

	function get_all_actions() {
		return $this->sync_queue->get_all();
	}

	function get_sync_queue() {
		return $this->sync_queue;
	}

	function reset_sync_queue() {
		$this->sync_queue->reset();
	}

	function reset_state() {
		$this->codec               = new Jetpack_Sync_Deflate_Codec();
		$this->constants_whitelist = self::$default_constants_whitelist;
		$this->options_whitelist   = self::$default_options_whitelist;
		$this->set_send_buffer_size( self::$default_send_buffer_size );
		delete_option( self::$constants_checksum_option_name );
		$this->reset_sync_queue();
	}
}
