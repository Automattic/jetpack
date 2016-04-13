<?php

/**
 * A high-level interface for objects that store synced WordPress data
 * Useful for ensuring that different storage mechanisms implement the 
 * required semantics for storing all the data that we sync
 */
interface iJetpack_Sync_Replicastore {
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
	public function delete_comment( $comment_id );
}