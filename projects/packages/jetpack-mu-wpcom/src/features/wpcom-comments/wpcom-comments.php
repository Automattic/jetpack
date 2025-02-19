<?php
/**
 * Adds a "Like" action to comment rows and handles the required scripts in the admin area.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds a "Like" action to comment rows.
 *
 * @param array      $actions Array of actions for the comment.
 * @param WP_Comment $comment The comment object.
 * @return array Modified actions array.
 */
function wpcom_comments_enable_likes( $actions, $comment ) {
	$comment_id = (int) $comment->comment_ID;

	$actions['like'] = sprintf(
		'<span data-comment-id="%s" class="wpcom-comment-like"></span>',
		esc_attr( $comment_id )
	);

	return $actions;
}
add_filter( 'comment_row_actions', 'wpcom_comments_enable_likes', 10, 2 );

/**
 * Enqueues the comment like JavaScript in the admin area.
 *
 * The script is only enqueued on the "Edit Comments" screen.
 *
 * @param string $hook The current admin page.
 */
function wpcom_enqueue_comment_like_script( $hook ) {
	// Only run on the edit-comments screen.
	if ( 'edit-comments.php' !== $hook ) {
		return;
	}

	// Enqueue the script.
	jetpack_mu_wpcom_enqueue_assets( 'wpcom-comment-like', array( 'js' ) );

	// Localize the script with necessary data.
	wp_localize_script(
		'jetpack-mu-wpcom-wpcom-comment-like',
		'wpcomCommentLikesData',
		array(
			'likeFeedback'    => esc_html__( 'Like', 'jetpack-mu-wpcom' ),
			'likedFeedback'   => esc_html__( 'Liked by you', 'jetpack-mu-wpcom' ),
			'loadingFeedback' => esc_html__( 'Loading...', 'jetpack-mu-wpcom' ),
			'siteId'          => wpcom_get_current_blog_id(),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_comment_like_script', 10, 2 );
