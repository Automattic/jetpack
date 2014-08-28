<?php
class WPCOM_JSON_API_Update_Comment_Endpoint extends WPCOM_JSON_API_Comment_Endpoint {
	function __construct( $args ) {
		parent::__construct( $args );
		if ( $this->api->ends_with( $this->path, '/delete' ) ) {
			$this->comment_object_format['status']['deleted'] = 'The comment has been deleted permanently.';
		}
	}

	// /sites/%s/posts/%d/replies/new    -> $blog_id, $post_id
	// /sites/%s/comments/%d/replies/new -> $blog_id, $comment_id
	// /sites/%s/comments/%d             -> $blog_id, $comment_id
	// /sites/%s/comments/%d/delete      -> $blog_id, $comment_id
	function callback( $path = '', $blog_id = 0, $object_id = 0 ) {
		if ( $this->api->ends_with( $path, '/new' ) )
			$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ), false );
		else
			$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( $this->api->ends_with( $path, '/delete' ) ) {
			return $this->delete_comment( $path, $blog_id, $object_id );
		} elseif ( $this->api->ends_with( $path, '/new' ) ) {
			if ( false !== strpos( $path, '/posts/' ) ) {
				return $this->new_comment( $path, $blog_id, $object_id, 0 );
			} else {
				return $this->new_comment( $path, $blog_id, 0, $object_id );
			}
		}

		return $this->update_comment( $path, $blog_id, $object_id );
	}

	// /sites/%s/posts/%d/replies/new    -> $blog_id, $post_id
	// /sites/%s/comments/%d/replies/new -> $blog_id, $comment_id
	function new_comment( $path, $blog_id, $post_id, $comment_parent_id ) {
		if ( !$post_id ) {
			$comment_parent = get_comment( $comment_parent_id );
			if ( !$comment_parent_id || !$comment_parent || is_wp_error( $comment_parent ) ) {
				return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
			}

			$post_id = $comment_parent->comment_post_ID;
		}

		$post = get_post( $post_id );
		if ( !$post || is_wp_error( $post ) ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		if ( -1 == get_option( 'blog_public' ) && ! is_user_member_of_blog() && ! is_super_admin() ) {
			return new WP_Error( 'unauthorized', 'User cannot create comments', 403 );
		}

		if ( !comments_open( $post->ID ) ) {
			return new WP_Error( 'unauthorized', 'Comments on this post are closed', 403 );
		}

		$can_view = $this->user_can_view_post( $post->ID );
		if ( !$can_view || is_wp_error( $can_view ) ) {
			return $can_view;
		}

		$post_status = get_post_status_object( $post->post_status );
		if ( !$post_status->public && !$post_status->private ) {
			return new WP_Error( 'unauthorized', 'Comments on drafts are not allowed', 403 );
		}

		$args  = $this->query_args();
		$input = $this->input();
		if ( !is_array( $input ) || !$input || !strlen( $input['content'] ) ) {
			return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
		}

		$user = wp_get_current_user();
		if ( !$user || is_wp_error( $user ) || !$user->ID ) {
			$auth_required = false;
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				$auth_required = true;
			} elseif ( isset( $this->api->token_details['user'] ) ) {
				$user = (object) $this->api->token_details['user'];
				foreach ( array( 'display_name', 'user_email', 'user_url' ) as $user_datum ) {
					if ( !isset( $user->$user_datum ) ) {
						$auth_required = true;
					}
				}
				if ( !isset( $user->ID ) ) {
					$user->ID = 0;
				}
			} else {
				$auth_required = true;
			}

			if ( $auth_required ) {
				return new WP_Error( 'authorization_required', 'An active access token must be used to comment.', 403 );
			}
		}

		$insert = array(
			'comment_post_ID'      => $post->ID,
			'user_ID'              => $user->ID,
			'comment_author'       => $user->display_name,
			'comment_author_email' => $user->user_email,
			'comment_author_url'   => $user->user_url,
			'comment_content'      => $input['content'],
			'comment_parent'       => $comment_parent_id,
			'comment_type'         => '',
		);

		if ( $comment_parent_id ) {
			if ( $comment_parent->comment_approved === '0' && current_user_can( 'edit_comment', $comment_parent->comment_ID ) ) {
				wp_set_comment_status( $comment_parent->comment_ID, 'approve' );
			}
		}

		$this->api->trap_wp_die( 'comment_failure' );
		$comment_id = wp_new_comment( add_magic_quotes( $insert ) );
		$this->api->trap_wp_die( null );

		$return = $this->get_comment( $comment_id, $args['context'] );
		if ( !$return ) {
			return new WP_Error( 400, __( 'Comment cache problem?', 'jetpack' ) );
		}
		if ( is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'comments' );
		return $return;
	}

	// /sites/%s/comments/%d -> $blog_id, $comment_id
	function update_comment( $path, $blog_id, $comment_id ) {
		$comment = get_comment( $comment_id );
		if ( !$comment || is_wp_error( $comment ) ) {
			return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
		}

		if ( !current_user_can( 'edit_comment', $comment->comment_ID ) ) {
			return new WP_Error( 'unauthorized', 'User cannot edit comment', 403 );
		}

		$args  = $this->query_args();
		$input = $this->input( false );
		if ( !is_array( $input ) || !$input ) {
			return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
		}

		$update = array();
		foreach ( $input as $key => $value ) {
			$update["comment_$key"] = $value;
		}

		$comment_status = wp_get_comment_status( $comment->comment_ID );
		if ( $comment_status !== $update['status'] && !current_user_can( 'moderate_comments' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot moderate comments', 403 );
		}

		if ( isset( $update['comment_status'] ) ) {
			if ( count( $update ) === 1 ) {
				// We are only here to update the comment status so let's respond ASAP
				add_action( 'wp_set_comment_status', array( $this, 'output_comment' ), 0, 1 );
			}
			switch ( $update['comment_status'] ) {
				case 'approved' :
					if ( 'approve' !== $comment_status ) {
						wp_set_comment_status( $comment->comment_ID, 'approve' );
					}
					break;
				case 'unapproved' :
					if ( 'hold' !== $comment_status ) {
						wp_set_comment_status( $comment->comment_ID, 'hold' );
					}
					break;
				case 'spam' :
					if ( 'spam' !== $comment_status ) {
						wp_spam_comment( $comment->comment_ID );
					}
					break;
				case 'unspam' :
					if ( 'spam' === $comment_status ) {
						wp_unspam_comment( $comment->comment_ID );
					}
					break;
				case 'trash' :
					if ( ! EMPTY_TRASH_DAYS ) {
						return new WP_Error( 'trash_disabled', 'Cannot trash comment', 403 );
					}

					if ( 'trash' !== $comment_status ) {
 						wp_trash_comment( $comment_id );
 					}
 					break;
				case 'untrash' :
					if ( 'trash' === $comment_status ) {
						wp_untrash_comment( $comment->comment_ID );
					}
					break;
				default:
					$update['comment_approved'] = 1;
					break;
			}
			unset( $update['comment_status'] );
		}

		if ( ! empty( $update ) ) {
			$update['comment_ID'] = $comment->comment_ID;
			wp_update_comment( add_magic_quotes( $update ) );
		}

		$return = $this->get_comment( $comment->comment_ID, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'comments' );
		return $return;
	}

	// /sites/%s/comments/%d/delete -> $blog_id, $comment_id
	function delete_comment( $path, $blog_id, $comment_id ) {
		$comment = get_comment( $comment_id );
		if ( !$comment || is_wp_error( $comment ) ) {
			return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
		}

		if ( !current_user_can( 'edit_comment', $comment->comment_ID ) ) { // [sic] There is no delete_comment cap
			return new WP_Error( 'unauthorized', 'User cannot delete comment', 403 );
		}

		$args  = $this->query_args();
		$return = $this->get_comment( $comment->comment_ID, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'comments' );

		wp_delete_comment( $comment->comment_ID );
		$status = wp_get_comment_status( $comment->comment_ID );
		if ( false === $status ) {
			$return['status'] = 'deleted';
			return $return;
		}

		return $this->get_comment( $comment->comment_ID, $args['context'] );
	}

	function output_comment( $comment_id ) {
		$args  = $this->query_args();
		$output = $this->get_comment( $comment_id, $args['context'] );
		$this->api->output_early( 200, $output );
	}
}
