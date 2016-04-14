<?php

/**
 * Translates incoming actions from the Jetpack site into mutations on core types
 * In other words: this tries to keep a local datastore in sync with the remote one
 */
class Jetpack_Sync_Server_Replicator {
	private $store;

	function __construct( iJetpack_Sync_Replicastore $store ) {
		$this->store = $store;
	}

	function init() {
		add_action( "jetpack_sync_remote_action", array( $this, 'handle_remote_action' ), 10, 2 );
	}

	function handle_remote_action( $action_name, $args ) {
		switch ( $action_name ) {
			// posts
			case 'wp_insert_post':
				list( $post_id, $post ) = $args;
				$this->store->upsert_post( $post );
				break;
			case 'delete_post':
				list( $post_id ) = $args;
				$this->store->delete_post( $post_id );
				break;
			
			// comments
			case 'wp_insert_comment':
			case ( preg_match( '/^comment_(.*)_(.*)$/', $action_name ) ? true : false ):
				list( $comment_id, $comment ) = $args;
				$this->store->upsert_comment( $comment );
				break;
			case 'deleted_comment':
				list( $comment_id ) = $args;
				$this->store->delete_comment( $comment_id );
				break;
			case 'trashed_comment':
				list( $comment_id ) = $args;
				$this->store->trash_comment( $comment_id );
				break;
			case 'spammed_comment':
				list( $comment_id ) = $args;
				$this->store->spam_comment( $comment_id );
				break;

			// options
			case 'added_option':
				list( $option, $value ) = $args;
				$this->store->update_option( $option, $value );
				break;
			case 'updated_option':
				list( $option, $old_value, $value ) = $args;
				$this->store->update_option( $option, $value );
				break;
			case 'deleted_option':
				list( $option ) = $args;
				$this->store->delete_option( $option );
				break;
			
			// themes				
			case 'jetpack_sync_current_theme_support':
				list( $theme_options ) = $args;
				$this->store->set_theme_support( $theme_options );
				break;
			default:
				error_log( "The action '$action_name' is unknown" );
		}
	}
}
