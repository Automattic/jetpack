<?php
/**
 * Adds a "Like" action to comment rows and handles the required scripts in the admin area.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds a "Like" action link to comment rows.
 *
 * @param array      $actions The existing comment row actions.
 * @param WP_Comment $comment The comment object for the current row.
 * @return array Modified array of comment row actions.
 */
function wpcom_add_comment_like_action( $actions, $comment ) {
	$comment_id = $comment->comment_ID;
	$blog_id    = esc_attr( get_current_blog_id() );
	$nonce      = wp_create_nonce( 'like_comment_' . $comment_id . '_' . $blog_id );

	$feedback = esc_html( comment_like_get_feedback_esc( $comment_id ) );

	$actions['like'] = sprintf(
		'<a data-nonce="%s" data-comment="%s" data-blog="%s" href="#" class="comment-like-link"><span>%s</span></a>',
		esc_attr( $nonce ),
		$comment_id,
		$blog_id,
		$feedback
	);

	return $actions;
}
if ( function_exists( 'comment_like_get_feedback_esc' ) ) {
	add_filter( 'comment_row_actions', 'wpcom_add_comment_like_action', 10, 2 );
}

/**
 * Enqueues the comment like JavaScript in the admin area.
 *
 * The script is only enqueued on the "Edit Comments" screen.
 */
function wpcom_enqueue_comment_like_script() {
	$screen = get_current_screen();
	if ( $screen && 'edit-comments' === $screen->id ) {
		$script_path = plugin_dir_url( __FILE__ ) . 'wpcom-comments.js';
		wp_enqueue_script( 'wpcom-comments', $script_path, array(), '1.0.0', true );
	}
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_comment_like_script' );
