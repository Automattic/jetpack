<?php

if ( ! function_exists( 'wp_notify_postauthor' ) && Jetpack::is_active() ) :
	/**
	 * Notify an author (and/or others) of a comment/trackback/pingback on a post.
	 *
	 * @since 1.0.0
	 *
	 * @param int|WP_Comment  $comment_id Comment ID or WP_Comment object.
	 * @param string          $deprecated Not used
	 * @return bool True on completion. False if no email addresses were specified.
	 */
	function wp_notify_postauthor( $comment_id, $deprecated = null ) {
		if ( null !== $deprecated ) {
			_deprecated_argument( __FUNCTION__, '3.8.0' );
		}

		$comment = get_comment( $comment_id );

		if ( empty( $comment ) || empty( $comment->comment_post_ID ) ) {
			return false;
		}

		$post   = get_post( $comment->comment_post_ID );
		$author = get_userdata( $post->post_author );

		// Who to notify? By default, just the post author, but others can be added.
		$emails = array();
		if ( $author ) {
			$emails[] = $author->user_email;
		}

		/** This filter is documented in core/src/wp-includes/pluggable.php */
		$emails = apply_filters( 'comment_notification_recipients', $emails, $comment->comment_ID );
		$emails = array_filter( $emails );

		// If there are no addresses to send the comment to, bail.
		if ( ! count( $emails ) ) {
			return false;
		}

		// Facilitate unsetting below without knowing the keys.
		$emails = array_flip( $emails );

		/** This filter is documented in core/src/wp-includes/pluggable.php */
		$notify_author = apply_filters( 'comment_notification_notify_author', false, $comment->comment_ID );

		// The comment was left by the author
		if ( $author && ! $notify_author && $comment->user_id == $post->post_author ) {
			unset( $emails[ $author->user_email ] );
		}

		// The author moderated a comment on their own post
		if ( $author && ! $notify_author && $post->post_author == get_current_user_id() ) {
			unset( $emails[ $author->user_email ] );
		}

		// The post author is no longer a member of the blog
		if ( $author && ! $notify_author && ! user_can( $post->post_author, 'read_post', $post->ID ) ) {
			unset( $emails[ $author->user_email ] );
		}

		// If there's no email to send the comment to, bail, otherwise flip array back around for use below
		if ( ! count( $emails ) ) {
			return false;
		} else {
			$emails = array_flip( $emails );
		}

		$switched_locale = switch_to_locale( get_locale() );

		$comment_author_domain = @gethostbyaddr( $comment->comment_author_IP );

		// The blogname option is escaped with esc_html on the way into the database in sanitize_option
		// we want to reverse this for the plain text arena of emails.
		$blogname        = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
		$comment_content = wp_specialchars_decode( $comment->comment_content );

		function is_user_connected( $email ) {
			$user = get_user_by( 'email', $email );
			return Jetpack::is_user_connected( $user->ID );
		}

		$moderate_on_wpcom = ! in_array( false, array_map( 'is_user_connected', $emails ) );

		$primary_site_slug = Jetpack::build_raw_urls( get_home_url() );

		switch ( $comment->comment_type ) {
			case 'trackback':
				/* translators: 1: Post title */
				$notify_message = sprintf( __( 'New trackback on your post "%s"' ), $post->post_title ) . "\r\n";
				/* translators: 1: Trackback/pingback website name, 2: website IP address, 3: website hostname */
				$notify_message     .= sprintf( __( 'Website: %1$s (IP address: %2$s, %3$s)' ), $comment->comment_author, $comment->comment_author_IP, $comment_author_domain ) . "\r\n";
				$notify_message     .= sprintf( __( 'URL: %s' ), $comment->comment_author_url ) . "\r\n";
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
				$notify_message .= sprintf( __( 'URL: %s' ), $comment->comment_author_url ) . "\r\n";
				$notify_message .= sprintf( __( 'Comment: %s' ), "\r\n" . $comment_content ) . "\r\n\r\n";
				$notify_message .= __( 'You can see all pingbacks on this post here:' ) . "\r\n";
				/* translators: 1: blog name, 2: post title */
				$subject = sprintf( __( '[%1$s] Pingback: "%2$s"' ), $blogname, $post->post_title );
				break;
			default: // Comments
				$notify_message = sprintf( __( 'New comment on your post "%s"' ), $post->post_title ) . "\r\n";
				/* translators: 1: comment author, 2: comment author's IP address, 3: comment author's hostname */
				$notify_message .= sprintf( __( 'Author: %1$s (IP address: %2$s, %3$s)' ), $comment->comment_author, $comment->comment_author_IP, $comment_author_domain ) . "\r\n";
				$notify_message .= sprintf( __( 'Email: %s' ), $comment->comment_author_email ) . "\r\n";
				$notify_message .= sprintf( __( 'URL: %s' ), $comment->comment_author_url ) . "\r\n";
				$notify_message .= sprintf( __( 'Comment: %s' ), "\r\n" . $comment_content ) . "\r\n\r\n";
				$notify_message .= __( 'You can see all comments on this post here:' ) . "\r\n";
				/* translators: 1: blog name, 2: post title */
				$subject = sprintf( __( '[%1$s] Comment: "%2$s"' ), $blogname, $post->post_title );
				break;
		}

		$notify_message .= $moderate_on_wpcom
			? "https://wordpress.com/comments/all/{$primary_site_slug}/{$comment->comment_post_ID}/\r\n\r\n"
			: get_permalink( $comment->comment_post_ID ) . "#comments\r\n\r\n";

		$notify_message .= sprintf( __( 'Permalink: %s' ), get_comment_link( $comment ) ) . "\r\n";

		if ( user_can( $post->post_author, 'edit_comment', $comment->comment_ID ) ) {
			if ( EMPTY_TRASH_DAYS ) {
				$notify_message .= sprintf(
					__( 'Trash it: %s' ), $moderate_on_wpcom
					? "https://wordpress.com/comment/{$primary_site_slug}/{$comment_id}?action=trash"
					: admin_url( "comment.php?action=trash&c={$comment->comment_ID}#wpbody-content" )
				) . "\r\n";
			} else {
				$notify_message .= sprintf(
					__( 'Delete it: %s' ), $moderate_on_wpcom
					? "https://wordpress.com/comment/{$primary_site_slug}/{$comment_id}?action=delete"
					: admin_url( "comment.php?action=delete&c={$comment->comment_ID}#wpbody-content" )
				) . "\r\n";
			}
			$notify_message .= sprintf(
				__( 'Spam it: %s' ), $moderate_on_wpcom ?
				"https://wordpress.com/comment/{$primary_site_slug}/{$comment_id}?action=spam"
				: admin_url( "comment.php?action=spam&c={$comment->comment_ID}#wpbody-content" )
			) . "\r\n";
		}

		$wp_email = 'wordpress@' . preg_replace( '#^www\.#', '', strtolower( $_SERVER['SERVER_NAME'] ) );

		if ( '' == $comment->comment_author ) {
			$from = "From: \"$blogname\" <$wp_email>";
			if ( '' != $comment->comment_author_email ) {
				$reply_to = "Reply-To: $comment->comment_author_email";
			}
		} else {
			$from = "From: \"$comment->comment_author\" <$wp_email>";
			if ( '' != $comment->comment_author_email ) {
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
			@wp_mail( $email, wp_specialchars_decode( $subject ), $notify_message, $message_headers );
		}

		if ( $switched_locale ) {
			restore_previous_locale();
		}

		return true;
	}
endif;

if ( ! function_exists( 'wp_notify_moderator' ) && Jetpack::is_active() ) :
	/**
	 * Notifies the moderator of the site about a new comment that is awaiting approval.
	 *
	 * @since 1.0.0
	 *
	 * @global wpdb $wpdb WordPress database abstraction object.
	 *
	 * Uses the {@see 'notify_moderator'} filter to determine whether the site moderator
	 * should be notified, overriding the site setting.
	 *
	 * @param int $comment_id Comment ID.
	 * @return true Always returns true.
	 */
	function wp_notify_moderator( $comment_id ) {
		global $wpdb;

		$maybe_notify = get_option( 'moderation_notify' );

		/** This filter is documented in core/src/wp-includes/pluggable.php */
		$maybe_notify = apply_filters( 'notify_moderator', $maybe_notify, $comment_id );

		if ( ! $maybe_notify ) {
			return true;
		}

		$comment = get_comment( $comment_id );
		$post    = get_post( $comment->comment_post_ID );
		$user    = get_userdata( $post->post_author );
		// Send to the administration and to the post author if the author can modify the comment.
		$emails = array( get_option( 'admin_email' ) );
		if ( $user && user_can( $user->ID, 'edit_comment', $comment_id ) && ! empty( $user->user_email ) ) {
			if ( 0 !== strcasecmp( $user->user_email, get_option( 'admin_email' ) ) ) {
				$emails[] = $user->user_email;
			}
		}

		$switched_locale = switch_to_locale( get_locale() );

		$comment_author_domain = @gethostbyaddr( $comment->comment_author_IP );
		$comments_waiting      = $wpdb->get_var( "SELECT count(comment_ID) FROM $wpdb->comments WHERE comment_approved = '0'" );

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
			default: // Comments
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

		function is_user_connected( $email ) {
			$user = get_user_by( 'email', $email );
			return Jetpack::is_user_connected( $user->ID );
		}

		$moderate_on_wpcom = ! in_array( false, array_map( 'is_user_connected', $emails ) );

		$primary_site_slug = Jetpack::build_raw_urls( get_home_url() );

		/* translators: Comment moderation. 1: Comment action URL */
		$notify_message .= sprintf(
			__( 'Approve it: %s' ), $moderate_on_wpcom
			? "https://wordpress.com/comment/{$primary_site_slug}/{$comment_id}?action=approve"
			: admin_url( "comment.php?action=approve&c={$comment_id}#wpbody-content" )
		) . "\r\n";

		if ( EMPTY_TRASH_DAYS ) {
			/* translators: Comment moderation. 1: Comment action URL */
			$notify_message .= sprintf(
				__( 'Trash it: %s' ), $moderate_on_wpcom
				? "https://wordpress.com/comment/{$primary_site_slug}/{$comment_id}?action=trash"
				: admin_url( "comment.php?action=trash&c={$comment_id}#wpbody-content" )
			) . "\r\n";
		} else {
			/* translators: Comment moderation. 1: Comment action URL */
			$notify_message .= sprintf(
				__( 'Delete it: %s' ), $moderate_on_wpcom
				? "https://wordpress.com/comment/{$primary_site_slug}/{$comment_id}?action=delete"
				: admin_url( "comment.php?action=delete&c={$comment_id}#wpbody-content" )
			) . "\r\n";
		}

		/* translators: Comment moderation. 1: Comment action URL */
		$notify_message .= sprintf(
			__( 'Spam it: %s' ), $moderate_on_wpcom
			? "https://wordpress.com/comment/{$primary_site_slug}/{$comment_id}?action=spam"
			: admin_url( "comment.php?action=spam&c={$comment_id}#wpbody-content" )
		) . "\r\n";

		/* translators: Comment moderation. 1: Number of comments awaiting approval */
		$notify_message .= sprintf(
			_n(
				'Currently %s comment is waiting for approval. Please visit the moderation panel:',
				'Currently %s comments are waiting for approval. Please visit the moderation panel:', $comments_waiting
			), number_format_i18n( $comments_waiting )
		) . "\r\n";

		$notify_message .= $moderate_on_wpcom
			? "https://wordpress.com/comments/pending/{$primary_site_slug}/"
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
			@wp_mail( $email, wp_specialchars_decode( $subject ), $notify_message, $message_headers );
		}

		if ( $switched_locale ) {
			restore_previous_locale();
		}

		return true;
	}
endif;
