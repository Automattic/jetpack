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
	// remove all data
	public function reset();

	// trigger setup for sync start/end
	public function full_sync_start( $config );

	public function full_sync_end( $checksum );

	// posts
	public function post_count( $status = null, $min_id = null, $max_id = null );

	public function get_posts( $status = null, $min_id = null, $max_id = null );

	public function get_post( $id );

	public function upsert_post( $post, $silent = false );

	public function delete_post( $post_id );

	public function posts_checksum( $min_id = null, $max_id = null );

	// comments
	public function comment_count( $status = null, $min_id = null, $max_id = null );

	public function get_comments( $status = null, $min_id = null, $max_id = null );

	public function get_comment( $id );

	public function upsert_comment( $comment );

	public function trash_comment( $comment_id );

	public function spam_comment( $comment_id );

	public function delete_comment( $comment_id );

	public function trashed_post_comments( $post_id, $statuses );

	public function untrashed_post_comments( $post_id );

	public function comments_checksum( $min_id = null, $max_id = null );

	// options
	public function update_option( $option, $value );

	public function get_option( $option, $default = false );

	public function delete_option( $option );

	// themes
	public function set_theme_support( $theme_support );

	public function current_theme_supports( $feature );

	// meta
	public function get_metadata( $type, $object_id, $meta_key = '', $single = false );

	public function upsert_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id );

	public function delete_metadata( $type, $object_id, $meta_ids );

	// constants
	public function get_constant( $constant );

	public function set_constant( $constant, $value );

	// updates
	public function get_updates( $type );

	public function set_updates( $type, $updates );

	// functions
	public function get_callable( $callable );

	public function set_callable( $callable, $value );

	// network options
	public function get_site_option( $option );

	public function update_site_option( $option, $value );

	public function delete_site_option( $option );

	// terms
	public function get_terms( $taxonomy );

	public function get_term( $taxonomy, $term_id, $is_term_id = true );

	public function update_term( $term_object );

	public function delete_term( $term_id, $taxonomy );

	public function get_the_terms( $object_id, $taxonomy );

	public function update_object_terms( $object_id, $taxonomy, $terms, $append );

	public function delete_object_terms( $object_id, $tt_ids );

	// users
	public function user_count();

	public function get_user( $user_id );

	public function upsert_user( $user );

	public function delete_user( $user_id );

	public function get_allowed_mime_types( $user_id );


	// full checksum
	public function checksum_all();

	// histogram
	public function checksum_histogram( $object_type, $buckets, $start_id = null, $end_id = null );
}
