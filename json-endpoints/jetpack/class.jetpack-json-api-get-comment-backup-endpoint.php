<?php

class Jetpack_JSON_API_Get_Comment_Backup_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/comments/%d/backup      -> $blog_id, $comment_id

	protected $needed_capabilities = array(); // This endpoint is only accessible using a site token
	protected $comment_id;

	function validate_input( $comment_id ) {
		if ( empty( $comment_id ) || ! is_numeric( $comment_id ) ) {
			return new WP_Error( 'comment_id_not_specified', __( 'You must specify a Comment ID', 'jetpack' ), 400 );
		}

		$this->comment_id = intval( $comment_id );

		return true;
	}

	protected function result() {
		$comment = get_comment( $this->comment_id );
		if ( empty( $comment ) ) {
			return new WP_Error( 'comment_not_found', __( 'Comment not found', 'jetpack' ), 404 );
		}

		$allowed_keys = array(
			'comment_ID',
			'comment_post_ID',
			'comment_author',
			'comment_author_email',
			'comment_author_url',
			'comment_author_IP',
			'comment_date',
			'comment_date_gmt',
			'comment_content',
			'comment_karma',
			'comment_approved',
			'comment_agent',
			'comment_type',
			'comment_parent',
			'user_id',
		);

		$comment = array_intersect_key( $comment->to_array(), array_flip( $allowed_keys ) );
		$comment_meta = get_comment_meta( $comment->comment_ID );

		return array(
			'comment' => $comment,
			'meta'    => is_array( $comment_meta ) ? $comment_meta : array(),
		);
	}

}
