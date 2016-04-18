<?php
require_once dirname( __FILE__ ) . '/class.jetpack-sync-deflate-codec.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';

class Jetpack_Sync_Client {
	static $default_options_whitelist = array( 'stylesheet', '/^theme_mods_.*$/' );
	static $default_constants_whitelist = array();
	static $constants_checksum_option_name = 'jetpack_constants_sync_checksum';

	private $sync_queue;
	private $codec;
	private $options_whitelist;
	private $constants_whitelist;
	private $meta_types = array( 'post' );

	// singleton functions
	private static $instance;

	public static function getInstance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}

		return static::$instance;
	}

	// this is necessary because you can't use "new" when you declare instance properties >:(
	protected function __construct() {
		$this->sync_queue          = new Jetpack_Sync_Queue( 'sync', 100 );
		$this->codec               = new Jetpack_Sync_Deflate_Codec();
		$this->constants_whitelist = self::$default_constants_whitelist;
		$this->options_whitelist   = self::$default_options_whitelist;
		$this->init();
	}

	private function init() {
		$handler = array( $this, 'action_handler' );

		// constants
		add_action( 'jetpack_sync_current_constants', $handler, 10 );

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
		add_action( 'jetpack_sync_current_theme_support', $handler, 10 ); // custom hook, see meta-hooks below

		// post-meta, and in the future - other meta?
		foreach ( $this->meta_types as $meta_type ) {
			// we need to make sure we don't commit before we receive these,
			// because they're invoked after meta changes are saved to the DB
			add_action( "added_{$meta_type}_meta", $handler, 99, 4 );
			add_action( "updated_{$meta_type}_meta", $handler, 99, 4 );
			add_action( "deleted_{$meta_type}_meta", $handler, 99, 4 );
		}

		/**
		 * Other hooks - fire synthetic hooks for all the properties we need to sync,
		 * e.g. when a theme changes
		 */

		// themes
		add_action( 'switch_theme', array( $this, 'switch_theme_handler' ) );
	}

	function set_options_whitelist( $options ) {
		$this->options_whitelist = $options;
	}

	function set_constants_whitelist( $constants ) {
		$this->constants_whitelist = $constants;
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

	function set_codec( iJetpack_Sync_Codec $codec ) {
		$this->codec = $codec;
	}

	function set_sync_queue( $queue ) {
		$this->sync_queue = $queue;
	}

	function action_handler() {
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
		Jetpack_Sync::schedule_sync();
		$this->sync_queue->add( array(
			$current_filter,
			$args
		) );
	}

	function switch_theme_handler() {
		global $_wp_theme_features;

		do_action( 'jetpack_sync_current_theme_support', $_wp_theme_features );
	}

	function do_sync() {
		$this->maybe_sync_constants();

		// TODO: only send buffer once, then do the rest in a cron job
		$iters = 0;
		while ( ( $buffer = $this->sync_queue->checkout() ) && $iters < 100 ) {

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
			} else {
				$this->sync_queue->close( $buffer );
			}
			$iters += 1;
		}
	}

	private function maybe_sync_constants() {
		$constants           = $this->get_all_constants();
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

	function reset_state() {
		$this->codec               = new Jetpack_Sync_Deflate_Codec();
		$this->constants_whitelist = self::$default_constants_whitelist;
		$this->options_whitelist   = self::$default_options_whitelist;
		delete_option( self::$constants_checksum_option_name );
		$this->sync_queue->reset();
	}
}
