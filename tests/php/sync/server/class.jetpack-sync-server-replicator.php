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
			case 'deleted_post':
				list( $post_id ) = $args;
				$this->store->delete_post( $post_id );
				break;
			
			// comments
			case 'wp_insert_comment':
			case ( preg_match( '/^comment_[^_]*_[^_]*$/', $action_name ) ? true : false ):
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

			// metadata - actions
			case ( preg_match( '/^added_(.*)_meta$/', $action_name, $matches ) ? true : false ):
				list( $meta_id, $object_id, $meta_key, $meta_value  ) = $args;
				$type = $matches[1];
				$this->store->add_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id );
				break;

			case ( preg_match( '/^updated_(.*)_meta$/', $action_name, $matches ) ? true : false ):
				list( $meta_id, $object_id, $meta_key, $meta_value ) = $args;
				$type = $matches[1];
				$this->store->update_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id );
				break;

			case ( preg_match( '/^deleted_(.*)_meta$/', $action_name, $matches ) ? true : false ):
				list( $meta_ids, $object_id, $meta_key, $meta_value ) = $args;
				$this->store->delete_metadata( $meta_ids );
				break;

			// constants
			case 'jetpack_sync_current_constants':
				list( $constants ) = $args;
				$this->store->set_constants( $constants );
				break;

			// updates
			case 'set_site_transient_update_plugins':
				list( $updates ) = $args;
				$this->store->set_updates( 'plugins', $updates );
				break;
			case 'set_site_transient_update_themes':
				list( $updates ) = $args;
				$this->store->set_updates( 'themes', $updates);
				break;
			case 'set_site_transient_update_core':
				list( $updates ) = $args;
				$this->store->set_updates( 'core', $updates);
				break;

			// functions
			case 'jetpack_sync_current_callables':
				list( $functions ) = $args;
				$this->store->set_callables( $functions );
				break;

			// network options
			case 'add_site_option':
				list( $option, $value ) = $args;
				$this->store->update_site_option( $option, $value );
				break;
			case 'update_site_option':
				// Note: the order here is different from update_option
				list( $option, $value, $old_value ) = $args;
				$this->store->update_site_option( $option, $value );
				break;
			case 'delete_site_option':
				list( $option ) = $args;
				$this->store->delete_site_option( $option );
				break;

			// wp version
			case 'jetpack_sync_wp_version':
				list( $wp_version ) = $args;
				$this->store->set_wp_version( $wp_version );
				break;

			// full sync
			case 'jetpack_full_sync_start':
				$this->store->full_sync_start();
				break;

			case 'jetpack_full_sync_end':
				$this->store->full_sync_end();
				break;

			case 'jetpack_full_sync_posts':
				foreach( $args['posts'] as $post ) {
					$this->store->upsert_post( $post );
				}
				foreach ( $args['post_metas'] as $meta ) {
					$this->store->add_metadata( 'post', $meta->post_id, $meta->meta_key, $meta->meta_value, $meta->meta_id );
				}
				break;
			case 'jetpack_full_sync_comments':
				foreach( $args['comments'] as $comment ) {
					$this->store->upsert_comment( $comment );
				}
				foreach ( $args['comment_metas'] as $meta ) {
					$this->store->add_metadata( 'comment', $meta->comment_id, $meta->meta_key, $meta->meta_value, $meta->meta_id );
				}
				break;
			case 'jetpack_full_sync_option':
				list( $option, $value ) = $args;
				$this->store->update_option( $option, $value );
				break;

			// terms
			case 'jetapack_sync_save_term':
				list( $term_id, $tt_id, $taxonomy, $term_object ) = $args;
				$this->store->update_term( $taxonomy, $term_object );
				break;

			case 'delete_term':
				list( $term_id, $tt_id, $taxonomy, $deleted_term_or_error, $object_ids  ) = $args;
				$this->store->delete_term( $term_id, $taxonomy, $object_ids );
				break;
			
			// users
			case 'jetapack_sync_save_user':
				list( $user_id, $user ) = $args;
				$this->store->update_user( $user_id, $user );
				break;
			case 'deleted_user':
				list( $user_id, $reassign ) = $args;
				$this->store->delete_user( $user_id );
				break;

			default:
				error_log( "The action '$action_name' is unknown. See class.jetpack-sync-server-replicator.php." );
		}
	}
}
