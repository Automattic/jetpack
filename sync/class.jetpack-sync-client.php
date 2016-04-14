<?php
require_once dirname( __FILE__ ) . '/class.jetpack-sync-deflate-codec.php';

class Jetpack_Sync_Client {
	private $sync_queue = array();
	private $codec;

	// this is necessary because you can't use "new" when you declare instance properties >:(
	function __construct() {
		$this->codec = new Jetpack_Sync_Deflate_Codec();
	}

	function init() {
		$handler = array( $this, 'action_handler' );
		// posts
		add_action( 'wp_insert_post', $handler, 10, 3 );
		add_action( 'delete_post', $handler, 10 );
		// comments
		add_action( 'wp_insert_comment', $handler, 10, 2 );
		add_action( 'deleted_comment', $handler, 10 );
		add_action( 'trashed_comment', $handler, 10 );
		// even though it's messy, we implement these hooks because the edit_comment hook doesn't include the data
		foreach ( array( '', 'trackback', 'pingback' ) as $comment_type ) {
			foreach ( array( 'unapproved', 'approved' ) as $comment_status ) {
				add_action( "comment_{$comment_status}_{$comment_type}", $handler, 10, 2 );
			}
		}

	}

	function set_codec( iJetpack_Sync_Codec $codec ) {
		$this->codec = $codec;
	}

	function action_handler() {
		$current_filter = current_filter();
		$args           = func_get_args();

		if ( $current_filter === 'wp_insert_post' && $args[1]->post_type === 'revision' ) {
			return;
		}

		Jetpack_Sync::schedule_sync();
		$this->sync_queue[] = array(
			$current_filter,
			apply_filters( 'jetpack_sync_client_add_data_to_sync', $args, $current_filter )
		);

	}

	function do_sync() {
		$data = $this->codec->encode( $this->sync_queue );

		/**
		 * Fires when data is ready to send to the server
		 *
		 * @since 4.1
		 *
		 * @param array $data The action buffer
		 */
		apply_filters( 'jetpack_sync_client_send_data', $data );
	}

	function get_actions() {
		return $this->sync_queue;
	}

	function reset_actions() {
		$this->sync_queue = array();
	}
}
