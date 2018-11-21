<?php
/**
 * Module Name: Private site
 * Module Description: Make your site only visible to you and users you approve.
 * Sort Order: 9
 * First Introduced: ?
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Private
 * Feature: Traffic
 * Additional Search Queries: private, sandbox, launch, unlaunched
 *
 * @package Jetpack
 */

/**
 * Returns the private site template for private blogs
 *
 * @param object $wp Current WordPress environment instance (passed by reference).
 */
function privatize_blog( $wp ) {
	global $pagenow, $current_user, $wpdb;

	if ( '-1' !== get_option( 'blog_public' ) ) {
		return;
	}

	if ( 'wp-login.php' === $pagenow ) {
		return;
	}

	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		return;
	}

	// Serve robots.txt for private blogs.
	if ( is_object( $wp ) && ! empty( $wp->query_vars['robots'] ) ) {
		return;
	}

	if ( $current_user && ( is_super_admin() || is_private_blog_user( $wpdb->blogid, $current_user ) ) ) {
		return;
	}

	remove_action( 'wp_head', array( 'Jetpack_Custom_CSS', 'link_tag' ), 101 );

	if ( file_exists( ABSPATH . 'wp-content/plugins/jetpack/modules/private/private.php' ) ) {
		include ABSPATH . 'wp-content/plugins/jetpack/modules/private/private.php';
	} else {
		esc_html_e( 'This site is private.', 'jetpack' );
	}

	exit;
}

/**
 * Does not check whether the blog is private. Accepts blog and user in various types.
 * Returns true for super admins; if you don't want that, use is_really_private_blog_user.
 *
 * @param int   $blog Current WordPress blod id.
 * @param Mixed $user Current WordPress user or user_id.
 */
function is_private_blog_user( $blog, $user ) {
	global $wpdb;

	if ( ! is_object( $user ) ) {
		$user = new WP_User( $user );
	}

	if ( ! $user->ID ) {
		return false;
	}

	if ( is_numeric( $blog ) ) {
		$blog_id = intval( $blog );
	} elseif ( is_object( $blog ) ) {
		$blog_id = $blog->blog_id;
	} elseif ( is_string( $blog ) ) {
		$blog    = get_blog_info( $blog, '/', 1 );
		$blog_id = $blog->blog_id;
	} else {
		$blog_id = $wpdb->blogid;
	}

	// check if the user has read permissions.
	$the_user = wp_clone( $user );
	$the_user->for_blog( $blog_id );
	return $the_user->has_cap( 'read' );
}

/**
 * Tests whether the current blog is private and not spam/suspended/deleted.
 *
 * @param int $_blog_id Current WordPress blod id.
 */
function is_private_blog( $_blog_id = null ) {
	global $blog_id;

	if ( empty( $_blog_id ) ) {
		$_blog_id = $blog_id;
	}

	$blog_details = get_blog_details( $_blog_id );

	return ( ( '-1' === $blog_details->public ) &&
		( ! isset( $blog_details->deleted ) || ! $blog_details->deleted ) &&
		( ! isset( $blog_details->archived ) || ! $blog_details->archived ) &&
		( ! isset( $blog_details->spam ) || ! $blog_details->spam )
	);
}

/**
 * Filters new comments so that users can't comment on private blogs
 *
 * @param array $comment Documented in wp-includes/comment.php.
 */
function privatize_blog_comments( $comment ) {
	privatize_blog( null );
	return $comment;
}

/**
 * Extend the 'Site Visibility' privacy options to also include a private option
 */
function privatize_blog_priv_selector() {
	?>
	<br /><input id="blog-private" type="radio" name="blog_public" value="-1" <?php checked( '-1', get_option( 'blog_public' ) ); ?> />
	<label for="blog-private"><?php esc_html_e( 'I would like my site to be private, visible only to myself and users I choose', 'jetpack' ); ?></label>
	<?php
}

/**
 * Hides the blog's name on the login form for private blogs.
 */
function privatize_blog_maybe_mask_blog_name() {
	if ( ! is_private_blog() ) {
		return;
	}

	add_filter( 'bloginfo', 'privatize_blog_mask_blog_name', 3, 2 );
}

/**
 * Replaces the the blog's "name" value with "Protected Blog"
 *
 * @see privatize_blog_maybe_mask_blog_name()
 * @param mixed $value The requested non-URL site information.
 * @param mixed $what  Type of information requested.
 */
function privatize_blog_mask_blog_name( $value, $what ) {
	if ( in_array( $what, array( 'name', 'title' ), true ) ) {
		$value = __( 'Protected Blog', 'jetpack' );
	}

	return $value;
}

/**
 * Changes a blog to private
 */
function make_blog_private() {
	update_option( 'blog_public', -1 );
}

/**
 * Changes a blog to public
 */
function make_blog_public() {
	update_option( 'blog_public', 1 );
}

add_action( 'parse_request', 'privatize_blog', 100 );
add_action( 'login_init', 'privatize_blog_maybe_mask_blog_name' );
add_filter( 'preprocess_comment', 'privatize_blog_comments' );
add_action( 'blog_privacy_selector', 'privatize_blog_priv_selector' );
add_action( 'jetpack_activate_module_private', 'make_blog_private' );
add_action( 'jetpack_deactivate_module_private', 'make_blog_public' );

/**
 * Don't let search engines index private sites
 * or sites not deemed publicly available, like deleted, archived, spam.
 *
 * @param string $output Robots.txt output.
 */
function private_robots_txt( $output ) {
	if ( ! is_publicly_available() ) {
		$output  = "User-agent: *\n"; // Purposefully overriding current output; we only want these rules.
		$output .= "Disallow: /\n";
	}

	return $output;
}
add_filter( 'robots_txt', 'private_robots_txt', 10, 2 );

/**
 * Filters the link title attribute for the message displayed in the 'At a Glance' dashboard widget.
 *
 * @param string $text Default attribute text.
 */
function privatize_privacy_on_link_title( $text ) {
	if ( '-1' === get_option( 'blog_public' ) ) {
		return __( 'Your site is visible only to registered members', 'jetpack' );
	}

	return $text;
}
add_filter( 'privacy_on_link_title', 'privatize_privacy_on_link_title' );


/**
 * Filters the link label for the message displayed in the 'At a Glance' dashboard widget.
 *
 * @param string $text Default text.
 */
function privatize_privacy_on_link_text( $text ) {
	if ( '-1' === get_option( 'blog_public' ) ) {
		return __( 'Private', 'jetpack' );
	}

	return $text;
}
add_filter( 'privacy_on_link_text', 'privatize_privacy_on_link_text' );

/**
 * Output the meta tag that tells Pinterest not to allow users to pin
 * content from this page.
 * https://support.pinterest.com/entries/21063792-what-if-i-don-t-want-images-from-my-site-to-be-pinned
 */
function private_no_pinning() {
	echo '<meta name="pinterest" content="nopin" />';
}
add_action( 'wp_head', 'private_no_pinning' );

/**
 * Prevents ajax requests on private blogs for users who don't have permissions
 *
 * @param string    $action The Ajax nonce action.
 * @param false|int $result The result of the nonce check.
 */
function private_blog_ajax_nonce_check( $action, $result ) {
	global $current_user, $wpdb;

	if ( is_super_admin() || ! is_private_blog() ) {
		return;
	}

	if ( 1 !== $result && 2 !== $result ) {
		return;
	}

	if ( 'find-posts' !== $action && 'internal-linking' !== $action ) {
		return;
	}

	// Make sure we are in the right code path, if not bail now.
	if ( ! is_admin() || ( ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) ) {
		return;
	}

	if ( ! is_private_blog_user( $wpdb->blogid, $current_user ) ) {
		wp_die( -1 );
	}
}
add_action( 'check_ajax_referer', 'private_blog_ajax_nonce_check', 9999, 2 );

