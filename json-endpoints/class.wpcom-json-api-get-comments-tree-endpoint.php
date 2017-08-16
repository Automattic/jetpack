<?php

class WPCOM_JSON_API_Get_Comments_Tree_Endpoint extends WPCOM_JSON_API_Endpoint {
	/**
	 * Retrieves a list of comment data for a given site.
	 *
	 * @param   {string} $status   filter by status: 'all' | 'approved' | 'pending' | 'spam' | 'trash'
	 * @param   {int}    $start_at first comment to search from going back in time
	 * @returns {array}            list of comment information matching query
	 */
	public function get_site_tree( $status, $start_at = PHP_INT_MAX ) {
		global $wpdb;
		$max_comment_count = 10000;
		$total_count = $this->get_site_tree_total_count( $status );
		$db_status = $this->get_comment_db_status( $status );

		$db_comments = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT comment_ID, comment_post_ID, comment_parent " .
				"FROM $wpdb->comments AS comments " .
				"INNER JOIN $wpdb->posts AS posts ON comments.comment_post_ID = posts.ID " .
				"WHERE comment_type = '' AND comment_ID <= %d AND ( %s = 'all' OR comment_approved = %s ) " .
				"ORDER BY comment_ID DESC " .
				"LIMIT %d",
				(int) $start_at, $db_status, $db_status, $max_comment_count
			),
			ARRAY_N
		);

		// Avoid using anonymous function bellow in order to preserve PHP 5.2 compatibility.
		function intval_array_map( $comments ) {
			return array_map( 'intval', $comments );
		}

		return array( $total_count, array_map( 'intval_array_map', $db_comments ) );
	}

	/**
	 * Retrieves a total count of comments for the given site.
	 *
	 * @param   {string} $status   filter by status: 'all' | 'approved' | 'pending' | 'spam' | 'trash'
	 * @returns {int}              total count of comments for a site
	 */
	public function get_site_tree_total_count( $status ) {
		global $wpdb;
		$db_status = $this->get_comment_db_status( $status );

		return $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(1) " .
				"FROM $wpdb->comments AS comments " .
				"INNER JOIN $wpdb->posts AS posts ON comments.comment_post_ID = posts.ID " .
				"WHERE comment_type = '' AND ( %s = 'all' OR comment_approved = %s )",
				$db_status, $db_status
			)
		);
	}

	/**
	 * Ensure a valid status is converted to a database-supported value if necessary.
	 *
	 * @param   {string} $status 'all' | 'approved' | 'pending' | 'spam' | 'trash'
	 * @returns {string}         value that exists in database
	 */
	public function get_comment_db_status( $status ) {
		if ( 'approved' === $status ) {
			$status = '1';
		}
		if ( 'pending' === $status ) {
			$status = '0';
		}
		return $status;
	}

	public function validate_status_param( $status ) {
		return in_array( $status, array( 'all', 'approved', 'pending', 'spam', 'trash' ) );
	}

	// /sites/%s/comments-tree
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();
		$comment_status = $args['status'];

		if ( ! $this->validate_status_param( $comment_status ) ) {
			return new WP_Error( 'invalid_status', 'Invalid comment status value provided ', 400 );
		}

		return $this->get_site_tree( $comment_status );
	}
}
