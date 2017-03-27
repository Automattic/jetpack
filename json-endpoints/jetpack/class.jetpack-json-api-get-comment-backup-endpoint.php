<?php

class Jetpack_JSON_API_Get_Comment_Backup_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/comments/%d/backup      -> $blog_id, $comment_id

	protected $needed_capabilities = array();
	protected $comment_id;

	function validate_input( $comment_id ) {
		if ( empty( $comment_id ) || ! is_numeric( $comment_id ) ) {
			return new WP_Error( 'comment_id_not_specified', __( 'You must specify a Comment ID', 'jetpack' ) );
		}

		$this->comment_id = intval( $comment_id );

		return true;
	}

	protected function result() {
		$comment = get_comment( $this->comment_id );
		if ( empty( $comment ) ) {
			return new WP_Error( 'comment_not_found', __( 'Comment not found', 'jetpack' ) );
		}			
		
		return array(
			'comment' => $comment->to_array(),
			'meta'    => get_comment_meta( $comment->comment_ID ),
		);
	}

}
