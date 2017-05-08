<?php

function comment_like_button( $comment_content = '', $comment_object = false ) {
	global $comment;

	$comment_id = get_comment_ID();
	if ( empty( $comment_id ) && !empty( $comment_object->comment_ID ) )
		$comment_id = $comment_object->comment_ID;

	if ( empty( $comment_content ) || empty( $comment_id ) ) {
		return $comment_content;
	}

	$html[] = '\n';

	if ( get_comments_number() < 10 ) {
		// Load iframe directly for posts with a small amount of comments
		$html[] = '<iframe class="comment-likes-widget jetpack-comment-likes-widget" height="55px" width="100%" frameborder="0" src="//widgets.wp.com/notifications"></iframe>';
	} else {
		// Load iframe dynamically for posts with a many comments (see comment-likes.js)
		$html[] =	'<p style="min-height: 55px" id="comment-like-' . esc_attr( $comment_id ) . '" data-liked=' . 'true' . '" class="comment-likes ' . 'liked' . '">';
		$html[] = 'Loading iframe...';
		$html[] =	'</p>';
	}

	// Filter and finalize the comment like button
	$like_button = apply_filters( 'comment_like_button', implode( '', $html ), 'liked' );

	return $comment_content . $like_button;
}

add_filter( 'comment_text', 'comment_like_button', 12, 2 );
wp_enqueue_script( 'jetpack-comment-likes', plugins_url( '_inc/comment-likes.js', JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );
