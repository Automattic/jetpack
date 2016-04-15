<?php
require_once dirname( __FILE__ ) . '/class.jetpack-sync-deflate-codec.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';

class Jetpack_Sync_Client {
	private $sync_queue;
	private $codec;
	private $options_whitelist = array( 'stylesheet', '/^theme_mods_.*$/' );
	private $constants_whitelist = array();
	private $meta_types = array( 'post' );
	private $previous_filter = array();


	// this is necessary because you can't use "new" when you declare instance properties >:(
	function __construct() {
		$this->sync_queue = new Jetpack_Sync_Queue( 'sync' );
		$this->codec = new Jetpack_Sync_Deflate_Codec();
	}

	function init() {

		$handler = array( $this, 'action_handler' );
		$filter_handler = array( $this, 'filter_handler' );
		// posts
		add_action( 'wp_insert_post', $handler, 10, 3 );
		add_action( 'delete_post', $handler, 10 );
		// comments
		add_action( 'wp_insert_comment', $handler, 10, 2 );
		add_action( 'deleted_comment', $handler, 10 );
		add_action( 'trashed_comment', $handler, 10 );
		add_action( 'spammed_comment', $handler, 10 );
		// even though it's messy, we implement these hooks because the edit_comment hook doesn't include the data
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
		add_action( 'jetpack_sync_current_constants', $handler, 10 );

		/**
		 * Meta-hooks - fire synthetic hooks for all the properties we need to sync, 
		 * e.g. when a theme changes
		 */

		// themes
		add_action( 'switch_theme', array( $this, 'switch_theme_handler' ) );

		foreach ( $this->meta_types as $meta_type ) {
			add_filter( "add_{$meta_type}_metadata", $filter_handler, 99, 5 );
			add_filter( "update_{$meta_type}_metadata", $filter_handler, 99, 5);
			add_filter( "delete_{$meta_type}_metadata", $filter_handler, 99, 5 );
		}
	}

	function set_options_whitelist( $options ) {
		$this->options_whitelist = $options;
	}

	function set_constant_whitelist( $constant ) {
		$this->constants_whitelist = $constant;
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
			! $this->is_whitelisted_option( $args[0] ) ) {
			return;
		}
		Jetpack_Sync::schedule_sync();
		$this->sync_queue->add( array(
			$current_filter,
			$args
		) );
	}

	function filter_handler() {
		$current_filter = current_filter();
		$args           = func_get_args();
		$necessary_args = array( $args[1], $args[2], $args[3] );
		$return = $args[0];
		foreach ( $this->meta_types as $meta_type ) {
			if ( $args[0] !== null && ( $current_filter === "add_{$meta_type}_metadata" || $current_filter === "update_{$meta_type}_metadata" || $current_filter === "delete_{$meta_type}_metadata" ) ) {
				return $return;
			}

			if ( $current_filter === "add_{$meta_type}_metadata" && serialize( $necessary_args ) === serialize( $this->previous_filter ) ) {
				return $return;
			}
		}

		Jetpack_Sync::schedule_sync();
		$this->sync_queue->add( array(
			$current_filter,
			$args
		) );

		$this->previous_filter = $necessary_args;

		return $return;

	}

	function switch_theme_handler() {
		global $_wp_theme_features;
		
		do_action( 'jetpack_sync_current_theme_support', $_wp_theme_features );
	}

	function do_sync() {
		$this->maybe_sync_constants();
		$buffer = $this->sync_queue->checkout();

		if ( is_wp_error( $buffer) ) {
			error_log( "Got error: ".$buffer->get_error_message() );
			return;
		}

		$data = $this->codec->encode( $buffer->items );

		/**
		 * Fires when data is ready to send to the server
		 *
		 * @since 4.1
		 *
		 * @param array $data The action buffer
		 */
		$result = apply_filters( 'jetpack_sync_client_send_data', $data );

		if ( !$result || is_wp_error( $result ) ) {
			$this->sync_queue->checkin( $buffer );
		} else {
			$this->sync_queue->close( $buffer );
		}
	}
	
	private function maybe_sync_constants() {
		$constants = $this->get_all_constants();
		$constants_check_sum = $this->get_check_sum( $constants );
		$check_sum_option = 'jetpack_constants_sync_checksum';
		if ( $constants_check_sum !== get_option( $check_sum_option ) ) {
			do_action( 'jetpack_sync_current_constants', $constants );
			update_option( $check_sum_option, $constants_check_sum );
		}
	}

	private function get_all_constants() {
		return array_combine( $this->constants_whitelist, array_map( array( $this, 'get_constant' ), $this->constants_whitelist ) );
	}

	private function get_constant( $constant ) {
		if ( defined( $constant ) ) {
			return constant( $constant );
		}

		return null;
	}

	private function get_check_sum( $values ) {
		return crc32( json_encode( $values ) );
	}


	function get_actions() {
		// TODO: we should only send a bit at a time, flush_all sends everything
		return $this->sync_queue->flush_all();
	}

	function get_all_actions() {
		return $this->sync_queue->get_all();
	}

	function reset_actions() {
		$this->sync_queue->reset();
	}
}
