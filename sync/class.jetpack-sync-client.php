<?php

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
		$current_filter     = current_filter();
		$args               = func_get_args();
		$this->sync_queue[] = array(
			$current_filter,
			$args
		);
	}

	function get_sync() {
		$data = $this->codec->encode( $this->sync_queue );

		/**
		 * Fires when data is ready to send to the server
		 *
		 * @since 4.1
		 *
		 * @param array $data The action buffer
		 */
		return apply_filters( 'jetpack_sync_client_send_data', $data );
	}


}

/**
 * Very simple interface for encoding and decoding input
 * This is used to provide compression and serialization to messages
 **/
interface iJetpack_Sync_Codec {
	public function encode( $object );
	public function decode( $input );
}
/**
 * An implementation of iJetpack_Sync_Codec that uses gzip's DEFLATE
 * algorithm to compress objects serialized using PHP's default
 * serializer
 */
class Jetpack_Sync_Deflate_Codec implements iJetpack_Sync_Codec {
	public function encode( $object ) {
		return gzdeflate( serialize( $object ) );
	}
	public function decode( $input ) {
		return unserialize( gzinflate( $input ) );
	}
}
