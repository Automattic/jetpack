<?php
/**
 * Plugin Name: Jetpack MU WPCom Comment Likes
 * Description: Adds a "Like" action to comment rows and enqueues the necessary assets in the admin area.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) && ( ! defined( 'IS_ATOMIC' ) || ! IS_ATOMIC ) ) {
	return;
}

/**
 * Adds a "liked" class to comments that the current user has liked.
 *
 * @param array  $classes    Array of comment classes.
 * @param string $css_class  Unused.
 * @param int    $comment_id The comment ID.
 * @return array Modified array of comment classes.
 */
function wpcom_comments_add_like_class( $classes, $css_class, $comment_id ) {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id = get_current_blog_id();
		$liked   = Likes::comment_like_current_user_likes( $blog_id, $comment_id );
	} else {
		$blog_id  = Jetpack_Options::get_option( 'id' );
		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/comments/$comment_id/likes",
			'v1.1',
			array( 'method' => 'GET' ),
			null,
			'rest'
		);

		// If the request fails, simply return the unmodified classes.
		if ( is_wp_error( $response ) ) {
			return $classes;
		}

		$response_data = json_decode( wp_remote_retrieve_body( $response ), true );

		// If the response doesn't include 'i_like', don't add the class.
		if ( empty( $response_data['i_like'] ) ) {
			return $classes;
		}

		$liked = $response_data['i_like'];
	}

	// Append the 'liked' class if the comment is liked.
	if ( $liked ) {
		$classes[] = 'liked';
	}

	return $classes;
}
add_filter( 'comment_class', 'wpcom_comments_add_like_class', 10, 3 );

/**
 * Adds "Like" and "Unlike" action buttons to comment rows.
 *
 * @param array      $actions Array of actions for the comment.
 * @param WP_Comment $comment The comment object.
 * @return array Modified actions array.
 */
function wpcom_comments_enable_likes( $actions, $comment ) {
	$actions['like'] = sprintf(
		'<button class="button-link comment-like-button" data-comment-id="%d" aria-label="%s">%s</button>',
		$comment->comment_ID,
		esc_attr__( 'Like this comment', 'jetpack-mu-wpcom' ),
		esc_html__( 'Like', 'jetpack-mu-wpcom' )
	);

	$actions['unlike'] = sprintf(
		'<button class="button-link comment-unlike-button" data-comment-id="%d" aria-label="%s">%s</button>',
		$comment->comment_ID,
		esc_attr__( 'Unlike this comment', 'jetpack-mu-wpcom' ),
		esc_html__( 'Liked by you', 'jetpack-mu-wpcom' )
	);

	return $actions;
}
add_filter( 'comment_row_actions', 'wpcom_comments_enable_likes', 10, 2 );

/**
 * Enqueues the comment like assets (JavaScript and CSS) on the Edit Comments screen.
 *
 * @param string $hook The current admin page hook.
 */
function wpcom_enqueue_comment_like_script( $hook ) {
	// Only enqueue assets on the edit-comments screen.
	if ( 'edit-comments.php' !== $hook ) {
		return;
	}

	// Enqueue the assets using the Jetpack MU WPCom helper function.
	jetpack_mu_wpcom_enqueue_assets( 'wpcom-comment-like', array( 'js', 'css' ) );

	// Localize the script with error messages.
	wp_localize_script(
		'jetpack-mu-wpcom-wpcom-comment-like',
		'wpcomCommentLikesData',
		array(
			'post_like_error'     => __( 'Something went wrong when attempting to like that comment. Please try again.', 'jetpack-mu-wpcom' ),
			'post_unlike_error'   => __( 'Something went wrong when attempting to unlike that comment. Please try again.', 'jetpack-mu-wpcom' ),
			'dismiss_notice_text' => __( 'Dismiss this notice', 'jetpack-mu-wpcom' ),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_comment_like_script', 10, 2 );

/**
 * Register an API to handle Likes on Atomic sites.
 */
function wpcom_comments_register_like_api() {
	require_once __DIR__ . '/class-wp-rest-comment-like.php';
	$controller = new WP_REST_Comment_Like();
	$controller->register_routes();
}
if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
	add_action( 'rest_api_init', 'wpcom_comments_register_like_api' );
}
