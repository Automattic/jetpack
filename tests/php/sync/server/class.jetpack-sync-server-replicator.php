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
		add_action( "jetpack_sync_remote_action", array( $this, 'handle_remote_action' ), 10, 5 );
	}
	
	function handle_remote_action( $action_name, $args, $user_id, $timestamp, $token ) {

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
			case 'transition_post_status':
				// Not used for syncing content.
				// But fire events when posts go public.
				break;
			
			// attachments
			case 'attachment_updated':
				list( $post_ID, $post, $post_before ) = $args;
				$this->store->upsert_post( $post );
				break;
			case 'jetpack_sync_save_add_attachment':
				list( $attachment_ID, $attachment ) = $args;
				$this->store->upsert_post( $attachment );
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
			case ( preg_match( '/^updated_(.*)_meta$/', $action_name, $matches ) ? true : false ):
				list( $meta_id, $object_id, $meta_key, $meta_value ) = $args;
				$type = $matches[1];

				$this->store->upsert_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id );
				break;

			case ( preg_match( '/^deleted_(.*)_meta$/', $action_name, $matches ) ? true : false ):
				list( $meta_ids, $object_id, $meta_key, $meta_value ) = $args;
				$type = $matches[1];
				$this->store->delete_metadata( $type, $object_id, $meta_ids );
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
				$this->store->set_updates( 'themes', $updates );
				break;
			case 'set_site_transient_update_core':
				list( $updates ) = $args;
				$this->store->set_updates( 'core', $updates );
				break;

			// functions
			case 'jetpack_sync_current_callable':
				list( $name, $value ) = $args;
				$this->store->set_callable( $name, $value );
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
				list( $checksum ) = $args;
				$this->store->full_sync_end( $checksum );
				break;

			case 'jetpack_full_sync_posts':
				foreach( $args['posts'] as $post ) {
					$this->store->upsert_post( $post );
				}
				foreach ( $args['post_metas'] as $meta ) {
					$this->store->upsert_metadata( 'post', $meta->post_id, $meta->meta_key, $meta->meta_value, $meta->meta_id );
				}
			
				foreach ( $args['terms'] as $term_object ) {
					$term = $this->store->get_term( false, $term_object->term_taxonomy_id, 'term_taxonomy_id' );
					if ( isset( $term->taxonomy ) ) {
						$this->store->update_object_terms( $term_object->object_id, $term->taxonomy, array( $term->term_id ), true );
					}
				}
				break;
			case 'jetpack_full_sync_comments':
				foreach( $args['comments'] as $comment ) {
					$this->store->upsert_comment( $comment );
				}
				foreach ( $args['comment_metas'] as $meta ) {
					$this->store->upsert_metadata( 'comment', $meta->comment_id, $meta->meta_key, $meta->meta_value, $meta->meta_id );
				}
				break;
			case 'jetpack_full_sync_options':
				foreach( $args as $option => $value ) {
					$this->store->update_option( $option, $value );
				}
				break;
			case 'jetpack_full_sync_network_options':
				foreach( $args as $option => $value ) {
					$this->store->update_site_option( $option, $value );
				}
				break;
			case 'jetpack_full_sync_users':
				foreach( $args as $user ) {
					$this->store->upsert_user( $user );
				}
				break;
			case 'jetpack_full_sync_terms': {
				foreach( $args as $term_object ) {
					$this->store->update_term( $term_object );
				}
			}
			// terms
			case 'jetpack_sync_save_term':
				list( $term_object ) = $args;
				$this->store->update_term( $term_object );
				break;

			case 'delete_term':
				list( $term_id, $tt_id, $taxonomy, $deleted_term_or_error  ) = $args;
				$this->store->delete_term( $term_id, $taxonomy );
				break;

			case 'set_object_terms':
				if ( ! isset( $args[4] ) ) { // in case $append is not set.
					$args[4] = false;
				}
				list( $object_id, $term_ids, $tt_ids, $taxonomy, $append ) = $args;
				$this->store->update_object_terms( $object_id, $taxonomy, $term_ids, $append );

				break;
			case 'deleted_term_relationships':
				list( $object_id, $tt_ids ) = $args;
				$this->store->delete_object_terms( $object_id, $tt_ids );
				break;
			
			// users
			case 'jetpack_sync_save_user':
				list( $user ) = $args;
				$this->store->upsert_user( $user );
				break;
			case 'deleted_user':
				list( $user_id, $reassign ) = $args;
				$this->store->delete_user( $user_id );
				break;
		}
	}
}
