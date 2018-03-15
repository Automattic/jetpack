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
		add_action( 'jetpack_sync_remote_action', array( $this, 'handle_remote_action' ), 5, 8 );
	}

	function handle_remote_action( $action_name, $args, $user_id, $silent, $timestamp, $sent_timestamp, $queue_id, $token ) {

		switch ( $action_name ) {
			// posts
			case 'jetpack_post_saved': // break intentially left blank
			case 'jetpack_post_published':
				$this->store->upsert_post( $args[0]['object'], $silent );
				break;
			case 'deleted_post':
				list( $post_id ) = $args;
				$this->store->delete_post( $post_id );
				break;

			// attachments
			case 'attachment_updated':
				list( $post_id, $post, $post_before ) = $args;
				$this->store->upsert_post( $post, $silent );
				break;
			case 'jetpack_sync_save_update_attachment':
			case 'jetpack_sync_save_add_attachment':
				list( $attachment_id, $attachment ) = $args;
				$this->store->upsert_post( $attachment, $silent );
				break;

			// comments
			case 'wp_insert_comment':
			case ( preg_match( '/^comment_[^_]*_[^_]*$/', $action_name ) ? true : false ):
				list( $comment_id, $comment ) = $args;
				$this->store->upsert_comment( $comment, $silent );
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
			case 'trashed_post_comments':
				list( $post_id, $statuses ) = $args;
				$statuses = (array) $statuses;
				$this->store->trashed_post_comments( $post_id, $statuses );
				break;
			case 'untrash_post_comments':
				list( $post_id ) = $args;
				$this->store->untrashed_post_comments( $post_id );
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
			case 'jetpack_full_sync_theme_data':
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
			case 'jetpack_sync_constant':
				list( $name, $value ) = $args;
				$this->store->set_constant( $name, $value );
				break;

			// updates
			case 'jetpack_update_plugins_change':
				list( $updates ) = $args;
				$this->store->set_updates( 'plugins', $updates );
				break;
			case 'jetpack_update_themes_change':
				list( $updates ) = $args;
				$this->store->set_updates( 'themes', $updates );
				break;
			case 'jetpack_update_core_change':
				list( $updates ) = $args;
				$this->store->set_updates( 'core', $updates );
				break;

			// functions
			case 'jetpack_sync_callable':
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

			// full sync
			case 'jetpack_full_sync_start':
				list( $config ) = $args;
				$this->store->full_sync_start( $config );
				break;

			case 'jetpack_full_sync_end':
				list( $checksum ) = $args;
				$this->store->full_sync_end( $checksum );
				break;

			case 'jetpack_full_sync_posts':
				list( $posts, $post_metas, $terms ) = $args;
				foreach ( $posts as $post ) {
					$this->store->upsert_post( $post, true ); // upsert silently
				}
				foreach ( $post_metas as $meta ) {
					$this->store->upsert_metadata( 'post', $meta->post_id, $meta->meta_key, $meta->meta_value, $meta->meta_id );
				}

				foreach ( $terms as $term_object ) {
					$term = $this->store->get_term( false, $term_object->term_taxonomy_id, 'term_taxonomy_id' );
					if ( isset( $term->taxonomy ) ) {
						$this->store->update_object_terms( $term_object->object_id, $term->taxonomy, array( $term->term_id ), true );
					}
				}
				break;
			case 'jetpack_full_sync_comments':
				list( $comments, $comment_metas ) = $args;

				foreach ( $comments as $comment ) {
					$this->store->upsert_comment( $comment );
				}
				foreach ( $comment_metas as $meta ) {
					$this->store->upsert_metadata( 'comment', $meta->comment_id, $meta->meta_key, $meta->meta_value, $meta->meta_id );
				}
				break;
			case 'jetpack_full_sync_options':
				foreach ( $args as $option => $value ) {
					$this->store->update_option( $option, $value );
				}
				break;
			case 'jetpack_full_sync_network_options':
				foreach ( $args as $option => $value ) {
					$this->store->update_site_option( $option, $value );
				}
				break;
			case 'jetpack_full_sync_constants':
				foreach ( $args as $name => $value ) {
					$this->store->set_constant( $name, $value );
				}
				break;
			case 'jetpack_full_sync_callables':
				foreach ( $args as $name => $value ) {
					$this->store->set_callable( $name, $value );
				}
				break;
			case 'jetpack_full_sync_users':
				foreach ( $args as $user ) {
					$this->store->upsert_user( $user );
				}
				break;
			case 'jetpack_full_sync_terms':
				foreach ( $args as $term_object ) {
					$this->store->update_term( $term_object );
				}
				break;
			case 'jetpack_full_sync_updates':
				foreach ( $args as $update_name => $update_value ) {
					$this->store->set_updates( $update_name, $update_value );
				}
				break;

			// terms
			case 'jetpack_sync_save_term': //break intentionally omitted
			case 'jetpack_sync_add_term':
				list( $term_object ) = $args;
				$this->store->update_term( $term_object );
				break;

			case 'delete_term':
				list( $term_id, $tt_id, $taxonomy, $deleted_term_or_error ) = $args;
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
			case 'jetpack_sync_register_user':
			case 'jetpack_sync_add_user':
			case 'jetpack_sync_save_user':
				list( $user ) = $args;
				$this->store->upsert_user( $user );
				break;
			case 'jetpack_deleted_user':
				list( $user_id, $reassign ) = $args;
				$this->store->delete_user( $user_id );
				break;
			case 'jetpack_removed_user_from_blog':
				list( $user_id, $blog_id ) = $args;
				$this->store->delete_user( $user_id );
				break;

			case 'jetpack_sync_user_locale':
				list( $user_id, $locale ) = $args;
				$this->store->upsert_user_locale( $user_id, $locale );
				break;

			case 'jetpack_sync_user_locale_delete':
				list( $user_id ) = $args;
				$this->store->delete_user_locale( $user_id );
				break;

			// plugins
			case 'deleted_plugin':
				list( $plugin_file, $deleted ) = $args;
				if ( $deleted ) {
					$plugins = $this->store->get_callable( 'get_plugins' );
					unset( $plugins[ $plugin_file ] );
					$this->store->set_callable( 'get_plugins', $plugins );
				}
		}
	}
}
