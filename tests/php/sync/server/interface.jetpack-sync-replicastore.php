<?php
/**
 * Sync architecture prototype
 * @author Dan Walmsley
 * To run tests: phpunit --testsuite sync --filter New_Sync
 */

/**
 * A high-level interface for objects that store synced WordPress data
 * Useful for ensuring that different storage mechanisms implement the
 * required semantics for storing all the data that we sync
 */
interface iJetpack_Sync_Replicastore {
	// synced wp version
	public function get_wp_version();
	public function set_wp_version( $version );

	// remove all data
	public function reset();

	// trigger setup for sync start/end
	public function full_sync_start();
	public function full_sync_end();
	
	// posts
	public function post_count( $status = null );
	public function get_posts( $status = null );
	public function get_post( $id );
	public function upsert_post( $post );
	public function delete_post( $post_id );

	// comments
	public function comment_count( $status = null );
	public function get_comments( $status = null );
	public function get_comment( $id );
	public function upsert_comment( $comment );
	public function trash_comment( $comment_id );
	public function spam_comment( $comment_id );
	public function delete_comment( $comment_id );

	// options
	public function update_option( $option, $value );
	public function get_option( $option );
	public function delete_option( $option );

	// themes
	public function set_theme_support( $theme_support );
	public function current_theme_supports( $feature );

	// meta
	public function get_metadata( $type, $object_id, $meta_key, $single = false );
	public function add_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id );
	public function update_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id );
	public function delete_metadata( $meta_ids );

	// constants
	public function get_constant( $constant );
	public function set_constants( $constants );

	// updates
	public function get_updates( $type );
	public function set_updates( $type, $updates );

	// functions
	public function get_callable( $callable );
	public function set_callables( $callables );

	// network options
	public function get_site_option( $option );
	public function update_site_option( $option, $value );
	public function delete_site_option( $option );
	
	// terms 
	public function get_terms( $taxonomy );
	public function get_the_terms( $object_id, $taxonomy );
	public function update_term( $taxonomy, $term_object );
	public function delete_term( $term_id, $taxonomy, $object_ids );

	// users
	public function get_user( $user_id );
	public function update_user( $user_id, $user );
	public function delete_user( $user_id );
}
