<?php

function comment_likes( $content, $comment = null ) {
	if ( empty( $comment ) ) {
		return $content;
	}

	$blog_id   = Jetpack_Options::get_option( 'id' );
	$url       = home_url();
	$url_parts = parse_url( $url );
	$domain    = $url_parts['host'];

	$comment_id = get_comment_ID();
	if ( empty( $comment_id ) && ! empty( $comment->comment_ID ) ) {
		$comment_id = $comment->comment_ID;
	}

	if ( empty( $content ) || empty( $comment_id ) ) {
		return $content;
	}

	// make sure to include the scripts before the iframe otherwise weird things happen
	// add_action( 'wp_footer', array( 'likes_master' ), 21 );
	// for now rely on module/likes.php L854 to load the master iframe

	$uniqid = uniqid();

	$src     = sprintf( '//widgets.wp.com/likes/#blog_id=%1$d&amp;comment_id=%2$d&amp;origin=%3$s&amp;obj_id=%1$d-%2$d-%4$s', $blog_id, $comment_id, $domain, $uniqid );
	$name    = sprintf( 'like-comment-frame-%1$d-%2$d-%3$s', $blog_id, $comment_id, $uniqid );
	$wrapper = sprintf( 'like-comment-wrapper-%1$d-%2$d-%3$s', $blog_id, $comment_id, $uniqid );

	$html[] = "<div class='jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded' id='$wrapper' data-src='$src' data-name='$name'>";
	$html[] = "<div class='likes-widget-placeholder comment-likes-widget-placeholder comment-likes'><span class=\"loading\">" . esc_html__( 'Loading...', 'jetpack' ) . "</span> </div>";
	$html[] = "<div class='comment-likes-widget jetpack-likes-widget comment-likes'><span class='comment-like-feedback'></span>";
	$html[] = '</div></div>';

	// Filter and finalize the comment like button
	$like_button = apply_filters( 'comment_like_button', implode( '', $html ), '' );

	return $content . $like_button;
}

add_filter( 'comment_text', 'comment_likes', 10, 2 );
