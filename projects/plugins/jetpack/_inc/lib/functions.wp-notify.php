<?php
/** phpcs:disable Squiz.Commenting.FileComment.MissingPackageTag,Generic.Commenting.DocComment.MissingShort
 *
 * Declare two functions to handle notification emails to authors and moderators.
 *
 * These functions are hooked into filters to short circuit the regular flow and send the emails.
 * Code was copied from the original pluggable functions and slightly modified (modifications are commented).
 *
 * In the past, we used to overwrite the whole pluggable function, but we started using filters to avoid having
 * to check for Jetpack::is_active() too early in the load flow.
 *
 * @deprecated 13.9 File became unused.
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Redirect;

_deprecated_file( __FILE__, 'jetpack-13.9' );

// phpcs:disable WordPress.WP.I18n.MissingArgDomain --reason: Code copied from Core, so using Core strings.
// phpcs:disable WordPress.Utils.I18nTextDomainFixer.MissingArgDomain --reason: Code copied from Core, so using Core strings.

/**
 * Short circuits the {@see `wp_notify_postauthor`} function via the `comment_notification_recipients` filter.
 *
 * Notify an author (and/or others) of a comment/trackback/pingback on a post.
 *
 * @since 5.8.0
 * @since 9.3.0 Switched from pluggable function to filter callback
 *
 * @param array          $emails List of recipients.
 * @param int|WP_Comment $comment_id Comment ID or WP_Comment object.
 * @return array Empty array to shortcircuit wp_notify_postauthor execution. $emails if we want to disable the filter.
 */
function jetpack_notify_postauthor( $emails, $comment_id ) {
	// Don't do anything if Jetpack isn't connected.
	if ( ! Jetpack::is_connection_ready() || empty( $emails ) ) {
		return $emails;
	}

	// Original function modified: Code before the comment_notification_recipients filter removed.

	$comment = get_comment( $comment_id );
	if ( ! $comment ) {
		return $emails;
	}

	$post   = get_post( $comment->comment_post_ID );
	$author = get_userdata( $post->post_author );

	// Facilitate unsetting below without knowing the keys.
	$emails = array_flip( $emails );

	/** This filter is documented in core/src/wp-includes/pluggable.php */
	$notify_author = apply_filters( 'comment_notification_notify_author', false, $comment->comment_ID );

	// The comment was left by the author.
	if ( $author && ! $notify_author && $comment->user_id === $post->post_author ) {
		unset( $emails[ $author->user_email ] );
	}

	// The author moderated a comment on their own post.
	if ( $author && ! $notify_author && get_current_user_id() === $post->post_author ) {
		unset( $emails[ $author->user_email ] );
	}

	// The post author is no longer a member of the blog.
	if ( $author && ! $notify_author && ! user_can( $post->post_author, 'read_post', $post->ID ) ) {
		unset( $emails[ $author->user_email ] );
	}

	// If there's no email to send the comment to, bail, otherwise flip array back around for use below.
	if ( array() === $emails ) {
		return array(); // Original function modified. Return empty array instead of false.
	} else {
		$emails = array_flip( $emails );
	}

	$switched_locale = switch_to_locale( get_locale() );

	$comment_author_domain = '';
	if ( WP_Http::is_ip_address( $comment->comment_author_IP ) ) {
		$comment_author_domain = gethostbyaddr( $comment->comment_author_IP );
	}

	// The blogname option is escaped with esc_html on the way into the database in sanitize_option
	// we want to reverse this for the plain text arena of emails.
	$blogname        = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
	$comment_content = wp_specialchars_decode( $comment->comment_content );

	// Original function modified.
	$moderate_on_wpcom = ! in_array( // phpcs:ignore WordPress.PHP.StrictInArray.MissingTrueStrict
		false,
		array_map( 'jetpack_notify_is_user_connected_by_email', $emails )
	);

	switch ( $comment->comment_type ) {
		case 'trackback':
			/* translators: 1: Post title */
			$notify_message = sprintf( __( 'New trackback on your post "%s"' ), $post->post_title ) . "\r\n";
			/* translators: 1: Trackback/pingback website name, 2: website IP address, 3: website hostname */
			$notify_message .= sprintf( __( 'Website: %1$s (IP address: %2$s, %3$s)' ), $comment->comment_author, $comment->comment_author_IP, $comment_author_domain ) . "\r\n";
			/* translators: %s: Site URL */
			$notify_message .= sprintf( __( 'URL: %s' ), $comment->comment_author_url ) . "\r\n";
			/* translators: %s: Comment Content */
			$notify_message     .= sprintf( __( 'Comment: %s' ), "\r\n" . $comment_content ) . "\r\n\r\n";
				$notify_message .= __( 'You can see all trackbacks on this post here:' ) . "\r\n";
				/* translators: 1: blog name, 2: post title */
				$subject = sprintf( __( '[%1$s] Trackback: "%2$s"' ), $blogname, $post->post_title );
			break;
		case 'pingback':
			/* translators: 1: Post title */
			$notify_message = sprintf( __( 'New pingback on your post "%s"' ), $post->post_title ) . "\r\n";
			/* translators: 1: Trackback/pingback website name, 2: website IP address, 3: website hostname */
			$notify_message .= sprintf( __( 'Website: %1$s (IP address: %2$s, %3$s)' ), $comment->comment_author, $comment->comment_author_IP, $comment_author_domain ) . "\r\n";
			/* translators: %s: Site URL */
			$notify_message .= sprintf( __( 'URL: %s' ), $comment->comment_author_url ) . "\r\n";
			/* translators: %s: Comment Content */
			$notify_message .= sprintf( __( 'Comment: %s' ), "\r\n" . $comment_content ) . "\r\n\r\n";
			$notify_message .= __( 'You can see all pingbacks on this post here:' ) . "\r\n";
			/* translators: 1: blog name, 2: post title */
			$subject = sprintf( __( '[%1$s] Pingback: "%2$s"' ), $blogname, $post->post_title );
			break;
		default: // Comments.
			/* translators: 1: Post title */
			$notify_message = sprintf( __( 'New comment on your post "%s"' ), $post->post_title ) . "\r\n";
			/* translators: 1: comment author, 2: comment author's IP address, 3: comment author's hostname */
			$notify_message .= sprintf( __( 'Author: %1$s (IP address: %2$s, %3$s)' ), $comment->comment_author, $comment->comment_author_IP, $comment_author_domain ) . "\r\n";
			/* translators: %s: Email address */
			$notify_message .= sprintf( __( 'Email: %s' ), $comment->comment_author_email ) . "\r\n";
			/* translators: %s: Site URL */
			$notify_message .= sprintf( __( 'URL: %s' ), $comment->comment_author_url ) . "\r\n";
			/* translators: %s: Comment Content */
			$notify_message .= sprintf( __( 'Comment: %s' ), "\r\n" . $comment_content ) . "\r\n\r\n";
			$notify_message .= __( 'You can see all comments on this post here:' ) . "\r\n";
			/* translators: 1: blog name, 2: post title */
			$subject = sprintf( __( '[%1$s] Comment: "%2$s"' ), $blogname, $post->post_title );
			break;
	}

	// Original function modified: Consider $moderate_on_wpcom when building $notify_message.
	$notify_message .= $moderate_on_wpcom
		? Redirect::get_url(
			'calypso-comments-all',
			array(
				'path' => $comment->comment_post_ID,
			)
		) . "/\r\n\r\n"
		: get_permalink( $comment->comment_post_ID ) . "#comments\r\n\r\n";

	/* translators: %s: URL */
	$notify_message .= sprintf( __( 'Permalink: %s' ), get_comment_link( $comment ) ) . "\r\n";

	$base_wpcom_edit_comment_url = Redirect::get_url(
		'calypso-edit-comment',
		array(
			'path'  => $comment_id,
			'query' => 'action=__action__', // __action__ will be replaced by the actual action.
		)
	);

	// Original function modified: Consider $moderate_on_wpcom when building $notify_message.
	if ( user_can( $post->post_author, 'edit_comment', $comment->comment_ID ) ) {
		if ( EMPTY_TRASH_DAYS ) {
			$notify_message .= sprintf(
				/* translators: Placeholder is the edit URL */
				__( 'Trash it: %s' ),
				$moderate_on_wpcom
				? str_replace( '__action__', 'trash', $base_wpcom_edit_comment_url )
				: admin_url( "comment.php?action=trash&c={$comment->comment_ID}#wpbody-content" )
			) . "\r\n";
		} else {
			$notify_message .= sprintf(
				/* translators: Placeholder is the edit URL */
				__( 'Delete it: %s' ),
				$moderate_on_wpcom
				? str_replace( '__action__', 'delete', $base_wpcom_edit_comment_url )
				: admin_url( "comment.php?action=delete&c={$comment->comment_ID}#wpbody-content" )
			) . "\r\n";
		}
		$notify_message .= sprintf(
			/* translators: Placeholder is the edit URL */
			__( 'Spam it: %s' ),
			$moderate_on_wpcom
			? str_replace( '__action__', 'spam', $base_wpcom_edit_comment_url )
			: admin_url( "comment.php?action=spam&c={$comment->comment_ID}#wpbody-content" )
		) . "\r\n";
	}

	$wp_email = 'wordpress@' . preg_replace( '#^www\.#', '', strtolower( isset( $_SERVER['SERVER_NAME'] ) ? filter_var( wp_unslash( $_SERVER['SERVER_NAME'] ) ) : '' ) );

	if ( '' === $comment->comment_author ) {
		$from = "From: \"$blogname\" <$wp_email>";
		if ( '' !== $comment->comment_author_email ) {
			$reply_to = "Reply-To: $comment->comment_author_email";
		}
	} else {
		$from = "From: \"$comment->comment_author\" <$wp_email>";
		if ( '' !== $comment->comment_author_email ) {
			$reply_to = "Reply-To: \"$comment->comment_author_email\" <$comment->comment_author_email>";
		}
	}

	$message_headers = "$from\n"
		. 'Content-Type: text/plain; charset="' . get_option( 'blog_charset' ) . "\"\n";

	if ( isset( $reply_to ) ) {
		$message_headers .= $reply_to . "\n";
	}

	/** This filter is documented in core/src/wp-includes/pluggable.php */
	$notify_message = apply_filters( 'comment_notification_text', $notify_message, $comment->comment_ID );

	/** This filter is documented in core/src/wp-includes/pluggable.php */
	$subject = apply_filters( 'comment_notification_subject', $subject, $comment->comment_ID );

	/** This filter is documented in core/src/wp-includes/pluggable.php */
	$message_headers = apply_filters( 'comment_notification_headers', $message_headers, $comment->comment_ID );

	foreach ( $emails as $email ) {
		wp_mail( $email, wp_specialchars_decode( $subject ), $notify_message, $message_headers );
	}

	if ( $switched_locale ) {
		restore_previous_locale();
	}

	return array();
}

/**
 * Short circuits the {@see `wp_notify_moderator`} function via the `notify_moderator` filter.
 *
 * Notifies the moderator of the site about a new comment that is awaiting approval.
 *
 * @since 5.8.0
 * @since 9.2.0 Switched from pluggable function to filter callback
 * @since 9.5.0 Updated the passing condition to call get_option( 'moderation_notify' ); directly.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param string $notify_moderator The value of the moderation_notify option OR if the comment is awaiting moderation.
 * @param int    $comment_id Comment ID.
 * @return boolean Returns false to shortcircuit the execution of wp_notify_moderator
 */
function jetpack_notify_moderator( $notify_moderator, $comment_id ) {
	/*
	 * $notify_moderator is a tricky one. This filter is called in two places in Core. One is just to pass if a comment
	 * is being held for moderation. See https://core.trac.wordpress.org/browser/tags/5.6/src/wp-includes/comment.php#L2296
	 *
	 * So we can't just assume that a true value here is what we need. The second time the filter is called, it checks
	 * the option -- which is what we expected here. See https://core.trac.wordpress.org/browser/tags/5.6/src/wp-includes/pluggable.php#L1737
	 *
	 * It's possible another plugin would be filtering this value to true despite the option setting; however, since we're running at priority 1,
	 * they can still do that. They'll just get the Core flow instead of this one.
	 */

	// If Jetpack is not active, or if Notify moderators options is not set, let the default flow go on.
	if ( ! $notify_moderator || ! get_option( 'moderation_notify' ) || ! Jetpack::is_connection_ready() ) {
		return $notify_moderator;
	}

	// Original function modified: Removed code before the notify_moderator filter.

	global $wpdb;

	$comment = get_comment( $comment_id );
	if ( ! $comment ) {
		return $notify_moderator;
	}

	$post = get_post( $comment->comment_post_ID );
	$user = get_userdata( $post->post_author );
	// Send to the administration and to the post author if the author can modify the comment.
	$emails = array( get_option( 'admin_email' ) );
	if ( $user && user_can( $user->ID, 'edit_comment', $comment_id ) && ! empty( $user->user_email ) ) {
		if ( 0 !== strcasecmp( $user->user_email, get_option( 'admin_email' ) ) ) {
			$emails[] = $user->user_email;
		}
	}

	$switched_locale = switch_to_locale( get_locale() );

	$comment_author_domain = '';
	if ( WP_Http::is_ip_address( $comment->comment_author_IP ) ) {
		$comment_author_domain = gethostbyaddr( $comment->comment_author_IP );
	}
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$comments_waiting = (int) $wpdb->get_var( "SELECT count(comment_ID) FROM $wpdb->comments WHERE comment_approved = '0'" );

	// The blogname option is escaped with esc_html on the way into the database in sanitize_option
	// we want to reverse this for the plain text arena of emails.
	$blogname        = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
	$comment_content = wp_specialchars_decode( $comment->comment_content );

	switch ( $comment->comment_type ) {
		case 'trackback':
			/* translators: 1: Post title */
			$notify_message  = sprintf( __( 'A new trackback on the post "%s" is waiting for your approval' ), $post->post_title ) . "\r\n";
			$notify_message .= get_permalink( $comment->comment_post_ID ) . "\r\n\r\n";
			/* translators: 1: Trackback/pingback website name, 2: website IP address, 3: website hostname */
			$notify_message .= sprintf( __( 'Website: %1$s (IP address: %2$s, %3$s)' ), $comment->comment_author, $comment->comment_author_IP, $comment_author_domain ) . "\r\n";
			/* translators: 1: Trackback/pingback/comment author URL */
			$notify_message .= sprintf( __( 'URL: %s' ), $comment->comment_author_url ) . "\r\n";
			$notify_message .= __( 'Trackback excerpt: ' ) . "\r\n" . $comment_content . "\r\n\r\n";
			break;
		case 'pingback':
			/* translators: 1: Post title */
			$notify_message  = sprintf( __( 'A new pingback on the post "%s" is waiting for your approval' ), $post->post_title ) . "\r\n";
			$notify_message .= get_permalink( $comment->comment_post_ID ) . "\r\n\r\n";
			/* translators: 1: Trackback/pingback website name, 2: website IP address, 3: website hostname */
			$notify_message .= sprintf( __( 'Website: %1$s (IP address: %2$s, %3$s)' ), $comment->comment_author, $comment->comment_author_IP, $comment_author_domain ) . "\r\n";
			/* translators: 1: Trackback/pingback/comment author URL */
			$notify_message .= sprintf( __( 'URL: %s' ), $comment->comment_author_url ) . "\r\n";
			$notify_message .= __( 'Pingback excerpt: ' ) . "\r\n" . $comment_content . "\r\n\r\n";
			break;
		default: // Comments.
			/* translators: 1: Post title */
			$notify_message  = sprintf( __( 'A new comment on the post "%s" is waiting for your approval' ), $post->post_title ) . "\r\n";
			$notify_message .= get_permalink( $comment->comment_post_ID ) . "\r\n\r\n";
			/* translators: 1: Comment author name, 2: comment author's IP address, 3: comment author's hostname */
			$notify_message .= sprintf( __( 'Author: %1$s (IP address: %2$s, %3$s)' ), $comment->comment_author, $comment->comment_author_IP, $comment_author_domain ) . "\r\n";
			/* translators: 1: Comment author URL */
			$notify_message .= sprintf( __( 'Email: %s' ), $comment->comment_author_email ) . "\r\n";
			/* translators: 1: Trackback/pingback/comment author URL */
			$notify_message .= sprintf( __( 'URL: %s' ), $comment->comment_author_url ) . "\r\n";
			/* translators: 1: Comment text */
			$notify_message .= sprintf( __( 'Comment: %s' ), "\r\n" . $comment_content ) . "\r\n\r\n";
			break;
	}

	/** This filter is documented in core/src/wp-includes/pluggable.php */
	$emails = apply_filters( 'comment_moderation_recipients', $emails, $comment_id );

	// Original function modified.
	$moderate_on_wpcom = ! in_array( // phpcs:ignore WordPress.PHP.StrictInArray.MissingTrueStrict
		false,
		array_map( 'jetpack_notify_is_user_connected_by_email', $emails )
	);

	$base_wpcom_edit_comment_url = Redirect::get_url(
		'calypso-edit-comment',
		array(
			'path'  => $comment_id,
			'query' => 'action=__action__', // __action__ will be replaced by the actual action.
		)
	);

	// Original function modified: Consider $moderate_on_wpcom when building $notify_message.
	$notify_message .= sprintf(
		/* translators: Comment moderation. 1: Comment action URL */
		__( 'Approve it: %s' ),
		$moderate_on_wpcom
		? str_replace( '__action__', 'approve', $base_wpcom_edit_comment_url )
		: admin_url( "comment.php?action=approve&c={$comment_id}#wpbody-content" )
	) . "\r\n";

	if ( EMPTY_TRASH_DAYS ) {
		$notify_message .= sprintf(
			/* translators: Comment moderation. 1: Comment action URL */
			__( 'Trash it: %s' ),
			$moderate_on_wpcom
			? str_replace( '__action__', 'trash', $base_wpcom_edit_comment_url )
			: admin_url( "comment.php?action=trash&c={$comment_id}#wpbody-content" )
		) . "\r\n";
	} else {
		$notify_message .= sprintf(
			/* translators: Comment moderation. 1: Comment action URL */
			__( 'Delete it: %s' ),
			$moderate_on_wpcom
			? str_replace( '__action__', 'delete', $base_wpcom_edit_comment_url )
			: admin_url( "comment.php?action=delete&c={$comment_id}#wpbody-content" )
		) . "\r\n";
	}

	$notify_message .= sprintf(
		/* translators: Comment moderation. 1: Comment action URL */
		__( 'Spam it: %s' ),
		$moderate_on_wpcom
		? str_replace( '__action__', 'spam', $base_wpcom_edit_comment_url )
		: admin_url( "comment.php?action=spam&c={$comment_id}#wpbody-content" )
	) . "\r\n";

	$notify_message .= sprintf(
		/* translators: Comment moderation. 1: Number of comments awaiting approval */
		_n(
			'Currently %s comment is waiting for approval. Please visit the moderation panel:',
			'Currently %s comments are waiting for approval. Please visit the moderation panel:',
			$comments_waiting
		),
		number_format_i18n( $comments_waiting )
	) . "\r\n";

	$notify_message .= $moderate_on_wpcom
		? Redirect::get_url( 'calypso-comments-pending' )
		: admin_url( 'edit-comments.php?comment_status=moderated#wpbody-content' ) . "\r\n";

	/* translators: Comment moderation notification email subject. 1: Site name, 2: Post title */
	$subject         = sprintf( __( '[%1$s] Please moderate: "%2$s"' ), $blogname, $post->post_title );
	$message_headers = '';

	/** This filter is documented in core/src/wp-includes/pluggable.php */
	$notify_message = apply_filters( 'comment_moderation_text', $notify_message, $comment_id );

	/** This filter is documented in core/src/wp-includes/pluggable.php */
	$subject = apply_filters( 'comment_moderation_subject', $subject, $comment_id );

	/** This filter is documented in core/src/wp-includes/pluggable.php */
	$message_headers = apply_filters( 'comment_moderation_headers', $message_headers, $comment_id );

	foreach ( $emails as $email ) {
		wp_mail( $email, wp_specialchars_decode( $subject ), $notify_message, $message_headers );
	}

	if ( $switched_locale ) {
		restore_previous_locale();
	}

	return false;
}

/**
 * Gets an user by email and verify if it's connected
 *
 * @param string $email The user email.
 * @return boolean
 */
function jetpack_notify_is_user_connected_by_email( $email ) {
	$user = get_user_by( 'email', $email );
	return ( new Connection_Manager( 'jetpack' ) )->is_user_connected( $user->ID );
}
